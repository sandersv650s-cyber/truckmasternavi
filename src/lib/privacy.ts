import { useCallback, useEffect, useState } from "react";
import { privacyOptions, type PrivacyKey } from "@/lib/more-data";

const KEY = "truckmate.privacy.v1";
type State = Record<PrivacyKey, boolean>;

function defaults(): State {
  const out = {} as State;
  for (const p of privacyOptions) out[p.key] = p.defaultOn;
  return out;
}

let cache: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (cache) return cache;
  if (typeof window === "undefined") return defaults();
  try {
    cache = { ...defaults(), ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    cache = defaults();
  }
  return cache!;
}
function persist(next: State) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function usePrivacy() {
  const [state, setState] = useState<State>(() => defaults());
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setState(load());
    setHydrated(true);
    const l = () => setState(load());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const set = useCallback((k: PrivacyKey, v: boolean) => {
    persist({ ...load(), [k]: v });
  }, []);
  const reset = useCallback(() => persist(defaults()), []);
  return { state, set, reset, hydrated };
}