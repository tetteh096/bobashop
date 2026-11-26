"use client";

import { useEffect, useState } from "react";

import type { LatLng } from "./location-map";

// The road route from the branch to the customer's pin, drawn on the checkout map so they can
// see how the rider gets there. Display only: the delivery fee is still priced on the
// straight-line distance (packages/api/src/branch-menu.ts), so the server never depends on it.

export type DeliveryRoute = { points: LatLng[]; km: number; minutes: number };

// OSRM's public server, on OpenStreetMap roads (the same map as the tiles). It is free but
// best-effort, so a failed lookup just falls back to a straight line on the map.
const OSRM = "https://router.project-osrm.org/route/v1/driving";

export function useRoute(from: LatLng | undefined, to: LatLng | null) {
  const [route, setRoute] = useState<DeliveryRoute | null>(null);
  const [loading, setLoading] = useState(false);

  const key = from && to ? `${from.lng},${from.lat};${to.lng},${to.lat}` : null;

  useEffect(() => {
    setRoute(null);
    if (!key) return;
    const controller = new AbortController();
    setLoading(true);
    // Wait for the pin to settle (dragging fires a lot), and stay gentle on the free server.
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${OSRM}/${key}?overview=full&geometries=geojson`, { signal: controller.signal });
        const data = (await res.json()) as {
          code?: string;
          routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
        };
        const best = data.code === "Ok" ? data.routes?.[0] : undefined;
        if (best) {
          setRoute({
            points: best.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
            km: Math.round(best.distance / 100) / 10,
            minutes: Math.max(1, Math.round(best.duration / 60)),
          });
        }
      } catch {
        // Offline, blocked or aborted: the map shows a straight line instead.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return { route, loading };
}
