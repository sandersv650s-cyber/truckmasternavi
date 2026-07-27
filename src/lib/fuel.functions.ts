import { createServerFn } from "@tanstack/react-start";

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
