"use client";

import { useEffect, useMemo, useState } from "react";
import { getAirportById } from "@/lib/airports";
import { formatDurationMinutes } from "@/lib/flightDuration";
import { nextGaFlightNumber } from "@/lib/scheduleDisplay";
import type { DirectedRoute, FlightSchedule } from "@/lib/types";
import { ScheduleClock } from "./ScheduleClock";
import styles from "./airline-game.module.css";

const WEEKDAYS: { label: string; index: 0 | 1 | 2 | 3 | 4 | 5 | 6 }[] = [
  { label: "Mon", index: 0 },
  { label: "Tue", index: 1 },
  { label: "Wed", index: 2 },
  { label: "Thu", index: 3 },
  { label: "Fri", index: 4 },
  { label: "Sat", index: 5 },
  { label: "Sun", index: 6 },
];

function formatRouteLine(r: DirectedRoute): string {
  const from = getAirportById(r.fromId);
  const to = getAirportById(r.toId);
  const time =
    typeof r.durationMinutes === "number" ? ` · ${formatDurationMinutes(r.durationMinutes)}` : "";
  if (!from || !to) return `${r.fromId} → ${r.toId}${time}`;
  return `${from.iata} (${from.city}) → ${to.iata} (${to.city})${time}`;
}

type Props = {
  route: DirectedRoute;
  existingSchedules: FlightSchedule[];
  busy: boolean;
  postGame: (body: object) => Promise<boolean>;
  onSaved: () => void;
};

export function ScheduleManager({ route, existingSchedules, busy, postGame, onSaved }: Props) {
  const [flightNumber, setFlightNumber] = useState("");
  const [hour12, setHour12] = useState(12);
  const [minute, setMinute] = useState<0 | 30>(0);
  const [amPm, setAmPm] = useState<"AM" | "PM">("AM");
  const [days, setDays] = useState<Set<number>>(new Set());

  const routeKey = `${route.fromId}>${route.toId}`;

  useEffect(() => {
    setFlightNumber(nextGaFlightNumber(existingSchedules));
    setHour12(12);
    setMinute(0);
    setAmPm("AM");
    setDays(new Set());
    /* Reset only when switching routes; omit existingSchedules so view polling does not wipe the form. */
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps -- existingSchedules intentionally omitted

  const dailyChecked = useMemo(() => days.size === 7, [days]);

  function toggleDaily() {
    setDays((prev) => {
      if (prev.size === 7) return new Set();
      return new Set([0, 1, 2, 3, 4, 5, 6]);
    });
  }

  function toggleDay(i: number) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function onSave() {
    const weekdays = [...days].sort((a, b) => a - b);
    const ok = await postGame({
      action: "saveFlightSchedule",
      fromId: route.fromId,
      toId: route.toId,
      flightNumber: flightNumber.trim(),
      hour12,
      minute,
      amPm,
      weekdays,
    });
    if (ok) onSaved();
  }

  return (
    <div className={styles.scheduleManager}>
      <h3 className={styles.scheduleManagerTitle}>New schedule</h3>
      <p className={styles.scheduleManagerRoute}>{formatRouteLine(route)}</p>

      <label className={styles.scheduleFieldLabel} htmlFor="flight-number">
        Flight number
      </label>
      <input
        id="flight-number"
        className={styles.scheduleInput}
        type="text"
        autoComplete="off"
        value={flightNumber}
        onChange={(e) => setFlightNumber(e.target.value)}
        placeholder="GA1"
      />

      <p className={styles.scheduleFieldLabel}>Departure time</p>
      <ScheduleClock hour12={hour12} minute={minute} onChange={(h, m) => { setHour12(h); setMinute(m); }} />

      <div className={styles.amPmRow} role="group" aria-label="AM or PM">
        <button
          type="button"
          className={amPm === "AM" ? styles.amPmActive : styles.amPmBtn}
          onClick={() => setAmPm("AM")}
        >
          AM
        </button>
        <button
          type="button"
          className={amPm === "PM" ? styles.amPmActive : styles.amPmBtn}
          onClick={() => setAmPm("PM")}
        >
          PM
        </button>
      </div>

      <fieldset className={styles.weekdayFieldset}>
        <legend className={styles.scheduleFieldLabel}>Days</legend>
        <label className={styles.dailyLabel}>
          <input type="checkbox" checked={dailyChecked} onChange={toggleDaily} />
          Daily
        </label>
        <div className={styles.weekdayGrid}>
          {WEEKDAYS.map(({ label, index }) => (
            <label key={label} className={styles.weekdayItem}>
              <input type="checkbox" checked={days.has(index)} onChange={() => toggleDay(index)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="button" className="primary" disabled={busy} onClick={() => void onSave()}>
        Save flight schedule
      </button>
    </div>
  );
}
