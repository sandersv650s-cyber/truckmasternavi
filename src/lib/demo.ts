import { useCallback, useEffect, useState } from "react";

const TOUR_KEY = "truckmate.tour.v1";

// All localStorage keys the demo writes to. Kept here so "Reset demodata"
// can wipe everything the user has interacted with in the demo.
const DEMO_KEYS = [
  "truckmate.role.v1",
  "truckmate.onboarding.v1",
  "truckmate.tour.v1",
  "truckmate.favorites.truckstops",
  "truckmate.favorites.fuel",
  "truckmate.favorites.stops",
  "truckmate.notifications.v1",
  "truckmate.notifications.read.v1",
  "truckmate.privacy.v1",
  "truckmate.i18n.lang",
  "truckmate.login.v1",
];

export function resetDemoData() {
  if (typeof window === "undefined") return;
  // Wipe both the known keys and any other truckmate.* keys we may have added.
  const toRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && (k.startsWith("truckmate.") || DEMO_KEYS.includes(k))) toRemove.push(k);
  }
  toRemove.forEach((k) => window.localStorage.removeItem(k));
  window.location.assign("/");
}

const listeners = new Set<() => void>();

export function useDemoTour() {
  const [done, setDone] = useState<boolean>(true);
  useEffect(() => {
    setDone(window.localStorage.getItem(TOUR_KEY) === "1");
    const l = () => setDone(window.localStorage.getItem(TOUR_KEY) === "1");
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const finish = useCallback(() => {
    window.localStorage.setItem(TOUR_KEY, "1");
    listeners.forEach((fn) => fn());
  }, []);
  const restart = useCallback(() => {
    window.localStorage.removeItem(TOUR_KEY);
    listeners.forEach((fn) => fn());
  }, []);
  return { done, finish, restart };
}