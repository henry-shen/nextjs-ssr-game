"use client";

import { getAirportById } from "@/lib/airports";
import { formatDurationMinutes } from "@/lib/flightDuration";
import type { ClientGameView, DirectedRoute } from "@/lib/types";
import styles from "./airline-game.module.css";

function formatDirected(r: DirectedRoute): string {
  const from = getAirportById(r.fromId);
  const to = getAirportById(r.toId);
  const time =
    typeof r.durationMinutes === "number" ? ` · ${formatDurationMinutes(r.durationMinutes)}` : "";
  if (!from || !to) return `${r.fromId} → ${r.toId}${time}`;
  return `${from.iata} (${from.city}) → ${to.iata} (${to.city})${time}`;
}

type Props = {
  view: ClientGameView;
  readOnly: boolean;
  onManageSchedules?: (route: DirectedRoute) => void;
};

export function RoutesTab({ view, readOnly, onManageSchedules }: Props) {
  const game = view.game;
  if (!game) {
    return <p style={{ color: "var(--muted)", margin: 0 }}>No active simulation.</p>;
  }

  const byPlayer = game.routesByPlayer ?? {};

  if (readOnly) {
    return (
      <div>
        <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", color: "var(--muted)" }}>
          All players&apos; directed routes (read-only).
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
                    <li key={r.id}>{formatDirected(r)}</li>
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
        Each row is one direction. Creating a link between two hubs adds <strong>two</strong> routes (out
        and back).
      </p>
      {yours.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>
          No routes yet. Open the World Map, select a hub, and use <strong>Create route</strong>.
        </p>
      ) : (
        <ul className={styles.routeList}>
          {yours.map((r) => (
            <li key={r.id} className={styles.routeRow}>
              <span className={styles.routeRowText}>{formatDirected(r)}</span>
              {onManageSchedules ? (
                <button
                  type="button"
                  className={styles.scheduleManageBtn}
                  onClick={() => onManageSchedules(r)}
                >
                  Manage schedules
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
