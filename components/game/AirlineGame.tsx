"use client";

import { useState } from "react";
import type { AirportDef } from "@/lib/airports";
import type { ClientGameView, DirectedRoute } from "@/lib/types";
import { AirportModal } from "./AirportModal";
import styles from "./airline-game.module.css";
import { FlightSchedulesTab } from "./FlightSchedulesTab";
import { RoutesTab } from "./RoutesTab";
import { WorldMapTab } from "./WorldMapTab";

type TabId = "map" | "routes" | "schedules";

type Props = {
  view: ClientGameView;
  readOnly: boolean;
  busy: boolean;
  showEndGame: boolean;
  onEndGame: () => void;
  postGame: (body: object) => Promise<boolean>;
  requestError: string | null;
};

export function AirlineGame({
  view,
  readOnly,
  busy,
  showEndGame,
  onEndGame,
  postGame,
  requestError,
}: Props) {
  const [tab, setTab] = useState<TabId>("map");
  const [scheduleFocusRoute, setScheduleFocusRoute] = useState<DirectedRoute | null>(null);
  const [modalAirport, setModalAirport] = useState<AirportDef | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function goTab(next: TabId) {
    setTab(next);
    if (next === "map" || next === "routes") {
      setScheduleFocusRoute(null);
    }
  }

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

  const tick = view.game?.tick ?? 0;

  return (
    <div className={styles.gameRoot}>
      <div className={styles.gameViewport}>
        <nav className={styles.gameNav} aria-label="Game">
          <h1 className={styles.gameNavTitle}>Airline network</h1>
          <div className={styles.gameNavTabs} role="tablist" aria-label="Views">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "map"}
              className={tab === "map" ? styles.navTabActive : styles.navTab}
              onClick={() => goTab("map")}
            >
              World map
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "routes"}
              className={tab === "routes" ? styles.navTabActive : styles.navTab}
              onClick={() => goTab("routes")}
            >
              Routes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "schedules"}
              className={tab === "schedules" ? styles.navTabActive : styles.navTab}
              onClick={() => goTab("schedules")}
            >
              Flight schedules
            </button>
          </div>
          <div className={styles.gameNavActions}>
            <span className={styles.gameStateText} title="Simulation tick">
              Tick {tick}
            </span>
            {readOnly ? <span className={styles.spectateBadge}>Spectating</span> : null}
            {showEndGame ? (
              <button
                type="button"
                className={`danger ${styles.navEndBtn}`}
                disabled={busy}
                onClick={onEndGame}
              >
                End game
              </button>
            ) : null}
          </div>
        </nav>

        {requestError ? <p className={styles.gameErrorBanner}>{requestError}</p> : null}
        <div className={styles.gameBody} role="tabpanel">
          {tab === "map" ? (
            <WorldMapTab readOnly={readOnly} onOpenAirport={openAirport} fullBleed />
          ) : tab === "routes" ? (
            <div className={styles.routesPanel}>
              <RoutesTab
                view={view}
                readOnly={readOnly}
                onManageSchedules={
                  readOnly
                    ? undefined
                    : (route) => {
                        setScheduleFocusRoute(route);
                        setTab("schedules");
                      }
                }
              />
            </div>
          ) : (
            <div className={styles.routesPanel}>
              <FlightSchedulesTab
                view={view}
                readOnly={readOnly}
                focusRoute={scheduleFocusRoute}
                onClearScheduleFocus={() => setScheduleFocusRoute(null)}
                busy={busy}
                postGame={postGame}
              />
            </div>
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
    </div>
  );
}
