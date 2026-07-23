import { useEffect, useRef } from "react";
import type { Waypoint } from "@/lib/routing";
import { routingProvider } from "@/lib/routing";

type Props = {
  waypoints: Waypoint[];
  geometry: [number, number][] | null;
  currentLocation: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
};

export function PlannerMap({ waypoints, geometry, currentLocation, onMapClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Refs to Leaflet objects (typed as any to avoid SSR-time type coupling).
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeRef = useRef<any>(null);
  const currentRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const clickHandlerRef = useRef(onMapClick);
  clickHandlerRef.current = onMapClick;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(containerRef.current, {
        center: [52.1, 5.3],
        zoom: 7,
        zoomControl: true,
      });
      L.tileLayer(routingProvider.tileUrl, {
        maxZoom: 19,
        attribution: routingProvider.tileAttribution,
      }).addTo(map);
      map.on("click", (e: any) => {
        clickHandlerRef.current?.(e.latlng.lat, e.latlng.lng);
      });
      mapRef.current = map;
      // Trigger a resize once after mount to fix tile flicker on mobile.
      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Waypoint markers
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    waypoints.forEach((w, i) => {
      const isStart = i === 0;
      const isEnd = i === waypoints.length - 1 && waypoints.length > 1;
      const color = isStart ? "#22c55e" : isEnd ? "#ef4444" : "#3b82f6";
      const label = isStart ? "A" : isEnd ? "B" : String(i);
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${color};color:#fff;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">${label}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const m = L.marker([w.lat, w.lng], { icon }).addTo(map);
      m.bindTooltip(w.label, { direction: "top" });
      markersRef.current.push(m);
    });
  }, [waypoints]);

  // Route geometry
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (routeRef.current) {
      routeRef.current.remove();
      routeRef.current = null;
    }
    if (geometry && geometry.length > 1) {
      routeRef.current = L.polyline(geometry, {
        color: "#2563eb",
        weight: 6,
        opacity: 0.85,
      }).addTo(map);
      map.fitBounds(routeRef.current.getBounds(), { padding: [40, 40] });
    } else if (waypoints.length > 0) {
      if (waypoints.length === 1) {
        map.setView([waypoints[0].lat, waypoints[0].lng], 12);
      } else {
        const b = L.latLngBounds(waypoints.map((w) => [w.lat, w.lng] as [number, number]));
        map.fitBounds(b, { padding: [40, 40] });
      }
    }
  }, [geometry, waypoints]);

  // Current location marker
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (currentRef.current) {
      currentRef.current.remove();
      currentRef.current = null;
    }
    if (currentLocation) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#0ea5e9;border:3px solid #fff;box-shadow:0 0 0 4px rgba(14,165,233,.25);border-radius:9999px;width:16px;height:16px;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      currentRef.current = L.marker([currentLocation.lat, currentLocation.lng], { icon }).addTo(map);
      currentRef.current.bindTooltip("Huidige locatie", { direction: "top" });
    }
  }, [currentLocation]);

  return <div ref={containerRef} className="h-full w-full" aria-label="Routekaart" />;
}