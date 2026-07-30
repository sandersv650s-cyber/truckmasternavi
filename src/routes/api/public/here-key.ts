import { createFileRoute } from "@tanstack/react-router";

// Serves the browser-safe HERE Maps/REST key at runtime. Configure either
// HERE_API_KEY (server variable) or VITE_HERE_API_KEY (public build variable)
// on the chosen hosting platform. Restrict this key by domain in the HERE portal.
export const Route = createFileRoute("/api/public/here-key")({
  server: {
    handlers: {
      GET: () => {
        const key = (
          process.env.HERE_API_KEY ??
          process.env.VITE_HERE_API_KEY ??
          ""
        ).trim();
        const hasKey = key.length > 0;

        return new Response(JSON.stringify({ key: hasKey ? key : null }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            // Never cache a missing value: once configuration is fixed, the
            // routeplanner should recover without waiting for a stale cache.
            "cache-control": hasKey
              ? "public, max-age=300, stale-while-revalidate=60"
              : "no-store, max-age=0",
          },
        });
      },
    },
  },
});