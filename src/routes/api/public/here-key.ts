import { createFileRoute } from "@tanstack/react-router";

// Serves the HERE Maps JS/REST key to the browser at runtime.
// Lovable secrets are runtime-only, so the compile-time `define` fallback is
// empty in published builds; this endpoint is the reliable source. The key is
// a browser-side Maps key (it ships in the client bundle anyway when the build
// env has it) — restrict it by domain in the HERE portal.
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