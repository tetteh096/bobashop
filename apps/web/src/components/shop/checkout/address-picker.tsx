"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import type { LatLng } from "./location-map";

const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-tint-strong text-sm text-gray-600">
      Loading map…
    </div>
  ),
});

// Accra city centre, used until the customer shares or picks a location.
export const DEFAULT_LOCATION: LatLng = { lat: 5.6037, lng: -0.187 };

const NOMINATIM = "https://nominatim.openstreetmap.org";

type SearchResult = { display_name: string; lat: string; lon: string };

async function reverseGeocode({ lat, lng }: LatLng): Promise<string | null> {
  const res = await fetch(
    `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=0&accept-language=en`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? null;
}

async function searchPlaces(query: string): Promise<SearchResult[]> {
  const res = await fetch(
    `${NOMINATIM}/search?format=jsonv2&countrycodes=gh&limit=5&accept-language=en&q=${encodeURIComponent(query)}`
  );
  return res.ok ? ((await res.json()) as SearchResult[]) : [];
}

export function AddressPicker({
  location,
  onLocationChange,
  onAddressFound,
}: {
  location: LatLng | null;
  onLocationChange: (pos: LatLng) => void;
  /** Called with a suggested street address whenever the pin moves. */
  onAddressFound: (address: string) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const lookupId = useRef(0);

  const position = location ?? DEFAULT_LOCATION;

  const moveTo = useCallback(
    (pos: LatLng) => {
      onLocationChange(pos);
      const id = ++lookupId.current;
      reverseGeocode(pos)
        .then((address) => {
          // Ignore slow answers for a pin the customer has already moved again.
          if (address && id === lookupId.current) onAddressFound(address);
        })
        .catch(() => {});
    },
    [onLocationChange, onAddressFound]
  );

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("Your browser can't share its location. Drop the pin on the map instead.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        moveTo({ lat: coords.latitude, lng: coords.longitude });
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was blocked. Allow it in your browser, or drop the pin on the map."
            : "We couldn't find your location. Drop the pin on the map instead."
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    // Debounced to stay well inside Nominatim's one-request-per-second policy.
    const timer = setTimeout(() => {
      searchPlaces(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search an area, street or landmark"
            aria-label="Search for your location"
            className="w-full bg-tint pl-11 pr-10 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {searching && <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />}
          {results.length > 0 && (
            <ul className="absolute z-[1000] left-0 right-0 top-full mt-2 bg-card shadow-xl border border-gray-100 overflow-hidden">
              {results.map((r) => (
                <li key={`${r.lat},${r.lon}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      onAddressFound(r.display_name);
                      onLocationChange({ lat: Number(r.lat), lng: Number(r.lon) });
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left text-sm hover:bg-tint cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{r.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 bg-ink text-white font-semibold px-5 py-3.5 hover:bg-brand transition-colors disabled:opacity-60 cursor-pointer"
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
          {locating ? "Finding you…" : "Use my location"}
        </button>
      </div>

      {geoError && <p className="text-sm text-sale">{geoError}</p>}

      {/* `isolate` keeps Leaflet's high z-index panes from covering the sticky header. */}
      <div className="relative isolate h-72 sm:h-80 overflow-hidden border border-line">
        <LocationMap position={position} onChange={moveTo} />
      </div>

      <p className="text-sm text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Tap the map or drag the pin to your door.</span>
        {location ? (
          <span className="font-mono text-xs bg-tint rounded-full px-3 py-1">
            GPS {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </span>
        ) : (
          <span className="font-semibold text-sale">No location set yet</span>
        )}
      </p>
    </div>
  );
}
