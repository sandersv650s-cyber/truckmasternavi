import { useEffect, useState } from "react";
import { ensureHereKey, getHereKey, subscribeHereKey } from "./here";

export type HereKeyState = { key?: string; ready: boolean; loading: boolean };

/** Reactive access to the central HERE key (build-time or runtime-resolved). */
export function useHereKey(): HereKeyState {
  const [key, setKey] = useState<string | undefined>(() => getHereKey());
  const [loading, setLoading] = useState(() => !getHereKey());

  useEffect(() => {
    let alive = true;

    const resolve = async () => {
      if (!alive || getHereKey()) return;
      setLoading(true);
      const k = await ensureHereKey();
      if (!alive) return;
      setKey(k);
      setLoading(false);
    };

    const unsub = subscribeHereKey(() => {
      if (!alive) return;
      setKey(getHereKey());
      setLoading(false);
    });

    void resolve();

    // Een secret kan vlak na publiceren of na een tijdelijke netwerkfout nog
    // niet beschikbaar zijn. Probeer daarom rustig opnieuw zonder paginareload.
    const retry = window.setInterval(() => {
      if (!getHereKey()) void resolve();
    }, 5_000);
    window.addEventListener("online", resolve);

    return () => {
      alive = false;
      window.clearInterval(retry);
      window.removeEventListener("online", resolve);
      unsub();
    };
  }, []);

  return { key, ready: Boolean(key), loading: loading && !key };
}
