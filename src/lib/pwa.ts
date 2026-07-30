// Guarded service worker registration wrapper.
// Registers /sw.js only in a top-level production window. Supports ?sw=off
// as an emergency kill switch for troubleshooting deployments.

function shouldRegister(): boolean {
  if (!import.meta.env.PROD) return false;
  if (typeof window === "undefined") return false;
  try {
    if (window.top !== window.self) return false;
  } catch {
    return false;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") return false;
  return true;
}

async function unregisterAppSW() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
      if (url.endsWith("/sw.js")) await r.unregister();
    }
  } catch {
    /* ignore */
  }
}

export function registerPWA() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!shouldRegister()) {
    void unregisterAppSW();
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* silent */
    });
  });
}
