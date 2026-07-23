import { useCallback, useEffect, useState } from "react";

const KEY = "truckmate.favorites.v1";
type Store = Record<string, string[]>;

const listeners = new Set<() => void>();
let cache: Store | null = null;

function load(): Store {
  if (cache) return cache;
  if (typeof window === "undefined") return {};
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    cache = {};
  }
  return cache!;
}
function persist(next: Store) {
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

export function useFavorites(namespace: string) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(load()[namespace] ?? []);
    setHydrated(true);
    const l = () => setIds(load()[namespace] ?? []);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [namespace]);

  const toggle = useCallback(
    (id: string) => {
      const store = load();
      const cur = store[namespace] ?? [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      persist({ ...store, [namespace]: next });
    },
    [namespace],
  );

  const isFav = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, isFav, toggle, hydrated, count: ids.length };
}