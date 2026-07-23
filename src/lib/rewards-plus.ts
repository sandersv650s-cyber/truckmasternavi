import { useCallback, useEffect, useState } from "react";

export type Level = { level: number; label: string; minXp: number };

export const levels: Level[] = [
  { level: 1, label: "Rookie", minXp: 0 },
  { level: 2, label: "Wegkenner", minXp: 500 },
  { level: 3, label: "Roadwarrior", minXp: 1500 },
  { level: 4, label: "Ambassadeur", minXp: 3000 },
  { level: 5, label: "Legende", minXp: 6000 },
];

export function levelFor(xp: number): { current: Level; next?: Level; progressPct: number } {
  let current = levels[0];
  for (const l of levels) if (xp >= l.minXp) current = l;
  const next = levels.find((l) => l.minXp > xp);
  const span = next ? next.minXp - current.minXp : 1;
  const progressPct = next ? Math.min(100, Math.round(((xp - current.minXp) / span) * 100)) : 100;
  return { current, next, progressPct };
}

export type Challenge = {
  id: string;
  title: string;
  desc: string;
  xp: number;
  progress: number;
  target: number;
  emoji: string;
};

export const weeklyChallenges: Challenge[] = [
  { id: "wc1", title: "Meld 3 files", desc: "Help collega's met verkeersinfo.", xp: 150, progress: 2, target: 3, emoji: "🚧" },
  { id: "wc2", title: "Beoordeel 2 truckstops", desc: "Deel je ervaringen.", xp: 100, progress: 1, target: 2, emoji: "⭐" },
  { id: "wc3", title: "1000 km deze week", desc: "Registreer je ritten.", xp: 200, progress: 780, target: 1000, emoji: "🛣️" },
  { id: "wc4", title: "Deel 1 foto in community", desc: "Laat je truck of route zien.", xp: 80, progress: 0, target: 1, emoji: "📸" },
];

// visibility toggle for leaderboard
const KEY_VIS = "truckmate.leaderboard.visible.v1";
let cache: boolean | null = null;
const listeners = new Set<() => void>();

function load(): boolean {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(KEY_VIS);
  cache = v === null ? true : v === "1";
  return cache;
}
function persist(v: boolean) {
  cache = v;
  if (typeof window !== "undefined") localStorage.setItem(KEY_VIS, v ? "1" : "0");
  listeners.forEach((fn) => fn());
}

export function useLeaderboardVisible() {
  const [v, setV] = useState(true);
  useEffect(() => {
    setV(load());
    const l = () => setV(load());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const set = useCallback((val: boolean) => persist(val), []);
  return { visible: v, set };
}

// current XP & streak (mock — persisted)
const KEY_XP = "truckmate.xp.v1";
const KEY_STREAK = "truckmate.streak.v1";

export function getXP(): number {
  if (typeof window === "undefined") return 2380;
  const v = Number(localStorage.getItem(KEY_XP));
  return Number.isFinite(v) && v > 0 ? v : 2380;
}
export function getStreakDays(): number {
  if (typeof window === "undefined") return 12;
  const v = Number(localStorage.getItem(KEY_STREAK));
  return Number.isFinite(v) && v > 0 ? v : 12;
}