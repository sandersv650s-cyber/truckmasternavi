import { useCallback, useEffect, useState } from "react";

export type NotificationIcon = "alert" | "star" | "chat" | "trophy" | "parking";

export type Notification = {
  id: string;
  title: string;
  body: string;
  icon: NotificationIcon;
  createdMinAgo: number;
  href: "/meldingen" | "/community" | "/chat" | "/beloningen" | "/truckstops" | "/brandstof" | "/kaart";
};

export const seedNotifications: Notification[] = [
  {
    id: "n1",
    title: "Nieuwe file op je route",
    body: "6 km file op de A2 richting Utrecht — vertraging ±40 min.",
    icon: "alert",
    createdMinAgo: 4,
    href: "/meldingen",
  },
  {
    id: "n2",
    title: "Autohof Kamen heeft weer plek",
    body: "Je favoriete parking heeft nu 30+ plekken beschikbaar.",
    icon: "parking",
    createdMinAgo: 22,
    href: "/truckstops",
  },
  {
    id: "n3",
    title: "Nieuwe badge verdiend",
    body: "Je hebt 'EU Traveler' ontgrendeld (+200 pt).",
    icon: "trophy",
    createdMinAgo: 130,
    href: "/beloningen",
  },
  {
    id: "n4",
    title: "Sanne reageerde op je bericht",
    body: "\"Mooie foto! Waar was dit?\"",
    icon: "chat",
    createdMinAgo: 55,
    href: "/community",
  },
  {
    id: "n5",
    title: "Diesel gedaald bij Aral Kamen",
    body: "€ 1,629/L — 4 ct goedkoper dan gemiddeld op deze route.",
    icon: "star",
    createdMinAgo: 8,
    href: "/brandstof",
  },
  {
    id: "n6",
    title: "Weg afgesloten A16 Moerdijk",
    body: "Omleiding via A17. Meld je route opnieuw voor advies.",
    icon: "alert",
    createdMinAgo: 65,
    href: "/kaart",
  },
];

const KEY = "truckmate.notifications.v1";
type State = { readIds: string[] };
const listeners = new Set<() => void>();
let cache: State | null = null;

function load(): State {
  if (cache) return cache;
  if (typeof window === "undefined") return { readIds: [] };
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{\"readIds\":[]}");
  } catch {
    cache = { readIds: [] };
  }
  return cache!;
}
function persist(next: State) {
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

export function useNotifications() {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReadIds(load().readIds);
    setHydrated(true);
    const l = () => setReadIds(load().readIds);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const markRead = useCallback((id: string) => {
    const s = load();
    if (s.readIds.includes(id)) return;
    persist({ readIds: [...s.readIds, id] });
  }, []);

  const markAll = useCallback(() => {
    persist({ readIds: seedNotifications.map((n) => n.id) });
  }, []);

  const unreadCount = hydrated
    ? seedNotifications.filter((n) => !readIds.includes(n.id)).length
    : 0;

  return {
    notifications: seedNotifications,
    isRead: (id: string) => readIds.includes(id),
    unreadCount,
    markRead,
    markAll,
    hydrated,
  };
}