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

export type StationWithPrice = FuelStation & { price: FuelPrice | null };

export type FuelQuery = { city?: string; truckOnly?: boolean; adblue?: boolean };

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
    const latest = new Map<string, FuelPrice>();
    for (const p of (prices ?? []) as FuelPrice[]) {
      if (!latest.has(p.station_id)) latest.set(p.station_id, p);
    }
    return rows.map((s) => ({ ...s, price: latest.get(s.id) ?? null }));
  },
};

let activeProvider: FuelPriceProvider = supabaseFuelProvider;
export function getFuelProvider() {
  return activeProvider;
}
export function setFuelProvider(p: FuelPriceProvider) {
  activeProvider = p;
}
