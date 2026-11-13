"use client";

// Leaflet touches `window`, so this file is only ever loaded with next/dynamic({ ssr: false }).
import "leaflet/dist/leaflet.css";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

export type LatLng = { lat: number; lng: number };

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

function Recenter({ position }: { position: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [map, position]);
  return null;
}

export default function LocationMap({
  position,
  onChange,
}: {
  position: LatLng;
  onChange: (pos: LatLng) => void;
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
      <Marker position={position} draggable icon={pinIcon} eventHandlers={handlers} />
      <ClickToMove onChange={onChange} />
      <Recenter position={position} />
    </MapContainer>
  );
}
