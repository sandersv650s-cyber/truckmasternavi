export type Amenity =
  | "veilig"
  | "bewaakt"
  | "douche"
  | "toilet"
  | "restaurant"
  | "winkel"
  | "wifi"
  | "wasmachine"
  | "reparatie"
  | "adblue";

export const amenityLabels: Record<Amenity, string> = {
  veilig: "Veilige parking",
  bewaakt: "Bewaakt",
  douche: "Douche",
  toilet: "Toilet",
  restaurant: "Restaurant",
  winkel: "Winkel",
  wifi: "Wifi",
  wasmachine: "Wasmachine",
  reparatie: "Reparatie",
  adblue: "AdBlue",
};

export type Occupancy = "rustig" | "gemiddeld" | "druk" | "vol";

export const occupancyMeta: Record<Occupancy, { label: string; color: string; pct: number }> = {
  rustig: { label: "Rustig", color: "bg-emerald-500", pct: 25 },
  gemiddeld: { label: "Gemiddeld", color: "bg-yellow-500", pct: 55 },
  druk: { label: "Druk", color: "bg-orange-500", pct: 82 },
  vol: { label: "Vol", color: "bg-destructive", pct: 100 },
};

export type Truckstop = {
  id: string;
  name: string;
  road: string;
  city: string;
  country: "NL" | "BE" | "DE";
  lat: number;
  lng: number;
  amenities: Amenity[];
  totalSpots: number;
  freeSpots: number;
  occupancy: Occupancy;
  occupancyUpdatedMinAgo: number;
  rating: number;
  reviewsCount: number;
  openHours: string;
  photos: string[];
  reviews: {
    id: string;
    userId: string;
    rating: number;
    text: string;
    photo?: string;
    createdAt: string;
  }[];
  reports: { id: string; text: string; minAgo: number }[];
};

