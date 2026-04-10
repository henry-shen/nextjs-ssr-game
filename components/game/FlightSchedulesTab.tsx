"use client";

import { formatDurationMinutes } from "@/lib/flightDuration";
import {
  formatScheduleDays,
  formatScheduleRoute,
  formatScheduleTime,
} from "@/lib/scheduleDisplay";
import type { ClientGameView, DirectedRoute, FlightSchedule } from "@/lib/types";
import styles from "./airline-game.module.css";
import { ScheduleManager } from "./ScheduleManager";

type Props = {
  view: ClientGameView;
  readOnly: boolean;
  focusRoute: DirectedRoute | null;
  onClearScheduleFocus: () => void;
  busy: boolean;
  postGame: (body: object) => Promise<boolean>;
};

function ScheduleList({
  schedules,
  title,
}: {
  schedules: FlightSchedule[];
  title?: string;
}) {
  if (schedules.length === 0) {
    return <p className={styles.scheduleEmpty}>No flight schedules yet.</p>;
  }
  return (
    <div>
      {title ? <h3 className={styles.scheduleListHeading}>{title}</h3> : null}
      <ul className={styles.scheduleList}>
        {schedules.map((s) => (
          <li key={s.id} className={styles.scheduleListItem}>
            <div className={styles.scheduleFlightNo}>{s.flightNumber}</div>
            <div className={styles.scheduleMeta}>
              {formatScheduleRoute(s)} · {formatScheduleTime(s)} · {formatScheduleDays(s)} ·{" "}
              {formatDurationMinutes(s.durationMinutes)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FlightSchedulesTab({
  view,
  readOnly,
  focusRoute,
  onClearScheduleFocus,
  busy,
  postGame,
}: Props) {
  const game = view.game;
  if (!game) {
    return <p style={{ color: "var(--muted)", margin: 0 }}>No active simulation.</p>;
  }

  const byPlayer = game.flightSchedulesByPlayer ?? {};

  if (readOnly) {
    return (
      <div>
        <p className={styles.scheduleIntro}>All players&apos; flight schedules (read-only).</p>
        {view.players.map((p) => {
          const list = byPlayer[p.id] ?? [];
          return (
            <div key={p.id} className={styles.playerBlock}>
              <ScheduleList schedules={list} title={p.name} />
            </div>
          );
        })}
      </div>
    );
  }

  const pid = view.yourPlayerId;
  const yours = pid ? (byPlayer[pid] ?? []) : [];

  const leftDisabled = !!focusRoute;

  return (
    <div className={styles.scheduleTabRoot}>
      <div className={styles.scheduleSplit}>
        <div
          className={`${styles.scheduleCol} ${leftDisabled ? styles.scheduleColDisabled : ""}`}
          aria-hidden={leftDisabled}
        >
          <h3 className={styles.scheduleListHeading}>Your schedules</h3>
          <ScheduleList schedules={yours} />
        </div>
        <div className={styles.scheduleCol}>
          {focusRoute ? (
            <ScheduleManager
              key={focusRoute.id}
              route={focusRoute}
              existingSchedules={yours}
              busy={busy}
              postGame={postGame}
              onSaved={onClearScheduleFocus}
            />
          ) : (
            <div className={styles.schedulePlaceholder}>
              <p>
                Open <strong>Routes</strong> and use <strong>Manage schedules</strong> on a route to add a
                departure here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
