import { useCallback, useEffect, useState } from "react";

export type Role = "chauffeur" | "eigenrijder" | "fleet";

export const roleMeta: Record<Role, { label: string; emoji: string; desc: string }> = {
  chauffeur: {
    label: "Chauffeur in loondienst",
    emoji: "🚚",
    desc: "Ik rij voor een transportbedrijf en gebruik TruckMate onderweg.",
  },
  eigenrijder: {
    label: "Eigenrijder / ZZP",
    emoji: "🛠️",
    desc: "Ik heb mijn eigen truck en regel ritten, kosten en administratie zelf.",
  },
  fleet: {
    label: "Fleetbeheerder",
    emoji: "🏢",
    desc: "Ik beheer meerdere voertuigen en chauffeurs.",
  },
};

const KEY = "truckmate.role.v1";
const DONE_KEY = "truckmate.onboarding.v1";
let cache: Role | null = null;
const listeners = new Set<() => void>();

function load(): Role {
  if (cache) return cache;
  if (typeof window === "undefined") return "chauffeur";
  const v = localStorage.getItem(KEY) as Role | null;
  cache = v && roleMeta[v] ? v : "chauffeur";
  return cache;
}
function persist(r: Role) {
  cache = r;
  if (typeof window !== "undefined") localStorage.setItem(KEY, r);
  listeners.forEach((fn) => fn());
}

export function useRole() {
  const [role, setRoleState] = useState<Role>("chauffeur");
  useEffect(() => {
    setRoleState(load());
    const l = () => setRoleState(load());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const setRole = useCallback((r: Role) => persist(r), []);
  return { role, setRole };
}

export function markOnboardingDone() {
  if (typeof window !== "undefined") localStorage.setItem(DONE_KEY, "1");
}
export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(DONE_KEY) === "1";
}