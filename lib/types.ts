export type GamePhase = "lobby" | "playing";

export type Player = {
  id: string;
  name: string;
};

/** One directed leg between two airports (e.g. JFK → LHR). */
export type DirectedRoute = {
  id: string;
  fromId: string;
  toId: string;
  /** Block time in minutes (multiple of 30), from distance + takeoff/landing allowance. */
  durationMinutes: number;
};

/** Weekday index: Monday = 0 … Sunday = 6. */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type FlightSchedule = {
  id: string;
  fromId: string;
  toId: string;
  flightNumber: string;
  hour12: number;
  minute: 0 | 30;
  amPm: "AM" | "PM";
  weekdays: WeekdayIndex[];
  durationMinutes: number;
};

export type GamePayload = {
  startedAt: number;
  tick: number;
  routesByPlayer: Record<string, DirectedRoute[]>;
  flightSchedulesByPlayer: Record<string, FlightSchedule[]>;
};

export type GameSnapshot = {
  phase: GamePhase;
  hostId: string | null;
  players: Player[];
  game: GamePayload | null;
};

export type ClientGameView = GameSnapshot & {
  yourPlayerId: string | null;
  youAreHost: boolean;
  youArePlayer: boolean;
  canJoinLobby: boolean;
  mustObserve: boolean;
};
