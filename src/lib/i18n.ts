import { useCallback, useEffect, useState } from "react";

export type Lang = "nl" | "en" | "de" | "fr" | "pl";

export const languages: { code: Lang; label: string; flag: string }[] = [
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
];

type Dict = Record<string, string>;

const translations: Record<Lang, Dict> = {
  nl: {
    "nav.dashboard": "Dashboard",
    "nav.planner": "Route",
    "nav.discover": "Ontdekken",
    "nav.community": "Community",
    "nav.profile": "Profiel",
    "nav.more": "Meer",
    "common.settings": "Instellingen",
    "common.language": "Taal",
    "common.role": "Rol",
    "common.save": "Opslaan",
    "common.cancel": "Annuleren",
    "common.close": "Sluiten",
    "common.demo": "Demo",
    "common.soon": "Binnenkort",
    "common.notConnected": "Niet gekoppeld",
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.planner": "Route",
    "nav.discover": "Discover",
    "nav.community": "Community",
    "nav.profile": "Profile",
    "nav.more": "More",
    "common.settings": "Settings",
    "common.language": "Language",
    "common.role": "Role",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.demo": "Demo",
    "common.soon": "Coming soon",
    "common.notConnected": "Not connected",
  },
  de: {
    "nav.dashboard": "Übersicht",
    "nav.planner": "Route",
    "nav.discover": "Entdecken",
    "nav.community": "Community",
    "nav.profile": "Profil",
    "nav.more": "Mehr",
    "common.settings": "Einstellungen",
    "common.language": "Sprache",
    "common.role": "Rolle",
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
    "common.close": "Schließen",
    "common.demo": "Demo",
    "common.soon": "Demnächst",
    "common.notConnected": "Nicht verbunden",
  },
  fr: {
    "nav.dashboard": "Tableau",
    "nav.planner": "Route",
    "nav.discover": "Découvrir",
    "nav.community": "Communauté",
    "nav.profile": "Profil",
    "nav.more": "Plus",
    "common.settings": "Paramètres",
    "common.language": "Langue",
    "common.role": "Rôle",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.close": "Fermer",
    "common.demo": "Démo",
    "common.soon": "Bientôt",
    "common.notConnected": "Non connecté",
  },
  pl: {
    "nav.dashboard": "Pulpit",
    "nav.planner": "Trasa",
    "nav.discover": "Odkrywaj",
    "nav.community": "Społeczność",
    "nav.profile": "Profil",
    "nav.more": "Więcej",
    "common.settings": "Ustawienia",
    "common.language": "Język",
    "common.role": "Rola",
    "common.save": "Zapisz",
    "common.cancel": "Anuluj",
    "common.close": "Zamknij",
    "common.demo": "Demo",
    "common.soon": "Wkrótce",
    "common.notConnected": "Niepołączone",
  },
};

const KEY = "truckmate.lang.v1";
let cache: Lang | null = null;
const listeners = new Set<() => void>();

function load(): Lang {
  if (cache) return cache;
  if (typeof window === "undefined") return "nl";
  const v = localStorage.getItem(KEY) as Lang | null;
  cache = v && translations[v] ? v : "nl";
  return cache;
}

function persist(l: Lang) {
  cache = l;
  if (typeof window !== "undefined") localStorage.setItem(KEY, l);
  listeners.forEach((fn) => fn());
}

export function useI18n() {
  const [lang, setLangState] = useState<Lang>("nl");
  useEffect(() => {
    setLangState(load());
    const l = () => setLangState(load());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const t = useCallback(
    (key: string) => translations[lang][key] ?? translations.nl[key] ?? key,
    [lang],
  );
  const setLang = useCallback((l: Lang) => persist(l), []);
  return { lang, setLang, t };
}