import type { ClientGameView, GameSnapshot } from "./types";

export function toClientView(
  snapshot: GameSnapshot,
  yourPlayerId: string | null
): ClientGameView {
  const youArePlayer =
    !!yourPlayerId && snapshot.players.some((p) => p.id === yourPlayerId);
  const youAreHost = !!yourPlayerId && snapshot.hostId === yourPlayerId;
  const canJoinLobby = snapshot.phase === "lobby" && !youArePlayer;
  const mustObserve = snapshot.phase === "playing" && !youArePlayer;

  return {
    ...snapshot,
    yourPlayerId,
    youAreHost,
    youArePlayer,
    canJoinLobby,
    mustObserve,
  };
}
