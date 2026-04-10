import { airportIds } from "./airports";
import type { GamePayload, GameSnapshot, Player } from "./types";

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

function normalizePair(airportA: string, airportB: string): { a: string; b: string } {
  return airportA < airportB ? { a: airportA, b: airportB } : { a: airportB, b: airportA };
}

/**
 * For each selected destination, adds one undirected pair (representing A↔B service).
 * Duplicate pairs for that player are ignored.
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
  const existing = new Set(list.map((r) => `${r.a}|${r.b}`));

  let added = 0;
  for (const raw of destinationIds) {
    if (typeof raw !== "string" || !valid.has(raw)) {
      return { ok: false, error: "Unknown destination airport." };
    }
    if (raw === originId) {
      continue;
    }
    const { a, b } = normalizePair(originId, raw);
    const key = `${a}|${b}`;
    if (existing.has(key)) {
      continue;
    }
    list.push({ id: crypto.randomUUID(), a, b });
    existing.add(key);
    added += 1;
  }

  if (added === 0) {
    return { ok: false, error: "No new routes to add (already linked or only the hub selected)." };
  }

  game.routesByPlayer[playerId] = list;
  return { ok: true, added };
}
