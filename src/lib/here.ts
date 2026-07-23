// HERE Technologies routing + search integration.
// API key is read from VITE_HERE_API_KEY. If missing, callers should show a
// clear admin-only setup notice; nothing is hardcoded.
import flexpolyline from "@here/flexpolyline";

export const HERE_API_KEY: string | undefined =
  (import.meta.env as any).HERE_API_KEY || undefined;

export const hasHereKey = () => Boolean(HERE_API_KEY);

export type LatLng = { lat: number; lng: number };

export type HereSuggestion = {
  id: string;
  title: string;
  address?: string;
  position?: LatLng;
  // "houseNumber" | "street" | "locality" | "administrativeArea" | "place" | "categoryQuery"
  resultType?: string;
  href?: string; // for lookup fallback when position is missing
};

export type HereManeuver = {
  instruction: string;
  distance_m: number;
  duration_s: number;
  offset: number; // index into polyline
};

export type HereRouteSection = {
  polyline: LatLng[];
  distance_m: number;
  duration_s: number;
  base_duration_s: number;
  maneuvers: HereManeuver[];
  notices: { title: string; code?: string; severity?: string }[];
};

export type HereRoute = {
  id: string;
  sections: HereRouteSection[];
  distance_m: number;
  duration_s: number;
  base_duration_s: number;
  polyline: LatLng[];
  maneuvers: HereManeuver[];
  notices: { title: string; code?: string; severity?: string }[];
  traffic_delay_s: number;
};

export type TruckProfile = {
  height_cm?: number | null;
  width_cm?: number | null;
  length_cm?: number | null;
  weight_kg?: number | null;
  axle_weight_kg?: number | null;
  axle_count?: number | null;
  trailer_count?: number | null;
  hazardous?: boolean | null;
  tunnel_category?: "B" | "C" | "D" | "E" | null;
};

export type AvoidFeature =
  | "tollRoad"
  | "controlledAccessHighway"
  | "ferry"
  | "tunnel"
  | "dirtRoad"
  | "difficultTurns"
  | "uTurns";

export type TransportMode = "truck" | "car";

export type RouteOptions = {
  origin: LatLng;
  destination: LatLng;
  via?: LatLng[];
  transportMode?: TransportMode;
  truck?: TruckProfile;
  avoid?: AvoidFeature[];
  alternatives?: number; // 0..6
  lang?: string;
};

function requireKey(): string {
  if (!HERE_API_KEY) {
    throw new Error(
      "HERE API key ontbreekt. Voeg VITE_HERE_API_KEY toe in Project Settings → Secrets.",
    );
  }
  return HERE_API_KEY;
}

// --- Search / geocoding -----------------------------------------------------

