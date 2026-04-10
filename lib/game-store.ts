import { airportIds, getAirportById } from "./airports";
import { estimateFlightDurationMinutesBetween } from "./flightDuration";
import type { DirectedRoute, FlightSchedule, GamePayload, GameSnapshot, Player } from "./types";

/**
 * Single global room (one game at a time). In-memory only.
 *
 * On Vercel, serverless instances do not share memory. For production, replace
 * this module with Vercel KV, Upstash Redis, or another shared store so all
 * requests see the same state.
 */
const room: GameSnapshot = {
  phase: "lobby",
  hostId: null,
  players: [],
  game: null,
};

function findPlayer(id: string): Player | undefined {
  return room.players.find((p) => p.id === id);
}

function cloneGame(game: GamePayload): GamePayload {
  return {
    startedAt: game.startedAt,
    tick: game.tick,
    routesByPlayer: Object.fromEntries(
      Object.entries(game.routesByPlayer ?? {}).map(([pid, routes]) => [
        pid,
        routes.map((r) => ({ ...r })),
      ])
    ),
    flightSchedulesByPlayer: Object.fromEntries(
      Object.entries(game.flightSchedulesByPlayer ?? {}).map(([pid, list]) => [
        pid,
        list.map((s) => ({ ...s, weekdays: [...s.weekdays] })),
      ])
    ),
  };
}

export function getSnapshot(): GameSnapshot {
  return {
    phase: room.phase,
    hostId: room.hostId,
    players: [...room.players],
    game: room.game ? cloneGame(room.game) : null,
  };
}

export function joinLobby(
  playerId: string,
  name: string,
  asHost: boolean
): { ok: true } | { ok: false; error: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Name is required." };
  }
  if (room.phase !== "lobby") {
    return { ok: false, error: "The game already started. You can only watch." };
  }
  if (findPlayer(playerId)) {
    return { ok: false, error: "You are already in this room." };
  }
  if (asHost) {
    if (room.hostId) {
      return { ok: false, error: "A host is already assigned." };
    }
    room.hostId = playerId;
  }
  room.players.push({ id: playerId, name: trimmed });
  return { ok: true };
}

export function becomeHost(playerId: string): { ok: true } | { ok: false; error: string } {
  if (room.phase !== "lobby") {
    return { ok: false, error: "You can only become host while in the lobby." };
  }
  if (!findPlayer(playerId)) {
    return { ok: false, error: "Join the lobby before claiming host." };
  }
  if (room.hostId !== null) {
    return { ok: false, error: "A host is already assigned." };
  }
  room.hostId = playerId;
  return { ok: true };
}

export function startGame(playerId: string): { ok: true } | { ok: false; error: string } {
  if (room.phase !== "lobby") {
    return { ok: false, error: "The game is not in the lobby." };
  }
  if (room.hostId !== playerId) {
    return { ok: false, error: "Only the host can start the game." };
  }
  if (room.players.length < 1) {
    return { ok: false, error: "Need at least one player in the lobby." };
  }
  const payload: GamePayload = {
    startedAt: Date.now(),
    tick: 0,
    routesByPlayer: {},
    flightSchedulesByPlayer: {},
  };
  room.phase = "playing";
  room.game = payload;
  return { ok: true };
}

export function endGame(playerId: string): { ok: true } | { ok: false; error: string } {
  if (room.phase !== "playing") {
    return { ok: false, error: "No game is running." };
  }
  if (room.hostId !== playerId) {
    return { ok: false, error: "Only the host can end the game." };
  }
  room.phase = "lobby";
  room.game = null;
  room.hostId = null;
  room.players = [];
  return { ok: true };
}

function routeKey(fromId: string, toId: string): string {
  return `${fromId}>${toId}`;
}

/**
 * For each selected destination, adds two directed routes: origin → dest and dest → origin.
 * Skips any leg that already exists for this player.
 */