const photo = (seed: string, w = 800, h = 500) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const truckstops: Truckstop[] = [
  {
    id: "ts1",
    name: "Truckparking Maasvlakte Plaza",
    road: "A15",
    city: "Rotterdam",
    country: "NL",
    lat: 51.95,
    lng: 4.05,
    amenities: ["veilig", "bewaakt", "douche", "toilet", "restaurant", "winkel", "wifi", "adblue"],
    totalSpots: 240,
    freeSpots: 42,
    occupancy: "gemiddeld",
    occupancyUpdatedMinAgo: 6,
    rating: 4.6,
    reviewsCount: 218,
    openHours: "24/7",
    photos: [photo("ts1a"), photo("ts1b"), photo("ts1c")],
    reviews: [
      { id: "rv1", userId: "u3", rating: 5, text: "Nieuwe douches, top eten en heel veilig.", createdAt: "2026-07-20T18:00:00Z" },
      { id: "rv2", userId: "u2", rating: 4, text: "Prima parking, restaurant is soms druk.", createdAt: "2026-07-18T21:30:00Z" },
    ],
    reports: [
      { id: "rp1", text: "Nog ongeveer 40 plekken vrij", minAgo: 6 },
      { id: "rp2", text: "Diesel €1,86 aan de shop", minAgo: 45 },
    ],
  },
  {
    id: "ts2",
    name: "TruckStop De Kempen",
    road: "A67",
    city: "Eersel",
    country: "NL",
    lat: 51.35,
    lng: 5.32,
    amenities: ["veilig", "douche", "toilet", "restaurant", "wifi", "adblue"],
    totalSpots: 110,
    freeSpots: 8,
    occupancy: "druk",
    occupancyUpdatedMinAgo: 12,
    rating: 4.2,
    reviewsCount: 96,
    openHours: "24/7",
    photos: [photo("ts2a"), photo("ts2b")],
    reviews: [
      { id: "rv1", userId: "u4", rating: 4, text: "Rustig achterin, eten in het restaurant is prima.", createdAt: "2026-07-15T20:00:00Z" },
    ],
    reports: [{ id: "rp1", text: "Bijna vol, nog 8 plekken", minAgo: 12 }],
  },
  {
    id: "ts3",
    name: "Havenparking Antwerpen Noord",
    road: "A12",
    city: "Antwerpen",
    country: "BE",
    lat: 51.31,
    lng: 4.31,
    amenities: ["veilig", "bewaakt", "douche", "toilet", "wifi", "wasmachine", "reparatie", "adblue"],
    totalSpots: 320,
    freeSpots: 0,
    occupancy: "vol",
    occupancyUpdatedMinAgo: 3,
    rating: 4.4,
    reviewsCount: 402,
    openHours: "24/7 (poort dicht 22:00–05:00)",
    photos: [photo("ts3a"), photo("ts3b"), photo("ts3c"), photo("ts3d")],
    reviews: [
      { id: "rv1", userId: "u3", rating: 5, text: "Perfect voor de haven. Bewaking is top.", createdAt: "2026-07-21T22:00:00Z" },
    ],
    reports: [{ id: "rp1", text: "Parking vol, wacht bij poort", minAgo: 3 }],
  },
  {
    id: "ts4",
    name: "AC Restaurant Meer",
    road: "E19",
    city: "Meer",
    country: "BE",
    lat: 51.45,
    lng: 4.75,
    amenities: ["douche", "toilet", "restaurant", "winkel", "wifi", "adblue"],
    totalSpots: 85,
    freeSpots: 34,
    occupancy: "rustig",
    occupancyUpdatedMinAgo: 22,
    rating: 3.9,
    reviewsCount: 154,
    openHours: "24/7",
    photos: [photo("ts4a"), photo("ts4b")],
    reviews: [
      { id: "rv1", userId: "u2", rating: 4, text: "Handig langs de E19, eten is oké.", createdAt: "2026-07-12T14:00:00Z" },
    ],
    reports: [{ id: "rp1", text: "Veel vrije plekken", minAgo: 22 }],
  },
  {
    id: "ts5",
    name: "Autohof Kamen",
    road: "A2",
    city: "Kamen",
    country: "DE",
    lat: 51.59,
    lng: 7.66,
    amenities: ["veilig", "bewaakt", "douche", "toilet", "restaurant", "winkel", "wifi", "wasmachine", "reparatie", "adblue"],
    totalSpots: 180,
    freeSpots: 61,
    occupancy: "gemiddeld",
    occupancyUpdatedMinAgo: 9,
    rating: 4.7,
    reviewsCount: 611,
    openHours: "24/7",
    photos: [photo("ts5a"), photo("ts5b"), photo("ts5c")],
    reviews: [
      { id: "rv1", userId: "u3", rating: 5, text: "Duitse Autohöfe blijven top. Alles aanwezig.", createdAt: "2026-07-19T19:00:00Z" },
      { id: "rv2", userId: "u1", rating: 5, text: "Beste douches in de regio.", createdAt: "2026-07-17T05:30:00Z" },
    ],
    reports: [{ id: "rp1", text: "Werkplaats vandaag beschikbaar", minAgo: 9 }],
  },
  {
    id: "ts6",
    name: "Rasthof Aachener Land",
    road: "A4",
    city: "Aachen",
    country: "DE",
    lat: 50.83,
    lng: 6.14,
    amenities: ["douche", "toilet", "restaurant", "wifi", "adblue"],
    totalSpots: 70,
    freeSpots: 22,
    occupancy: "gemiddeld",
    occupancyUpdatedMinAgo: 17,
    rating: 4.0,
    reviewsCount: 245,
    openHours: "24/7",
    photos: [photo("ts6a"), photo("ts6b")],
    reviews: [
      { id: "rv1", userId: "u4", rating: 4, text: "Prima stopplek richting grens.", createdAt: "2026-07-10T18:00:00Z" },
    ],
    reports: [{ id: "rp1", text: "Douche 2 kapot", minAgo: 55 }],
  },
  {
    id: "ts7",
    name: "Truckparking Vlissingen Poort",
    road: "A58",
    city: "Vlissingen",
    country: "NL",
    lat: 51.44,
    lng: 3.6,
    amenities: ["veilig", "bewaakt", "douche", "toilet", "wifi", "adblue"],
    totalSpots: 140,
    freeSpots: 55,
    occupancy: "rustig",
    occupancyUpdatedMinAgo: 4,
    rating: 4.5,
    reviewsCount: 88,
    openHours: "24/7",
    photos: [photo("ts7a"), photo("ts7b")],
    reviews: [
      { id: "rv1", userId: "u2", rating: 5, text: "Nieuw en heel netjes.", createdAt: "2026-07-22T07:30:00Z" },
    ],
    reports: [{ id: "rp1", text: "Ruim opgezet, veel plek", minAgo: 4 }],
  },
  {
    id: "ts8",
    name: "Autohof Rhynern Nord",
    road: "A2",
    city: "Hamm",
    country: "DE",
    lat: 51.63,
    lng: 7.86,
    amenities: ["veilig", "bewaakt", "douche", "toilet", "restaurant", "winkel", "wifi", "reparatie", "adblue"],
    totalSpots: 260,
    freeSpots: 12,
    occupancy: "druk",
    occupancyUpdatedMinAgo: 8,
    rating: 4.8,
    reviewsCount: 934,
    openHours: "24/7",
    photos: [photo("ts8a"), photo("ts8b"), photo("ts8c")],
    reviews: [
      { id: "rv1", userId: "u3", rating: 5, text: "Klassieker aan de A2. Reserveren aanrader.", createdAt: "2026-07-16T22:00:00Z" },
    ],
    reports: [{ id: "rp1", text: "Vult snel, ga vroeg", minAgo: 8 }],
  },
  {
    id: "ts9",
    name: "Parking Truckhaven Venlo",
    road: "A67",
    city: "Venlo",
    country: "NL",
    lat: 51.37,
    lng: 6.17,
    amenities: ["veilig", "douche", "toilet", "restaurant", "wifi", "wasmachine", "adblue"],
    totalSpots: 200,
    freeSpots: 74,
    occupancy: "gemiddeld",
    occupancyUpdatedMinAgo: 14,
    rating: 4.3,
    reviewsCount: 312,
    openHours: "24/7",
    photos: [photo("ts9a"), photo("ts9b")],
    reviews: [
      { id: "rv1", userId: "u1", rating: 4, text: "Prima parking, wasmachine is fijn.", createdAt: "2026-07-19T20:00:00Z" },
    ],
    reports: [{ id: "rp1", text: "Wasmachine 1 werkt weer", minAgo: 30 }],
  },
  {
    id: "ts10",
    name: "Truckstop Zeebrugge Port",
    road: "N31",
    city: "Zeebrugge",
    country: "BE",
    lat: 51.33,
    lng: 3.2,
    amenities: ["veilig", "bewaakt", "douche", "toilet", "wifi"],
    totalSpots: 150,
    freeSpots: 25,
    occupancy: "druk",
    occupancyUpdatedMinAgo: 11,
    rating: 4.1,
    reviewsCount: 178,
    openHours: "24/7",
    photos: [photo("ts10a"), photo("ts10b")],
    reviews: [
      { id: "rv1", userId: "u4", rating: 4, text: "Handig voor de ferry, hekwerk rondom.", createdAt: "2026-07-14T23:15:00Z" },
    ],
    reports: [{ id: "rp1", text: "Nog ~25 plekken", minAgo: 11 }],
  },
];

