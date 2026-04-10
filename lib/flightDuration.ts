import type { AirportDef } from "./airports";

const EARTH_RADIUS_KM = 6371;
/** Typical jet cruise speed for a rough block-time estimate. */
const CRUISE_SPEED_KMH = 800;
/** Extra minutes for taxi, takeoff, climb, approach, and landing. */
const TAKEOFF_LANDING_MINUTES = 45;
const ROUND_MINUTES = 30;
const MIN_DURATION_MINUTES = 30;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in kilometres. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Block time from great-circle distance + ground time, rounded to the nearest half hour.
 */
export function estimateFlightDurationMinutesBetween(from: AirportDef, to: AirportDef): number {
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  const airborneMinutes = (km / CRUISE_SPEED_KMH) * 60;
  const raw = airborneMinutes + TAKEOFF_LANDING_MINUTES;
  const rounded = Math.round(raw / ROUND_MINUTES) * ROUND_MINUTES;
  return Math.max(MIN_DURATION_MINUTES, rounded);
}

export function formatDurationMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
