"use client";

import { useCallback, useEffect, useState } from "react";
import type { AirportDef } from "@/lib/airports";
import { AIRPORTS } from "@/lib/airports";
import styles from "./airline-game.module.css";

type Step = "overview" | "pickDestinations";

type Props = {
  airport: AirportDef | null;
  open: boolean;
  readOnly: boolean;
  busy: boolean;
  onClose: () => void;
  onCreateRoutes: (originId: string, destinationIds: string[]) => Promise<boolean>;
};

export function AirportModal({
  airport,
  open,
  readOnly,
  busy,
  onClose,
  onCreateRoutes,
}: Props) {
  const [step, setStep] = useState<Step>("overview");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("overview");
    setSelected(new Set());
    setLocalErr(null);
  }, [open, airport]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  if (!open || !airport) return null;

  const others = AIRPORTS.filter((a) => a.id !== airport.id);

  function toggleDest(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirmRoutes() {
    const hub = airport;
    if (!hub) return;
    setLocalErr(null);
    const ids = [...selected];
    if (ids.length === 0) {
      setLocalErr("Select at least one destination.");
      return;
    }
    const ok = await onCreateRoutes(hub.id, ids);
    if (ok) onClose();
  }

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="airport-modal-title">
        <div className={styles.modalHead}>
          <h2 id="airport-modal-title">
            {airport.iata} · {airport.city}
          </h2>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            Close
          </button>
        </div>

        {step === "overview" && (
          <>
            <p className={styles.modalMeta}>{airport.name}</p>
            <p className={styles.modalMeta} style={{ marginTop: "-0.5rem" }}>
              {airport.country}
            </p>
            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Latitude</div>
                <div className={styles.statValue}>{airport.lat.toFixed(2)}°</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Longitude</div>
                <div className={styles.statValue}>{airport.lng.toFixed(2)}°</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Hub routes</div>
                <div className={styles.statValue}>—</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Slots (sim)</div>
                <div className={styles.statValue}>Open</div>
              </div>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0 0 1rem" }}>
              Scheduling and fleet details will live in future tabs. For now, open routes to other hubs from
              this airport.
            </p>
            <div className={styles.modalActions}>
              {!readOnly && (
                <button type="button" className="primary" onClick={() => setStep("pickDestinations")}>
                  Create route
                </button>
              )}
              <button type="button" className="secondary" onClick={onClose}>
                {readOnly ? "Close" : "Back to map"}
              </button>
            </div>
          </>
        )}

        {step === "pickDestinations" && (
          <>
            <p className={styles.modalMeta}>
              From <strong>{airport.iata}</strong>, choose destinations. Confirming creates <strong>two</strong>{" "}
              routes per hub: {airport.iata} → X and X → {airport.iata}, both listed in the Routes tab.
            </p>
            {localErr ? <p className="err">{localErr}</p> : null}
            <div className={styles.destList}>
              {others.map((a) => (
                <label key={a.id} className={styles.destRow}>
                  <input
                    type="checkbox"
                    checked={selected.has(a.id)}
                    onChange={() => toggleDest(a.id)}
                    disabled={busy}
                  />
                  <span>
                    <strong>{a.iata}</strong> {a.city}, {a.country}
                  </span>
                </label>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button type="button" className="secondary" disabled={busy} onClick={() => setStep("overview")}>
                Back
              </button>
              <button type="button" className="primary" disabled={busy} onClick={() => void confirmRoutes()}>
                Confirm routes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