export function truckstopById(id: string): Truckstop | undefined {
  return truckstops.find((t) => t.id === id);
}

export type FuelStation = {
  id: string;
  name: string;
  brand: string;
  road: string;
  city: string;
  country: "NL" | "BE" | "DE";
  dieselPrice: number;
  adblue: boolean;
  truckSuitable: boolean;
  distanceFromRouteKm: number;
  detourMin: number;
  openHours: string;
  updatedMinAgo: number;
};

export const fuelStations: FuelStation[] = [
  { id: "f1", name: "Truckpoint Vinkeveen", brand: "Shell", road: "A2", city: "Vinkeveen", country: "NL", dieselPrice: 1.849, adblue: true, truckSuitable: true, distanceFromRouteKm: 0.2, detourMin: 1, openHours: "24/7", updatedMinAgo: 12 },
  { id: "f2", name: "Total Kruibeke", brand: "TotalEnergies", road: "E17", city: "Kruibeke", country: "BE", dieselPrice: 1.712, adblue: true, truckSuitable: true, distanceFromRouteKm: 0.5, detourMin: 2, openHours: "24/7", updatedMinAgo: 34 },
  { id: "f3", name: "Esso Roosendaal", brand: "Esso", road: "A17", city: "Roosendaal", country: "NL", dieselPrice: 1.869, adblue: true, truckSuitable: true, distanceFromRouteKm: 1.1, detourMin: 4, openHours: "06:00–22:00", updatedMinAgo: 3 },
  { id: "f4", name: "Aral Kamen", brand: "Aral", road: "A2", city: "Kamen", country: "DE", dieselPrice: 1.629, adblue: true, truckSuitable: true, distanceFromRouteKm: 0.3, detourMin: 1, openHours: "24/7", updatedMinAgo: 8 },
  { id: "f5", name: "BP Antwerpen West", brand: "BP", road: "R1", city: "Antwerpen", country: "BE", dieselPrice: 1.749, adblue: true, truckSuitable: true, distanceFromRouteKm: 2.4, detourMin: 6, openHours: "24/7", updatedMinAgo: 25 },
  { id: "f6", name: "OK Venlo", brand: "OK", road: "A67", city: "Venlo", country: "NL", dieselPrice: 1.799, adblue: true, truckSuitable: true, distanceFromRouteKm: 0.7, detourMin: 2, openHours: "24/7", updatedMinAgo: 19 },
  { id: "f7", name: "Shell Hamm-Rhynern", brand: "Shell", road: "A2", city: "Hamm", country: "DE", dieselPrice: 1.649, adblue: true, truckSuitable: true, distanceFromRouteKm: 0.4, detourMin: 1, openHours: "24/7", updatedMinAgo: 7 },
  { id: "f8", name: "Gulf Moerdijk", brand: "Gulf", road: "A16", city: "Moerdijk", country: "NL", dieselPrice: 1.879, adblue: false, truckSuitable: true, distanceFromRouteKm: 1.8, detourMin: 5, openHours: "05:00–23:00", updatedMinAgo: 45 },
];

