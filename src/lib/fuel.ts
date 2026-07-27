import { supabase } from "@/integrations/supabase/client";

/**
 * Provider-laag voor brandstofprijzen.
 * De app praat alleen met `FuelPriceProvider`, zodat een externe API
 * (bijv. TankService, Fuelo, HERE Fuel Prices) later ingeplugd kan worden
 * zonder UI-wijzigingen.
 */
export type FuelStation = {
  id: string;
  name: string;
  brand: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  road: string | null;
  lat: number | null;
  lng: number | null;
  truck_suitable: boolean;
  has_adblue: boolean;
  open_hours: string | null;
  source: string;
  is_example: boolean;
};

export type FuelPrice = {
  id: string;
  station_id: string;
  fuel_type: string;
  price_eur: number;
  source: string;
  is_demo: boolean;
  reported_at: string;
};

export const fuelTypes = {
  diesel: "Diesel",
  adblue: "AdBlue",
  hvo100: "HVO100",
  lng: "LNG",
} as const;
export type FuelType = keyof typeof fuelTypes;
export const fuelUnit: Record<FuelType, string> = {
  diesel: "/L",
  adblue: "/L",
  hvo100: "/L",
  lng: "/kg",
};

export type StationWithPrice = FuelStation & {
  /** laatste prijs per brandstofsoort */
  prices: Partial<Record<FuelType, FuelPrice>>;
  /** laatste dieselprijs, voor sortering en compatibiliteit */
  price: FuelPrice | null;
};

export type FuelQuery = { city?: string; truckOnly?: boolean; adblue?: boolean };

/** Hemelsbrede afstand in km. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number | null; lng: number | null },
): number | null {
  if (b.lat == null || b.lng == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export interface FuelPriceProvider {
  readonly id: string;
  readonly label: string;
  /** true zodra een echte live databron gekoppeld is */
  readonly isLive: boolean;
  list(query: FuelQuery): Promise<StationWithPrice[]>;
}

export const supabaseFuelProvider: FuelPriceProvider = {
  id: "supabase",
  label: "TruckMate database",
  isLive: false,
  async list(query) {
    let q = supabase.from("fuel_stations").select("*").order("name");
    if (query.city) q = q.ilike("city", `%${query.city}%`);
    if (query.truckOnly) q = q.eq("truck_suitable", true);
    if (query.adblue) q = q.eq("has_adblue", true);
    const { data: stations, error } = await q;
    if (error) throw error;
    const rows = (stations ?? []) as FuelStation[];
    if (!rows.length) return [];
    const { data: prices, error: e2 } = await supabase
      .from("fuel_prices")
      .select("*")
      .in(
        "station_id",
        rows.map((s) => s.id),
      )
      .order("reported_at", { ascending: false });
    if (e2) throw e2;
    const latest = new Map<string, Partial<Record<FuelType, FuelPrice>>>();
    for (const p of (prices ?? []) as FuelPrice[]) {
      const bucket = latest.get(p.station_id) ?? {};
      const type = p.fuel_type as FuelType;
      if (!bucket[type]) bucket[type] = p;
      latest.set(p.station_id, bucket);
    }
    return rows.map((s) => {
      const byType = latest.get(s.id) ?? {};
      return { ...s, prices: byType, price: byType.diesel ?? null };
    });
  },
};

let activeProvider: FuelPriceProvider = supabaseFuelProvider;
export function getFuelProvider() {
  return activeProvider;
}
export function setFuelProvider(p: FuelPriceProvider) {
  activeProvider = p;
}

/* ---------- Beheer (admin/moderator) ---------- */

export async function upsertStation(s: Partial<FuelStation> & { name: string }) {
  const { data, error } = await supabase.from("fuel_stations").upsert(s).select("*").single();
  if (error) throw error;
  return data as FuelStation;
}

export async function deleteStation(id: string) {
  const { error } = await supabase.from("fuel_stations").delete().eq("id", id);
  if (error) throw error;
}

/** Nieuwe prijsregistratie; historie blijft bewaard voor 'laatst bijgewerkt'. */
export async function reportPrice(input: {
  station_id: string;
  fuel_type: FuelType;
  price_eur: number;
  source?: string;
  is_demo?: boolean;
}) {
  const { error } = await supabase.from("fuel_prices").insert({
    station_id: input.station_id,
    fuel_type: input.fuel_type,
    price_eur: input.price_eur,
    source: input.source ?? "admin",
    is_demo: input.is_demo ?? false,
    reported_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/**
 * Bulk-import: regels `stationnaam;brandstof;prijs`.
 * Bestaat het station niet, dan wordt het aangemaakt.
 */
export async function importPricesCsv(text: string, source = "import") {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const stations = await supabase.from("fuel_stations").select("id, name");
  if (stations.error) throw stations.error;
  const byName = new Map(
    (stations.data ?? []).map((s) => [s.name.toLowerCase(), s.id as string]),
  );
  let ok = 0;
  const errors: string[] = [];
  for (const line of lines) {
    const [name, type, price] = line.split(";").map((v) => v?.trim());
    const value = Number((price ?? "").replace(",", "."));
    if (!name || !type || !Number.isFinite(value)) {
      errors.push(`Ongeldige regel: ${line}`);
      continue;
    }
    if (!(type in fuelTypes)) {
      errors.push(`Onbekende brandstofsoort: ${type}`);
      continue;
    }
    let id = byName.get(name.toLowerCase());
    if (!id) {
      const created = await upsertStation({ name, source, is_example: false });
      id = created.id;
      byName.set(name.toLowerCase(), id);
    }
    try {
      await reportPrice({
        station_id: id,
        fuel_type: type as FuelType,
        price_eur: value,
        source,
        is_demo: false,
      });
      ok += 1;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : `Fout bij ${name}`);
    }
  }
  return { ok, errors };
}