export function createRoutesFromHub(
  playerId: string,
  originId: string,
  destinationIds: string[]
): { ok: true; added: number } | { ok: false; error: string } {
  if (room.phase !== "playing" || !room.game) {
    return { ok: false, error: "The simulation is not running." };
  }
  if (!findPlayer(playerId)) {
    return { ok: false, error: "You are not in this room." };
  }
  const valid = airportIds();
  if (!valid.has(originId)) {
    return { ok: false, error: "Unknown origin airport." };
  }
  if (!Array.isArray(destinationIds) || destinationIds.length === 0) {
    return { ok: false, error: "Pick at least one destination." };
  }

  const game = room.game;
  const list = game.routesByPlayer[playerId] ? [...game.routesByPlayer[playerId]] : [];
  const existing = new Set(list.map((r) => routeKey(r.fromId, r.toId)));

  let added = 0;
  for (const raw of destinationIds) {
    if (typeof raw !== "string" || !valid.has(raw)) {
      return { ok: false, error: "Unknown destination airport." };
    }
    if (raw === originId) {
      continue;
    }
    const fromA = getAirportById(originId);
    const toA = getAirportById(raw);
    if (!fromA || !toA) {
      return { ok: false, error: "Unknown airport for route." };
    }
    const legMinutes = estimateFlightDurationMinutesBetween(fromA, toA);

    const outKey = routeKey(originId, raw);
    if (!existing.has(outKey)) {
      list.push({
        id: crypto.randomUUID(),
        fromId: originId,
        toId: raw,
        durationMinutes: legMinutes,
      });
      existing.add(outKey);
      added += 1;
    }
    const backKey = routeKey(raw, originId);
    if (!existing.has(backKey)) {
      list.push({
        id: crypto.randomUUID(),
        fromId: raw,
        toId: originId,
        durationMinutes: legMinutes,
      });
      existing.add(backKey);
      added += 1;
    }
  }

  if (added === 0) {
    return { ok: false, error: "No new routes to add (already linked or only the hub selected)." };
  }

  game.routesByPlayer[playerId] = list;
  return { ok: true, added };
}

function hasDirectedRoute(playerId: string, fromId: string, toId: string): DirectedRoute | undefined {
  const game = room.game;
  if (!game) return undefined;
  return (game.routesByPlayer[playerId] ?? []).find((r) => r.fromId === fromId && r.toId === toId);
}

export function saveFlightSchedule(
  playerId: string,
  data: {
    fromId: string;
    toId: string;
    flightNumber: string;
    hour12: number;
    minute: number;
    amPm: string;
    weekdays: number[];
  }
): { ok: true } | { ok: false; error: string } {
  if (room.phase !== "playing" || !room.game) {
    return { ok: false, error: "The simulation is not running." };
  }
  if (!findPlayer(playerId)) {
    return { ok: false, error: "You are not in this room." };
  }

  const route = hasDirectedRoute(playerId, data.fromId, data.toId);
  if (!route) {
    return { ok: false, error: "You do not have this route." };
  }

  const fn = data.flightNumber.trim().toUpperCase();
  if (!fn || !/^GA\d+$/i.test(fn)) {
    return { ok: false, error: "Flight number must look like GA1, GA2, …" };
  }

  if (data.hour12 < 1 || data.hour12 > 12 || ![0, 30].includes(data.minute)) {
    return { ok: false, error: "Invalid departure time." };
  }

  const ap = data.amPm.toUpperCase();
  if (ap !== "AM" && ap !== "PM") {
    return { ok: false, error: "Select AM or PM." };
  }

  const days = [...new Set(data.weekdays)]
    .filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  if (days.length === 0) {
    return { ok: false, error: "Pick at least one day of the week (or Daily)." };
  }

  const game = room.game;
  const schedules = [...(game.flightSchedulesByPlayer[playerId] ?? [])];
  for (const s of schedules) {
    if (s.flightNumber.trim().toUpperCase() === fn) {
      return { ok: false, error: "That flight number is already in use." };
    }
  }

  schedules.push({
    id: crypto.randomUUID(),
    fromId: data.fromId,
    toId: data.toId,
    flightNumber: fn,
    hour12: data.hour12,
    minute: data.minute as 0 | 30,
    amPm: ap as "AM" | "PM",
    weekdays: days as FlightSchedule["weekdays"],
    durationMinutes: route.durationMinutes,
  });

  game.flightSchedulesByPlayer[playerId] = schedules;
  return { ok: true };
}