export type AlertCategory =
  | "file"
  | "ongeval"
  | "werk"
  | "controle"
  | "vol"
  | "vrij"
  | "gladheid"
  | "gevaar"
  | "wegdicht";

export const alertMeta: Record<AlertCategory, { label: string; emoji: string; color: string; ttlMin: number }> = {
  file: { label: "File", emoji: "🚦", color: "bg-orange-500/20 text-orange-300 border-orange-500/40", ttlMin: 60 },
  ongeval: { label: "Ongeval", emoji: "🚑", color: "bg-red-500/20 text-red-300 border-red-500/40", ttlMin: 120 },
  werk: { label: "Wegwerk", emoji: "🚧", color: "bg-yellow-500/20 text-yellow-200 border-yellow-500/40", ttlMin: 720 },
  controle: { label: "Controle", emoji: "👮", color: "bg-blue-500/20 text-blue-300 border-blue-500/40", ttlMin: 90 },
  vol: { label: "Parking vol", emoji: "🅿️", color: "bg-red-500/20 text-red-300 border-red-500/40", ttlMin: 45 },
  vrij: { label: "Vrije plek", emoji: "✅", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", ttlMin: 30 },
  gladheid: { label: "Gladheid", emoji: "❄️", color: "bg-sky-500/20 text-sky-200 border-sky-500/40", ttlMin: 180 },
  gevaar: { label: "Gevaarlijk", emoji: "⚠️", color: "bg-destructive/20 text-destructive border-destructive/40", ttlMin: 240 },
  wegdicht: { label: "Weg afgesloten", emoji: "⛔", color: "bg-red-500/20 text-red-300 border-red-500/40", ttlMin: 240 },
};

export type TrafficAlert = {
  id: string;
  category: AlertCategory;
  userId: string;
  location: string;
  text: string;
  createdMinAgo: number;
  confirms: number;
  notActual: number;
};

export const initialAlerts: TrafficAlert[] = [
  { id: "a1", category: "file", userId: "u3", location: "A2 richting Utrecht, Hm 62", text: "Sta stil, ongeveer 6 km file na afrit Nieuwegein.", createdMinAgo: 8, confirms: 14, notActual: 0 },
  { id: "a2", category: "controle", userId: "u2", location: "A16 Moerdijkbrug", text: "Controle op rij- en rusttijden, beide richtingen.", createdMinAgo: 22, confirms: 9, notActual: 1 },
  { id: "a3", category: "vol", userId: "u4", location: "Havenparking Antwerpen Noord", text: "Parking is vol, staat file voor de poort.", createdMinAgo: 3, confirms: 6, notActual: 0 },
  { id: "a4", category: "vrij", userId: "u1", location: "Autohof Kamen (A2)", text: "Nog een 40-tal plekken vrij aan de achterzijde.", createdMinAgo: 12, confirms: 4, notActual: 0 },
  { id: "a5", category: "werk", userId: "u3", location: "A67 tussen Eindhoven en Venlo", text: "Wegwerkzaamheden, 1 rijstrook dicht, 70 km/u.", createdMinAgo: 240, confirms: 22, notActual: 2 },
  { id: "a6", category: "gladheid", userId: "u2", location: "A50 Arnhem-Nijmegen", text: "Plaatselijke gladheid, voorzichtig in bochten.", createdMinAgo: 45, confirms: 5, notActual: 3 },
  { id: "a7", category: "ongeval", userId: "u4", location: "E19 richting Antwerpen", text: "Aanrijding op vluchtstrook, hulpdiensten aanwezig.", createdMinAgo: 18, confirms: 11, notActual: 0 },
  { id: "a8", category: "gevaar", userId: "u1", location: "A15 Ridderkerk", text: "Verloren lading, houtafval op rechterrijstrook.", createdMinAgo: 6, confirms: 3, notActual: 0 },
];

// Extend alerts with a 'wegdicht' example (backwards-compatible push).
initialAlerts.push({
  id: "a9",
  category: "wegdicht",
  userId: "u3",
  location: "A16 Moerdijkbrug richting Rotterdam",
  text: "Weg volledig afgesloten wegens hulpdienstinzet, omleiding via A17.",
  createdMinAgo: 27,
  confirms: 8,
  notActual: 0,
});

export function trendingAlerts(limit = 3): TrafficAlert[] {
  return [...initialAlerts]
    .filter((a) => !isExpired(a))
    .sort((a, b) => b.confirms - a.confirms || a.createdMinAgo - b.createdMinAgo)
    .slice(0, limit);
}

export type AmenityCategory = "douche" | "restaurant" | "supermarkt" | "garage" | "truckwash" | "rustplek";

export const amenityCategoryMeta: Record<AmenityCategory, { label: string; emoji: string; description: string }> = {
  douche: { label: "Douches", emoji: "🚿", description: "Schone sanitair-stops langs de route" },
  restaurant: { label: "Restaurants", emoji: "🍽️", description: "Warme maaltijden voor onderweg" },
  supermarkt: { label: "Supermarkten", emoji: "🛒", description: "Boodschappen bij een truck-parking" },
  garage: { label: "Garages", emoji: "🔧", description: "Reparatie en pech onderweg" },
  truckwash: { label: "Truckwash", emoji: "🚿", description: "Wasstraat voor trekker en oplegger" },
  rustplek: { label: "Rustplekken", emoji: "😴", description: "Rustige plekken voor 45-min pauze" },
};

export type Reward = {
  id: string;
  title: string;
  desc: string;
  points: number;
  earned: boolean;
  emoji: string;
};

export const rewards: Reward[] = [
  { id: "b1", title: "Eerste rit", desc: "Registreer je eerste rit met TruckMate.", points: 50, earned: true, emoji: "🚚" },
  { id: "b2", title: "Betrouwbare melder", desc: "10 meldingen bevestigd door anderen.", points: 150, earned: true, emoji: "✅" },
  { id: "b3", title: "Zuinige rijder", desc: "3 ritten onder 28 l/100 km.", points: 100, earned: true, emoji: "🌱" },
  { id: "b4", title: "EU Traveler", desc: "Ritten in 3 verschillende landen.", points: 200, earned: true, emoji: "🌍" },
  { id: "b5", title: "100.000 km", desc: "Rijd 100.000 km met TruckMate.", points: 500, earned: true, emoji: "🏆" },
  { id: "b6", title: "Foto-fan", desc: "Deel 5 foto's van truckstops.", points: 80, earned: false, emoji: "📷" },
  { id: "b7", title: "Reviewer", desc: "Beoordeel 10 truckstops.", points: 120, earned: false, emoji: "⭐" },
  { id: "b8", title: "Nachtuil", desc: "5 ritten tussen 22:00 en 05:00.", points: 90, earned: false, emoji: "🌙" },
];

export type LeaderboardEntry = {
  userId: string;
  points: number;
  reports: number;
};

export const leaderboard: LeaderboardEntry[] = [
  { userId: "u3", points: 2450, reports: 87 },
  { userId: "u1", points: 1980, reports: 62 },
  { userId: "u2", points: 1240, reports: 34 },
  { userId: "u4", points: 720, reports: 18 },
];

export function minAgoLabel(min: number): string {
  if (min < 1) return "nu";
  if (min < 60) return `${Math.round(min)} min geleden`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h} u geleden` : `${h} u ${m} m geleden`;
}

export function isExpired(alert: TrafficAlert): boolean {
  return alert.createdMinAgo > alertMeta[alert.category].ttlMin;
}

export function countryLabel(c: "NL" | "BE" | "DE"): string {
  return c === "NL" ? "Nederland" : c === "BE" ? "België" : "Duitsland";
}

export function flag(c: "NL" | "BE" | "DE"): string {
  return c === "NL" ? "🇳🇱" : c === "BE" ? "🇧🇪" : "🇩🇪";
}

export type ParkingPredictionLevel = "waarschijnlijk" | "mogelijk" | "onzeker" | "vol";

export type ParkingPrediction = {
  level: ParkingPredictionLevel;
  label: string;
  color: string;
  explanation: string;
  asOf: string;
};

export function parkingPrediction(t: Truckstop): ParkingPrediction {
  const ratio = t.totalSpots > 0 ? t.freeSpots / t.totalSpots : 0;
  // Deterministic pseudo tijd-van-dag op basis van id-hash, zodat SSR en client identiek renderen.
  const seed = t.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rushHour = seed % 3 === 0;
  const asOf = minAgoLabel(t.occupancyUpdatedMinAgo);
  if (t.freeSpots === 0) {
    return {
      level: "vol",
      label: "Waarschijnlijk vol",
      color: "bg-red-500/20 text-red-300 border-red-500/40",
      explanation: "Nu 0 plekken vrij en piekuren op deze route — grote kans dat het vol blijft.",
      asOf,
    };
  }
  if (ratio < 0.12 || (rushHour && ratio < 0.22)) {
    return {
      level: "mogelijk",
      label: "Mogelijk vol",
      color: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      explanation: "Weinig marge en de laatste meldingen wijzen op oplopende drukte.",
      asOf,
    };
  }
  if (ratio > 0.35 && !rushHour) {
    return {
      level: "waarschijnlijk",
      label: "Waarschijnlijk plek",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      explanation: "Ruim aanbod nu en gemiddelde drukte voor dit tijdvenster.",
      asOf,
    };
  }
  return {
    level: "onzeker",
    label: "Onzeker",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    explanation: "Bezetting schommelt op dit tijdstip; check opnieuw dichter bij aankomst.",
    asOf,
  };
}