export type GamePhase = "lobby" | "playing";

export type Player = {
  id: string;
  name: string;
};

/** One logical route pair (server stores both directions as this single pair). */
export type RoutePair = {
  id: string;
  /** Stable ordering for deduplication: lexicographically smaller airport id first. */
  a: string;
  b: string;
};

export type GamePayload = {
  startedAt: number;
  tick: number;
  /** Airline routes per player (airport id keys on RoutePair). */
  routesByPlayer: Record<string, RoutePair[]>;
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
