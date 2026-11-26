"use client";

// Leaflet touches `window`, so this file is only ever loaded with next/dynamic({ ssr: false }).
import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";

export type LatLng = { lat: number; lng: number };

/** The branch delivering this order, pinned on the map. */
export type MapStore = { name: string; location: LatLng };

// The branch: a deep-purple pin with a little shop awning, so it never reads as the customer's pin.
const storeIcon = L.divIcon({
  className: "",
  html: `<div style="width:34px;height:34px;border-radius:50%;background:#341830;border:3px solid #fbad1c;box-shadow:0 6px 14px rgba(52,24,48,.35);display:flex;align-items:center;justify-content:center">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbad1c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/></svg>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// A CSS pin avoids Leaflet's default marker images, which break under bundlers.
const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;transform:translate(-50%,-100%);position:relative;left:18px;top:36px">
    <div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:#884C2B;transform:rotate(-45deg);box-shadow:0 6px 14px rgba(52,24,48,.35);border:3px solid #fff"></div>
    <div style="position:absolute;top:11px;left:11px;width:14px;height:14px;border-radius:50%;background:#fff"></div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function ClickToMove({ onChange }: { onChange: (pos: LatLng) => void }) {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

/**
 * First view: the branch and the pin together, so the distance between them is obvious.
 * After that, each pin move zooms in on the pin so it can be placed precisely.
 */
function Recenter({ position, store }: { position: LatLng; store?: MapStore }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (store) {
        map.fitBounds(L.latLngBounds([store.location, position]), { padding: [40, 40], maxZoom: 15 });
        return;
      }
    }
    map.flyTo(position, Math.max(map.getZoom(), 16), { duration: 0.6 });
    // `store` is only read for the first view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, position]);
  return null;
}

export default function LocationMap({
  position,
  onChange,
  store,
}: {
  position: LatLng;
  onChange: (pos: LatLng) => void;
  store?: MapStore;
}) {
  const handlers = useMemo(
    () => ({
      dragend: (e: L.LeafletEvent) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
        onChange({ lat, lng });
      },
    }),
    [onChange]
  );

  return (
    <MapContainer
      center={position}
      zoom={14}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {store && (
        <>
          <Marker position={store.location} icon={storeIcon} interactive={false} zIndexOffset={-100}>
            <Tooltip direction="top" offset={[0, -18]} permanent>
              Bobalicious {store.name}
            </Tooltip>
          </Marker>
        </>
      )}
      <Marker position={position} draggable icon={pinIcon} eventHandlers={handlers} />
      <ClickToMove onChange={onChange} />
      <Recenter position={position} store={store} />
    </MapContainer>
  );
}
