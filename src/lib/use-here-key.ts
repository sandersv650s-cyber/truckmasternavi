import { useEffect, useState } from "react";
import { ensureHereKey, getHereKey, subscribeHereKey } from "./here";

export type HereKeyState = { key?: string; ready: boolean; loading: boolean };

/** Reactive access to the central HERE key (build-time or runtime-resolved). */
export function useHereKey(): HereKeyState {
  const [key, setKey] = useState<string | undefined>(() => getHereKey());
  const [loading, setLoading] = useState(() => !getHereKey());

  useEffect(() => {
    let alive = true;
    const unsub = subscribeHereKey(() => alive && setKey(getHereKey()));
    void ensureHereKey().then((k) => {
      if (!alive) return;
      setKey(k);
      setLoading(false);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  return { key, ready: Boolean(key), loading: loading && !key };
}