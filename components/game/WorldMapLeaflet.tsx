"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { AIRPORTS, CONTINENT_HUB_DOT, type AirportDef, type ContinentId } from "@/lib/airports";
import styles from "./airline-game.module.css";

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const id = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(id);
  }, [map]);
  return null;
}

/** Tall viewports leave a light band below the Mercator frame; shift tiles up slightly on screen. */
function NudgeWorldViewUp() {
  const map = useMap();
  useEffect(() => {
    let ran = false;
    const nudge = () => {
      if (ran) return;
      ran = true;
      map.invalidateSize();
      const h = map.getSize().y;
      const dy = Math.min(56, Math.max(20, Math.round(h * 0.028)));
      map.panBy(L.point(0, dy), { animate: false });
    };
    map.whenReady(() => {
      requestAnimationFrame(() => {
        map.invalidateSize();
        requestAnimationFrame(nudge);
      });
    });
  }, [map]);
  return null;
}

const DOT_PX = 11;
const DOT_ANCHOR = Math.ceil(DOT_PX / 2);

function makeHubIcon(continent: ContinentId) {
  const { border, fill } = CONTINENT_HUB_DOT[continent];
  return L.divIcon({
    className: "airport-hub-marker-wrap",
    html: `<span class="airport-hub-dot" style="border-color:${border};background-color:${fill}" role="presentation"></span>`,
    iconSize: [DOT_PX, DOT_PX],
    iconAnchor: [DOT_ANCHOR, DOT_ANCHOR],
  });
}

type Props = {
  readOnly: boolean;
  onOpenAirport: (a: AirportDef) => void;
  fullBleed?: boolean;
};

export function WorldMapLeaflet({ readOnly, onOpenAirport, fullBleed }: Props) {
  const icons = useMemo(() => {
    const m = new Map<string, L.DivIcon>();
    for (const a of AIRPORTS) {
      m.set(a.id, makeHubIcon(a.continent));
    }
    return m;
  }, []);

  const wrapClass = fullBleed ? styles.mapWrapFull : styles.mapWrap;
  const mapClass = fullBleed ? `${styles.leafletMap} ${styles.leafletMapFlush}` : styles.leafletMap;

  return (
    <div className={wrapClass}>
      <p className={styles.mapHintLeaflet}>
        {readOnly
          ? "Scroll to zoom · drag to pan — open a hub from the map."
          : "Scroll to zoom · drag to pan — click a hub to open its overview."}
      </p>
      <MapContainer
        center={[22, 12]}
        zoom={2}
        minZoom={2}
        maxZoom={20}
        scrollWheelZoom
        doubleClickZoom
        boxZoom
        keyboard
        zoomControl
        className={mapClass}
        style={{ height: "100%", width: "100%" }}
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <InvalidateSizeOnMount />
        {fullBleed ? <NudgeWorldViewUp /> : null}
        {AIRPORTS.map((a) => (
          <Marker
            key={a.id}
            position={[a.lat, a.lng]}
            icon={icons.get(a.id)!}
            title={`${a.city} (${a.iata})`}
            eventHandlers={{
              click: () => {
                onOpenAirport(a);
              },
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
