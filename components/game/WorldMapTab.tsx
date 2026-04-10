"use client";

import dynamic from "next/dynamic";
import type { AirportDef } from "@/lib/airports";
import styles from "./airline-game.module.css";

const WorldMapLeaflet = dynamic(
  () => import("./WorldMapLeaflet").then((m) => m.WorldMapLeaflet),
  {
    ssr: false,
    loading: () => (
      <div className={styles.mapWrapFull}>
        <div className={styles.mapLoading}>Loading world map…</div>
      </div>
    ),
  }
);

type Props = {
  readOnly: boolean;
  onOpenAirport: (a: AirportDef) => void;
  /** Edge-to-edge map filling the view below the nav. */
  fullBleed?: boolean;
};

export function WorldMapTab({ readOnly, onOpenAirport, fullBleed }: Props) {
  if (fullBleed) {
    return (
      <div className={styles.mapColumn}>
        <WorldMapLeaflet readOnly={readOnly} onOpenAirport={onOpenAirport} fullBleed />
      </div>
    );
  }
  return (
    <div>
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", color: "var(--muted)" }}>
        CARTO dark basemap (OpenStreetMap data) — pinch / scroll zoom and pan. Hubs use real coordinates.
      </p>
      <WorldMapLeaflet readOnly={readOnly} onOpenAirport={onOpenAirport} />
    </div>
  );
}
