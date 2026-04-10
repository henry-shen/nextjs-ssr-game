"use client";

import { useState } from "react";
import type { AirportDef } from "@/lib/airports";
import type { ClientGameView } from "@/lib/types";
import { AirportModal } from "./AirportModal";
import styles from "./airline-game.module.css";
import { RoutesTab } from "./RoutesTab";
import { WorldMapTab } from "./WorldMapTab";

type TabId = "map" | "routes";

type Props = {
  view: ClientGameView;
  readOnly: boolean;
  busy: boolean;
  showEndGame: boolean;
  onEndGame: () => void;
  postGame: (body: object) => Promise<boolean>;
};

export function AirlineGame({ view, readOnly, busy, showEndGame, onEndGame, postGame }: Props) {
  const [tab, setTab] = useState<TabId>("map");
  const [modalAirport, setModalAirport] = useState<AirportDef | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function openAirport(a: AirportDef) {
    setModalAirport(a);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalAirport(null);
  }

  function onCreateRoutes(originId: string, destinationIds: string[]) {
    return postGame({ action: "createRoutes", originId, destinationIds });
  }

  return (
    <>
      <div className={`card ${styles.gameCard}`}>
        <div className={styles.gameHeader}>
          <div>
            <h2 className={styles.gameTitle}>Airline network</h2>
            <p className={styles.subtle}>
              Route &amp; scheduling sim · tick {view.game?.tick ?? 0}
              {readOnly ? " · spectating" : ""}
            </p>
          </div>
          {showEndGame && (
            <button type="button" className="danger" disabled={busy} onClick={onEndGame}>
              End game
            </button>
          )}
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Game sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "map"}
            className={tab === "map" ? styles.tabActive : styles.tab}
            onClick={() => setTab("map")}
          >
            World map
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "routes"}
            className={tab === "routes" ? styles.tabActive : styles.tab}
            onClick={() => setTab("routes")}
          >
            Routes
          </button>
        </div>

        <div className={styles.tabPanel} role="tabpanel">
          {tab === "map" ? (
            <WorldMapTab readOnly={readOnly} onOpenAirport={openAirport} />
          ) : (
            <RoutesTab view={view} readOnly={readOnly} />
          )}
        </div>
      </div>

      <AirportModal
        airport={modalAirport}
        open={modalOpen}
        readOnly={readOnly}
        busy={busy}
        onClose={closeModal}
        onCreateRoutes={onCreateRoutes}
      />
    </>
  );
}
