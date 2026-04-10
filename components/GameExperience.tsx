"use client";

import { useCallback, useEffect, useState } from "react";
import { AirlineGame } from "@/components/game/AirlineGame";
import type { ClientGameView } from "@/lib/types";

type Props = {
  initialView: ClientGameView;
};

const fetchInit = { cache: "no-store" as const, credentials: "include" as const };

async function fetchView(): Promise<ClientGameView> {
  const r = await fetch("/api/game", fetchInit);
  if (!r.ok) throw new Error("Failed to load game state");
  return r.json();
}

export function GameExperience({ initialView }: Props) {
  const [view, setView] = useState<ClientGameView>(initialView);
  const [name, setName] = useState("");
  const [asHost, setAsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sync = useCallback(async () => {
    try {
      const next = await fetchView();
      setView(next);
      setError(null);
    } catch {
      /* keep last good view */
    }
  }, []);

  useEffect(() => {
    const id = setInterval(sync, 2500);
    return () => clearInterval(id);
  }, [sync]);

  async function postGame(body: object): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        ...fetchInit,
      });
      const data = (await r.json()) as { ok?: boolean; error?: string; view?: ClientGameView };
      if (!r.ok || !data.ok) {
        setError(data.error ?? "Request failed");
        return false;
      }
      if (data.view) setView(data.view);
      else await sync();
      return true;
    } catch {
      setError("Network error.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const hostTaken = view.hostId !== null && view.hostId !== view.yourPlayerId;
  const canCheckHost = view.canJoinLobby && !hostTaken;
  /** Prefer matching ids so we still show controls if the session cookie syncs correctly. */
  const isRoomHost =
    view.yourPlayerId != null &&
    view.hostId != null &&
    view.hostId === view.yourPlayerId;

  const showAirline =
    view.phase === "playing" && view.game && (view.youArePlayer || view.mustObserve);

  return (
    <main className={showAirline ? "mainWide" : undefined}>
      <h1>Lobby game</h1>
      <p className="lead">
        One room, one game at a time. Join in the lobby, one host starts play, late visitors watch until
        the host ends the round.
      </p>

      {view.mustObserve && (
        <div className="card">
          <h2>Spectating</h2>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
            A game is in progress. You can watch the shared state update; joining is disabled until the
            host returns everyone to the lobby.
          </p>
        </div>
      )}

      {view.canJoinLobby && (
        <div className="card">
          <h2>Join lobby</h2>
          {error && <p className="err">{error}</p>}
          <label htmlFor="name">Display name</label>
          <input
            id="name"
            type="text"
            autoComplete="username"
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <label className="check">
            <input
              type="checkbox"
              checked={asHost}
              disabled={!canCheckHost}
              onChange={(e) => setAsHost(e.target.checked)}
            />
            Join as host (only one host)
          </label>
          {hostTaken && (
            <p className="mono" style={{ margin: "0 0 0.75rem" }}>
              Host seat is taken — join as a player.
            </p>
          )}
          <button
            type="button"
            className="primary"
            disabled={busy || !name.trim()}
            onClick={() => postGame({ action: "join", name: name.trim(), asHost })}
          >
            Join
          </button>
        </div>
      )}

      {(view.youArePlayer || view.mustObserve) && (
        <div className="card">
          <h2>Room</h2>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem" }}>
            Phase:{" "}
            <strong>{view.phase === "lobby" ? "Lobby" : "In play"}</strong>
          </p>
          <ul className="players">
            {view.players.map((p) => (
              <li key={p.id}>
                <span>{p.name}</span>
                {view.hostId === p.id ? <span className="badge host">Host</span> : null}
                {view.yourPlayerId === p.id ? <span className="badge">You</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {view.youArePlayer && view.phase === "lobby" && view.hostId === null && (
        <div className="card">
          <h2>No host yet</h2>
          {error ? <p className="err">{error}</p> : null}
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
            Someone must be the host before the game can start. If you forgot to check &quot;Join as
            host&quot;, claim the host seat here (only while it is empty).
          </p>
          <div className="row">
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => postGame({ action: "becomeHost" })}
            >
              Become host
            </button>
          </div>
        </div>
      )}

      {view.youArePlayer && view.phase === "lobby" && isRoomHost && (
        <div className="card">
          <h2>Host</h2>
          {error ? <p className="err">{error}</p> : null}
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
            When everyone is ready, start the game. New visitors will only be able to spectate until you
            end the round.
          </p>
          <div className="row">
            <button type="button" className="primary" disabled={busy} onClick={() => postGame({ action: "start" })}>
              Start game
            </button>
          </div>
        </div>
      )}

      {showAirline && (
        <AirlineGame
          view={view}
          readOnly={view.mustObserve}
          busy={busy}
          showEndGame={!!isRoomHost}
          onEndGame={() => void postGame({ action: "end" })}
          postGame={postGame}
        />
      )}
    </main>
  );
}
