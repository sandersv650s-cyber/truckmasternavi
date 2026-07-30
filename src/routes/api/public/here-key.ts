import { createFileRoute } from "@tanstack/react-router";

// Serves the HERE Maps JS/REST browser key at runtime. This makes deployments
// independent from build-time key injection. Restrict the key to the allowed
// production and preview domains in the HERE portal.
export const Route = createFileRoute("/api/public/here-key")({
  server: {
    handlers: {
      GET: () => {
        const key = (process.env.HERE_API_KEY ?? "").trim();
        return new Response(JSON.stringify({ key: key || null }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
