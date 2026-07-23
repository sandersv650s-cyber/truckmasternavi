import { useEffect, useRef } from "react";
import { HERE_API_KEY, type HereRoute, type LatLng } from "@/lib/here";

// Dynamically load the HERE Maps JS SDK (v3.1) with UI + events. Cached across
// mounts so the map component can mount/unmount without re-fetching scripts.
let loadPromise: Promise<any> | null = null;
function loadHereMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const W = window as any;
  if (W.H && W.H.Map) return Promise.resolve(W.H);
  if (loadPromise) return loadPromise;

  const script = (src: string) =>
    new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Kan HERE Maps script niet laden: ${src}`));
      document.head.appendChild(s);
    });
  const style = (href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  };

  loadPromise = (async () => {
    style("https://js.api.here.com/v3/3.1/mapsjs-ui.css");
    await script("https://js.api.here.com/v3/3.1/mapsjs-core.js");
    await Promise.all([
      script("https://js.api.here.com/v3/3.1/mapsjs-service.js"),
      script("https://js.api.here.com/v3/3.1/mapsjs-mapevents.js"),
      script("https://js.api.here.com/v3/3.1/mapsjs-ui.js"),
    ]);
    return (window as any).H;
  })();
  return loadPromise;
}

type Props = {
  waypoints: { lat: number; lng: number; label: string }[];
  routes: HereRoute[]; // first is primary; others are alternatives
  selectedRouteId?: string;
  currentLocation: LatLng | null;
  heading?: number | null;
  followMode?: boolean;
  onSelectRoute?: (id: string) => void;
  onMapClick?: (p: LatLng) => void;
};

export function HereMap({
  waypoints,
  routes,
  selectedRouteId,
  currentLocation,
  heading,
  followMode,
  onSelectRoute,
  onMapClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const hRef = useRef<any>(null);
  const groupRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);
  const clickCbRef = useRef(onMapClick);
  const selectCbRef = useRef(onSelectRoute);
  clickCbRef.current = onMapClick;
  selectCbRef.current = onSelectRoute;

  useEffect(() => {
    let cancelled = false;
    if (!HERE_API_KEY) return;
    loadHereMaps()
      .then((H) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        hRef.current = H;
        const platform = new H.service.Platform({ apikey: HERE_API_KEY });
        const layers = platform.createDefaultLayers({ pois: true });
        const map = new H.Map(containerRef.current, layers.vector.normal.map, {
          center: { lat: 52.1, lng: 5.3 },
          zoom: 7,
          pixelRatio: window.devicePixelRatio || 1,
        });
        new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
        H.ui.UI.createDefault(map, layers);
        window.addEventListener("resize", () => map.getViewPort().resize());
        map.addEventListener("tap", (e: any) => {
          const p = map.screenToGeo(
            e.currentPointer.viewportX,
            e.currentPointer.viewportY,
          );
          if (p) clickCbRef.current?.({ lat: p.lat, lng: p.lng });
        });
        mapRef.current = map;
        groupRef.current = new H.map.Group();
        map.addObject(groupRef.current);
      })
      .catch((e) => console.error("HERE Maps load error", e));
    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.dispose(); } catch { /* noop */ }
        mapRef.current = null;
      }
    };
  }, []);

  // Draw routes + waypoints
  useEffect(() => {
    const H = hRef.current;
    const map = mapRef.current;
    const group = groupRef.current;
    if (!H || !map || !group) return;
    group.removeAll();

    // Alternatives first (dim), primary/selected last (bright)
    const orderedIds = [...routes.map((r) => r.id)].sort((a, b) =>
      a === (selectedRouteId ?? routes[0]?.id) ? 1 : b === (selectedRouteId ?? routes[0]?.id) ? -1 : 0,
    );
    for (const id of orderedIds) {
      const r = routes.find((x) => x.id === id);
      if (!r) continue;
      const isSelected = id === (selectedRouteId ?? routes[0]?.id);
      const line = new H.geo.LineString();
      for (const p of r.polyline) line.pushPoint({ lat: p.lat, lng: p.lng });
      const poly = new H.map.Polyline(line, {
        style: {
          strokeColor: isSelected ? "#2563eb" : "rgba(100,116,139,.7)",
          lineWidth: isSelected ? 7 : 5,
        },
      });
      (poly as any).__routeId = id;
      poly.addEventListener("tap", () => selectCbRef.current?.(id));
      group.addObject(poly);
    }

    // Waypoints
    waypoints.forEach((w, i) => {
      const isStart = i === 0;
      const isEnd = i === waypoints.length - 1 && waypoints.length > 1;
      const color = isStart ? "#22c55e" : isEnd ? "#ef4444" : "#3b82f6";
      const label = isStart ? "A" : isEnd ? "B" : String(i);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="${color}" stroke="#fff" stroke-width="2"/><text x="15" y="19" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#fff">${label}</text></svg>`;
      const icon = new H.map.Icon(svg, { size: { w: 30, h: 30 }, anchor: { x: 15, y: 15 } });
      const marker = new H.map.Marker({ lat: w.lat, lng: w.lng }, { icon });
      group.addObject(marker);
    });

    if (waypoints.length > 0 || routes.length > 0) {
      try {
        const bb = group.getBoundingBox();
        if (bb) map.getViewModel().setLookAtData({ bounds: bb }, true);
      } catch { /* ignore */ }
    }
  }, [waypoints, routes, selectedRouteId]);

  // Current location marker + follow
  useEffect(() => {
    const H = hRef.current;
    const map = mapRef.current;
    if (!H || !map) return;
    if (currentMarkerRef.current) {
      map.removeObject(currentMarkerRef.current);
      currentMarkerRef.current = null;
    }
    if (!currentLocation) return;
    const rot = heading ?? 0;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><g transform="rotate(${rot} 18 18)"><circle cx="18" cy="18" r="12" fill="rgba(14,165,233,.25)"/><path d="M18 6 L26 26 L18 22 L10 26 Z" fill="#0ea5e9" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></g></svg>`;
    const icon = new H.map.Icon(svg, { size: { w: 36, h: 36 }, anchor: { x: 18, y: 18 } });
    const m = new H.map.Marker({ lat: currentLocation.lat, lng: currentLocation.lng }, { icon });
    map.addObject(m);
    currentMarkerRef.current = m;
    if (followMode) {
      map.setCenter({ lat: currentLocation.lat, lng: currentLocation.lng }, true);
      if (map.getZoom() < 15) map.setZoom(16, true);
    }
  }, [currentLocation, heading, followMode]);

  if (!HERE_API_KEY) {
    return (
      <div className="flex h-full items-center justify-center bg-muted p-6 text-center text-sm text-muted-foreground">
        HERE-kaart niet beschikbaar — <code className="mx-1">VITE_HERE_API_KEY</code> ontbreekt.
      </div>
    );
  }
  return <div ref={containerRef} className="h-full w-full" aria-label="HERE routekaart" />;
}