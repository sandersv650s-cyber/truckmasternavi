import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Adapter voor een externe brandstofprijs-feed.
 * Zolang er geen `FUEL_PRICE_API_KEY` secret bestaat, meldt de app eerlijk dat
 * de prijzen uit de eigen database (voorbeelddata) komen. Zodra de sleutel er is,
 * kan `fetchFromProvider` hieronder de echte feed aanroepen zonder UI-wijzigingen.
 */
export type FuelFeedStatus = {
  configured: boolean;
  provider: string | null;
  updatedAt: string | null;
  message: string;
};

export const getFuelFeedStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<FuelFeedStatus> => {
    const key = process.env.FUEL_PRICE_API_KEY;
    if (!key) {
      return {
        configured: false,
        provider: null,
        updatedAt: null,
        message:
          "Geen externe prijsfeed gekoppeld — prijzen komen uit de TruckMate-database (voorbeelddata en handmatige invoer).",
      };
    }
    return {
      configured: true,
      provider: process.env.FUEL_PRICE_PROVIDER ?? "extern",
      updatedAt: new Date().toISOString(),
      message: "Externe prijsfeed actief.",
    };
  },
);

/**
 * Synchroniseer prijzen vanaf de externe provider naar de databasecache.
 * Zonder `FUEL_PRICE_API_KEY` gebeurt er niets en krijgt de beheerder een
 * duidelijke melding — er wordt nooit gedaan alsof fallbackdata live is.
 */
export const syncFuelPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({}).parse(i ?? {}))
  .handler(async ({ context }) => {
    const { data: staff, error: roleErr } = await context.supabase.rpc("is_staff", {
      _uid: context.userId,
    });
    if (roleErr) throw new Error("Rolcontrole mislukt.");
    if (!staff) throw new Error("Forbidden: alleen moderators en beheerders.");

    const key = process.env.FUEL_PRICE_API_KEY;
    const endpoint = process.env.FUEL_PRICE_API_URL;
    if (!key || !endpoint) {
      return {
        ok: false as const,
        updated: 0,
        message:
          "Geen prijsfeed geconfigureerd. Voeg FUEL_PRICE_API_KEY en FUEL_PRICE_API_URL toe om te synchroniseren.",
      };
    }

    let payload: { stationId: string; fuelType: string; price: number }[] = [];
    try {
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${key}` } });
      if (!res.ok) throw new Error(`Provider gaf status ${res.status}`);
      const parsed = z
        .array(
          z.object({
            stationId: z.string().uuid(),
            fuelType: z.string().max(20),
            price: z.number().positive().max(10),
          }),
        )
        .safeParse(await res.json());
      if (!parsed.success) throw new Error("Onverwacht antwoordformaat van de provider.");
      payload = parsed.data;
    } catch (e) {
      return {
        ok: false as const,
        updated: 0,
        message: e instanceof Error ? e.message : "Synchronisatie mislukt.",
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const rows = payload.map((p) => ({
      station_id: p.stationId,
      fuel_type: p.fuelType,
      price_eur: p.price,
      source: process.env.FUEL_PRICE_PROVIDER ?? "extern",
      is_demo: false,
      reported_at: now,
    }));
    if (rows.length) {
      const { error } = await supabaseAdmin.from("fuel_prices").insert(rows as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const, updated: rows.length, message: `${rows.length} prijzen bijgewerkt.` };
  });
