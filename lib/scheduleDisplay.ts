import { getAirportById } from "./airports";
import type { FlightSchedule } from "./types";

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function nextGaFlightNumber(existing: FlightSchedule[]): string {
  let max = 0;
  for (const s of existing) {
    const m = /^GA(\d+)$/i.exec(s.flightNumber.trim());
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `GA${max + 1}`;
}

export function formatScheduleRoute(s: FlightSchedule): string {
  const from = getAirportById(s.fromId);
  const to = getAirportById(s.toId);
  if (!from || !to) return `${s.fromId} → ${s.toId}`;
  return `${from.iata} → ${to.iata}`;
}

export function formatScheduleTime(s: FlightSchedule): string {
  const mm = s.minute === 0 ? "00" : "30";
  return `${s.hour12}:${mm} ${s.amPm}`;
}

export function formatScheduleDays(s: FlightSchedule): string {
  if (s.weekdays.length === 7) return "Daily";
  return s.weekdays.map((d) => WEEKDAY_SHORT[d]).join(", ");
}
