"use client";

// Leaflet touches `window`, so this file is only ever loaded with next/dynamic({ ssr: false }).
import "leaflet/dist/leaflet.css";

import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";

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
 * When the pin jumps (a search result, "Use my location", the first view), show the branch and
 * the pin together so the route between them is in view. When the customer drags the pin or
 * taps the map, leave the view alone: they are placing it precisely.
 */
function Recenter({ position, store, movedOnMap }: { position: LatLng; store?: MapStore; movedOnMap: React.RefObject<boolean> }) {
  const map = useMap();
  useEffect(() => {
    if (movedOnMap.current) {
      movedOnMap.current = false;
      return;
    }
    if (store) map.fitBounds(L.latLngBounds([store.location, position]), { padding: [48, 48], maxZoom: 16 });
    else map.flyTo(position, Math.max(map.getZoom(), 16), { duration: 0.6 });
    // `store` only changes with the branch; the view follows the pin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, position]);
  return null;
}

export default function LocationMap({
  position,
  onChange,
  store,
  route,
}: {
  position: LatLng;
  onChange: (pos: LatLng) => void;
  store?: MapStore;
  /**
   * The way from the branch to the pin: the road route when we have it, else null for a
   * straight dashed line. Undefined (no pin yet) draws nothing.
   */
  route?: LatLng[] | null;
}) {
  // Pin moves the customer makes on the map itself, which shouldn't move the view.
  const movedOnMap = useRef(false);
  const moveOnMap = useCallback(
    (pos: LatLng) => {
      movedOnMap.current = true;
      onChange(pos);
    },
    [onChange]
  );
  const handlers = useMemo(
    () => ({
      dragend: (e: L.LeafletEvent) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
        moveOnMap({ lat, lng });
      },
    }),
    [moveOnMap]
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
      {store && route !== undefined &&
        (route ? (
          <>
            {/* A white casing under the line keeps it readable over busy streets. */}
            <Polyline positions={route} interactive={false} pathOptions={{ color: "#ffffff", weight: 8, opacity: 0.9 }} />
            <Polyline positions={route} interactive={false} pathOptions={{ color: "#341830", weight: 4.5, opacity: 0.9 }} />
          </>
        ) : (
          <Polyline
            positions={[store.location, position]}
            interactive={false}
            pathOptions={{ color: "#341830", weight: 3, opacity: 0.7, dashArray: "6 8" }}
          />
        ))}
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
      <ClickToMove onChange={moveOnMap} />
      <Recenter position={position} store={store} movedOnMap={movedOnMap} />
    </MapContainer>
  );
}
