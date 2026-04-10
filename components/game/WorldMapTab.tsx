"use client";

import { AIRPORTS, projectToMapPercent, type AirportDef } from "@/lib/airports";
import styles from "./airline-game.module.css";

type Props = {
  readOnly: boolean;
  onOpenAirport: (a: AirportDef) => void;
};

export function WorldMapTab({ readOnly, onOpenAirport }: Props) {
  return (
    <div>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.88rem", color: "var(--muted)" }}>
        {readOnly
          ? "Spectator view — open airports for read-only overview."
          : "Click a hub to open its overview. From there you can add international routes."}
      </p>
      <div className={styles.mapWrap}>
        <div className={styles.mapGrid} aria-hidden />
        <span className={styles.mapHint}>Schematic world map · hub positions from latitude / longitude</span>
        {AIRPORTS.map((a) => {
          const { left, top } = projectToMapPercent(a.lat, a.lng);
          return (
            <button
              key={a.id}
              type="button"
              className={styles.marker}
              style={{ left: `${left}%`, top: `${top}%` }}
              title={`${a.name} (${a.iata})`}
              aria-label={`${a.city} ${a.iata}, open airport overview`}
              onClick={() => onOpenAirport(a)}
            >
              {a.iata}
            </button>
          );
        })}
      </div>
    </div>
  );
}
