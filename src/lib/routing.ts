// Central provider config so a paid truck-routing provider can be swapped in later.
export const routingProvider = {
  name: "OSRM (openstreetmap.de) + Nominatim",
  supportsTruckProfile: false,
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  osrmBase: "https://router.project-osrm.org",
  nominatimBase: "https://nominatim.openstreetmap.org",
} as const;

export type Waypoint = {
  label: string;
  lat: number;
  lng: number;
};

export type GeocodeHit = {
  display_name: string;
  lat: number;
  lng: number;
};

export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = new URL(`${routingProvider.nominatimBase}/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", "6");
  url.searchParams.set("accept-language", "nl");
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Zoeken mislukt (${res.status})`);
  const arr = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return arr.map((x) => ({
    display_name: x.display_name,
    lat: parseFloat(x.lat),
    lng: parseFloat(x.lon),
  }));
}

export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<string> {
  const url = new URL(`${routingProvider.nominatimBase}/reverse`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("accept-language", "nl");
  const res = await fetch(url, { signal });
  if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const j = (await res.json()) as { display_name?: string };
  return j.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export type RouteStep = {
  instruction: string;
  distance_m: number;
  duration_s: number;
};

export type RouteResult = {
  distance_m: number;
  duration_s: number;
  geometry: [number, number][]; // [lat, lng]
  steps: RouteStep[];
};

function stepInstruction(step: {
  maneuver: { type: string; modifier?: string };
  name?: string;
}): string {
  const t = step.maneuver.type;
  const mod = step.maneuver.modifier;
  const name = step.name ? ` ${step.name}` : "";
  const modMap: Record<string, string> = {
    left: "linksaf",
    right: "rechtsaf",
    "slight left": "iets naar links",
    "slight right": "iets naar rechts",
    "sharp left": "scherp linksaf",
    "sharp right": "scherp rechtsaf",
    straight: "rechtdoor",
    uturn: "keren",
  };
  const typeMap: Record<string, string> = {
    depart: `Vertrek${name}`,
    arrive: `Aankomst${name}`,
    turn: `Sla ${mod ? modMap[mod] ?? mod : "af"}${name}`,
    "new name": `Ga verder${name}`,
    merge: `Voeg in${name}`,
    "on ramp": `Neem de oprit${name}`,
    "off ramp": `Neem de afrit${name}`,
    fork: `Neem de ${mod ? modMap[mod] ?? mod : ""} vertakking${name}`,
    "end of road": `Aan het eind ${mod ? modMap[mod] ?? mod : ""}${name}`,
    continue: `Rechtdoor${name}`,
    roundabout: `Neem de rotonde${name}`,
    rotary: `Neem de rotonde${name}`,
    "roundabout turn": `Op de rotonde ${mod ? modMap[mod] ?? mod : ""}${name}`,
    notification: `Blijf rechtdoor${name}`,
  };
  return typeMap[t] ?? `${t}${name}`;
}

export async function computeRoute(waypoints: Waypoint[], signal?: AbortSignal): Promise<RouteResult> {
  if (waypoints.length < 2) throw new Error("Minstens twee punten nodig");
  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(";");
  const url = `${routingProvider.osrmBase}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true&annotations=false`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Routeserver-fout (${res.status})`);
  const j = (await res.json()) as {
    code: string;
    message?: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: { coordinates: [number, number][] };
      legs: Array<{
        steps: Array<{
          distance: number;
          duration: number;
          name?: string;
          maneuver: { type: string; modifier?: string };
        }>;
      }>;
    }>;
  };
  if (j.code !== "Ok" || !j.routes?.length) {
    throw new Error(j.message || "Geen route beschikbaar tussen deze punten");
  }
  const r = j.routes[0];
  const geometry: [number, number][] = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const steps: RouteStep[] = r.legs.flatMap((leg) =>
    leg.steps.map((s) => ({
      instruction: stepInstruction(s),
      distance_m: s.distance,
      duration_s: s.duration,
    })),
  );
  return { distance_m: r.distance, duration_s: r.duration, geometry, steps };
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}

export function formatDuration(s: number): string {
  const total = Math.round(s / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} u ${m} min` : `${m} min`;
}

export function externalNavUrl(wps: Waypoint[]): string {
  // Google Maps supports origin, destination and waypoints for cross-device deep links.
  if (wps.length < 2) return "https://maps.google.com";
  const origin = `${wps[0].lat},${wps[0].lng}`;
  const destination = `${wps[wps.length - 1].lat},${wps[wps.length - 1].lng}`;
  const mid = wps.slice(1, -1).map((w) => `${w.lat},${w.lng}`).join("|");
  const u = new URL("https://www.google.com/maps/dir/");
  u.searchParams.set("api", "1");
  u.searchParams.set("origin", origin);
  u.searchParams.set("destination", destination);
  if (mid) u.searchParams.set("waypoints", mid);
  u.searchParams.set("travelmode", "driving");
  return u.toString();
}