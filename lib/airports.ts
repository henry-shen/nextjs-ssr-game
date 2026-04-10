export type AirportDef = {
  id: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
};

/** Famous hubs — positions use equirectangular projection in the map UI. */
export const AIRPORTS: AirportDef[] = [
  { id: "jfk", iata: "JFK", name: "John F. Kennedy International", city: "New York", country: "USA", lat: 40.64, lng: -73.78 },
  { id: "lax", iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "USA", lat: 33.94, lng: -118.41 },
  { id: "ord", iata: "ORD", name: "O'Hare International", city: "Chicago", country: "USA", lat: 41.97, lng: -87.91 },
  { id: "sfo", iata: "SFO", name: "San Francisco International", city: "San Francisco", country: "USA", lat: 37.62, lng: -122.38 },
  { id: "lhr", iata: "LHR", name: "Heathrow", city: "London", country: "UK", lat: 51.47, lng: -0.45 },
  { id: "cdg", iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", lat: 49.01, lng: 2.55 },
  { id: "fra", iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", lat: 50.04, lng: 8.57 },
  { id: "ams", iata: "AMS", name: "Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.31, lng: 4.77 },
  { id: "dxb", iata: "DXB", name: "Dubai International", city: "Dubai", country: "UAE", lat: 25.25, lng: 55.36 },
  { id: "ist", iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Türkiye", lat: 41.26, lng: 28.73 },
  { id: "sin", iata: "SIN", name: "Changi", city: "Singapore", country: "Singapore", lat: 1.36, lng: 103.99 },
  { id: "hkg", iata: "HKG", name: "Hong Kong International", city: "Hong Kong", country: "China", lat: 22.31, lng: 113.92 },
  { id: "nrt", iata: "NRT", name: "Narita International", city: "Tokyo", country: "Japan", lat: 35.77, lng: 140.39 },
  { id: "icn", iata: "ICN", name: "Incheon International", city: "Seoul", country: "South Korea", lat: 37.46, lng: 126.45 },
  { id: "syd", iata: "SYD", name: "Kingsford Smith", city: "Sydney", country: "Australia", lat: -33.95, lng: 151.18 },
];

const byId = new Map(AIRPORTS.map((a) => [a.id, a]));

export function getAirportById(id: string): AirportDef | undefined {
  return byId.get(id);
}

export function airportIds(): Set<string> {
  return new Set(AIRPORTS.map((a) => a.id));
}

/** Map marker position as % inside a relative container (equirectangular). */
export function projectToMapPercent(lat: number, lng: number): { left: number; top: number } {
  return {
    left: ((lng + 180) / 360) * 100,
    top: ((90 - lat) / 180) * 100,
  };
}
