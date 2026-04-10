"use client";

import { getAirportById } from "@/lib/airports";
import type { ClientGameView, RoutePair } from "@/lib/types";
import styles from "./airline-game.module.css";

function formatPair(r: RoutePair): string {
  const aa = getAirportById(r.a);
  const bb = getAirportById(r.b);
  if (!aa || !bb) return `${r.a} ↔ ${r.b}`;
  return `${aa.iata} (${aa.city}) ↔ ${bb.iata} (${bb.city})`;
}

type Props = {
  view: ClientGameView;
  readOnly: boolean;
};

export function RoutesTab({ view, readOnly }: Props) {
  const game = view.game;
  if (!game) {
    return <p style={{ color: "var(--muted)", margin: 0 }}>No active simulation.</p>;
  }

  const byPlayer = game.routesByPlayer ?? {};

  if (readOnly) {
    return (
      <div>
        <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", color: "var(--muted)" }}>
          All players&apos; route networks (read-only).
        </p>
        {view.players.map((p) => {
          const routes = byPlayer[p.id] ?? [];
          return (
            <div key={p.id} className={styles.playerBlock}>
              <h3>{p.name}</h3>
              {routes.length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>No routes yet.</p>
              ) : (
                <ul className={styles.routeList}>
                  {routes.map((r) => (
                    <li key={r.id}>{formatPair(r)}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const pid = view.yourPlayerId;
  const yours = pid ? (byPlayer[pid] ?? []) : [];

  return (
    <div>
      <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", color: "var(--muted)" }}>
        Route pairs you created. Each entry represents <strong>both</strong> directions between the two
        airports.
      </p>
      {yours.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>
          No routes yet. Open the World Map, select a hub, and use <strong>Create route</strong>.
        </p>
      ) : (
        <ul className={styles.routeList}>
          {yours.map((r) => (
            <li key={r.id}>{formatPair(r)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