export async function autosuggest(
  q: string,
  at?: LatLng,
  signal?: AbortSignal,
): Promise<HereSuggestion[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const key = requireKey();
  const url = new URL("https://autosuggest.search.hereapi.com/v1/autosuggest");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "7");
  url.searchParams.set("lang", "nl");
  url.searchParams.set("apiKey", key);
  url.searchParams.set("at", at ? `${at.lat},${at.lng}` : "52.1,5.3");
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HERE autosuggest fout (${res.status})`);
  const j = (await res.json()) as { items?: any[] };
  return (j.items ?? [])
    .map((it) => ({
      id: it.id,
      title: it.title,
      address: it.address?.label,
      position: it.position ? { lat: it.position.lat, lng: it.position.lng } : undefined,
      resultType: it.resultType,
      href: it.href,
    }))
    .filter((it) => it.position || it.href);
}

export async function lookupSuggestion(
  hit: HereSuggestion,
  signal?: AbortSignal,
): Promise<LatLng | null> {
  if (hit.position) return hit.position;
  if (!hit.href) return null;
  const key = requireKey();
  const url = new URL(hit.href);
  url.searchParams.set("apiKey", key);
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const j = (await res.json()) as { position?: { lat: number; lng: number } };
  return j.position ? { lat: j.position.lat, lng: j.position.lng } : null;
}

export async function reverseGeocode(at: LatLng, signal?: AbortSignal): Promise<string> {
  const key = requireKey();
  const url = new URL("https://revgeocode.search.hereapi.com/v1/revgeocode");
  url.searchParams.set("at", `${at.lat},${at.lng}`);
  url.searchParams.set("lang", "nl");
  url.searchParams.set("apiKey", key);
  const res = await fetch(url, { signal });
  if (!res.ok) return `${at.lat.toFixed(5)}, ${at.lng.toFixed(5)}`;
  const j = (await res.json()) as { items?: { address?: { label?: string } }[] };
  return j.items?.[0]?.address?.label ?? `${at.lat.toFixed(5)}, ${at.lng.toFixed(5)}`;
}

// --- Routing ----------------------------------------------------------------

function decodePolyline(encoded: string): LatLng[] {
  const decoded = flexpolyline.decode(encoded) as { polyline: number[][] };
  return decoded.polyline.map(([lat, lng]) => ({ lat, lng }));
}

function pushVehicleParams(url: URL, t: TruckProfile) {
  if (t.height_cm) url.searchParams.set("vehicle[height]", (t.height_cm / 100).toFixed(2));
  if (t.width_cm) url.searchParams.set("vehicle[width]", (t.width_cm / 100).toFixed(2));
  if (t.length_cm) url.searchParams.set("vehicle[length]", (t.length_cm / 100).toFixed(2));
  if (t.weight_kg) url.searchParams.set("vehicle[grossWeight]", String(t.weight_kg));
  if (t.axle_weight_kg) url.searchParams.set("vehicle[weightPerAxle]", String(t.axle_weight_kg));
  if (t.axle_count) url.searchParams.set("vehicle[axleCount]", String(t.axle_count));
  if (t.trailer_count != null)
    url.searchParams.set("vehicle[trailerCount]", String(t.trailer_count));
  if (t.hazardous) url.searchParams.set("vehicle[shippedHazardousGoods]", "explosive");
  if (t.tunnel_category) url.searchParams.set("vehicle[tunnelCategory]", t.tunnel_category);
}

export async function computeRoutes(opts: RouteOptions, signal?: AbortSignal): Promise<HereRoute[]> {
  const key = requireKey();
  const url = new URL("https://router.hereapi.com/v8/routes");
  url.searchParams.set("transportMode", opts.transportMode ?? "truck");
  url.searchParams.set("origin", `${opts.origin.lat},${opts.origin.lng}`);
  url.searchParams.set("destination", `${opts.destination.lat},${opts.destination.lng}`);
  for (const v of opts.via ?? []) url.searchParams.append("via", `${v.lat},${v.lng}`);
  url.searchParams.set(
    "return",
    "polyline,summary,actions,instructions,travelSummary,typicalDuration",
  );
  url.searchParams.set("lang", opts.lang ?? "nl-NL");
  if (opts.alternatives && opts.alternatives > 0)
    url.searchParams.set("alternatives", String(Math.min(6, opts.alternatives)));
  if ((opts.transportMode ?? "truck") === "truck" && opts.truck) pushVehicleParams(url, opts.truck);
  if (opts.avoid && opts.avoid.length) {
    url.searchParams.set("avoid[features]", opts.avoid.join(","));
  }
  url.searchParams.set("apiKey", key);

  const res = await fetch(url, { signal });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (j as any)?.title || (j as any)?.cause || `HERE routing fout (${res.status})`;
    if (res.status === 401 || res.status === 403) {
      throw new Error("HERE API-sleutel ongeldig of ontbreekt.");
    }
    throw new Error(msg);
  }
  const routes = ((j as any).routes ?? []) as any[];
  if (routes.length === 0) throw new Error("Geen route beschikbaar voor deze parameters.");
  return routes.map((r): HereRoute => {
    const sections: HereRouteSection[] = (r.sections ?? []).map((s: any) => {
      const poly = decodePolyline(s.polyline);
      const notices = (s.notices ?? []).map((n: any) => ({
        title: n.title,
        code: n.code,
        severity: n.severity,
      }));
      const maneuvers: HereManeuver[] = (s.actions ?? []).map((a: any) => ({
        instruction: a.instruction,
        distance_m: a.length ?? 0,
        duration_s: a.duration ?? 0,
        offset: a.offset ?? 0,
      }));
      return {
        polyline: poly,
        distance_m: s.travelSummary?.length ?? s.summary?.length ?? 0,
        duration_s: s.travelSummary?.duration ?? s.summary?.duration ?? 0,
        base_duration_s:
          s.travelSummary?.baseDuration ?? s.summary?.baseDuration ?? s.travelSummary?.duration ?? 0,
        maneuvers,
        notices,
      };
    });
    const distance = sections.reduce((n, s) => n + s.distance_m, 0);
    const duration = sections.reduce((n, s) => n + s.duration_s, 0);
    const base = sections.reduce((n, s) => n + s.base_duration_s, 0);
    // flatten maneuvers with polyline offsets adjusted per section
    let offsetBase = 0;
    const all: HereManeuver[] = [];
    const polyAll: LatLng[] = [];
    for (const s of sections) {
      for (const m of s.maneuvers) all.push({ ...m, offset: m.offset + offsetBase });
      polyAll.push(...s.polyline);
      offsetBase += s.polyline.length;
    }
    const notices = sections.flatMap((s) => s.notices);
    return {
      id: r.id ?? Math.random().toString(36).slice(2),
      sections,
      distance_m: distance,
      duration_s: duration,
      base_duration_s: base,
      polyline: polyAll,
      maneuvers: all,
      notices,
      traffic_delay_s: Math.max(0, duration - base),
    };
  });
}

// --- Formatting -------------------------------------------------------------

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

export function etaString(duration_s: number): string {
  return new Date(Date.now() + duration_s * 1000).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Geometry helpers -------------------------------------------------------

export function haversine_m(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Returns nearest polyline point index and its distance in meters. */
export function nearestOnPolyline(pt: LatLng, poly: LatLng[]): { index: number; distance_m: number } {
  let best = { index: 0, distance_m: Infinity };
  for (let i = 0; i < poly.length; i++) {
    const d = haversine_m(pt, poly[i]);
    if (d < best.distance_m) best = { index: i, distance_m: d };
  }
  return best;
}

/** Cumulative distance along the polyline from index onward to end (meters). */
export function remainingAlong(poly: LatLng[], fromIndex: number): number {
  let sum = 0;
  for (let i = Math.max(0, fromIndex); i < poly.length - 1; i++) {
    sum += haversine_m(poly[i], poly[i + 1]);
  }
  return sum;
}