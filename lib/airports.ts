export type ContinentId = "na" | "eu" | "as" | "oc";

/** Map hub dots: saturated border with a lighter fill of the same hue. */
export const CONTINENT_HUB_DOT: Record<ContinentId, { border: string; fill: string }> = {
  na: { border: "#5b9fd4", fill: "#a8d4f2" },
  eu: { border: "#c689d9", fill: "#e2c2ed" },
  as: { border: "#e3b565", fill: "#f2dc9e" },
  oc: { border: "#89c98c", fill: "#c0e8c3" },
};

export type AirportDef = {
  id: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  continent: ContinentId;
};

/** Famous hubs — lat/lng used by the Leaflet world map. */
export const AIRPORTS: AirportDef[] = [
  { id: "jfk", iata: "JFK", name: "John F. Kennedy International", city: "New York", country: "USA", lat: 40.64, lng: -73.78, continent: "na" },
  { id: "lax", iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "USA", lat: 33.94, lng: -118.41, continent: "na" },
  { id: "ord", iata: "ORD", name: "O'Hare International", city: "Chicago", country: "USA", lat: 41.97, lng: -87.91, continent: "na" },
  { id: "sfo", iata: "SFO", name: "San Francisco International", city: "San Francisco", country: "USA", lat: 37.62, lng: -122.38, continent: "na" },
  { id: "lhr", iata: "LHR", name: "Heathrow", city: "London", country: "UK", lat: 51.47, lng: -0.45, continent: "eu" },
  { id: "cdg", iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", lat: 49.01, lng: 2.55, continent: "eu" },
  { id: "fra", iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", lat: 50.04, lng: 8.57, continent: "eu" },
  { id: "ams", iata: "AMS", name: "Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.31, lng: 4.77, continent: "eu" },
  { id: "dxb", iata: "DXB", name: "Dubai International", city: "Dubai", country: "UAE", lat: 25.25, lng: 55.36, continent: "as" },
  { id: "ist", iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Türkiye", lat: 41.26, lng: 28.73, continent: "as" },
  { id: "sin", iata: "SIN", name: "Changi", city: "Singapore", country: "Singapore", lat: 1.36, lng: 103.99, continent: "as" },
  { id: "hkg", iata: "HKG", name: "Hong Kong International", city: "Hong Kong", country: "China", lat: 22.31, lng: 113.92, continent: "as" },
  { id: "nrt", iata: "NRT", name: "Narita International", city: "Tokyo", country: "Japan", lat: 35.77, lng: 140.39, continent: "as" },
  { id: "icn", iata: "ICN", name: "Incheon International", city: "Seoul", country: "South Korea", lat: 37.46, lng: 126.45, continent: "as" },
  { id: "syd", iata: "SYD", name: "Kingsford Smith", city: "Sydney", country: "Australia", lat: -33.95, lng: 151.18, continent: "oc" },
];

const byId = new Map(AIRPORTS.map((a) => [a.id, a]));

export function getAirportById(id: string): AirportDef | undefined {
  return byId.get(id);
}

export function airportIds(): Set<string> {
  return new Set(AIRPORTS.map((a) => a.id));
}
