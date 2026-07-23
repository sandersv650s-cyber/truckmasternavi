import { truckstops, amenityLabels, type Amenity, type Truckstop } from "@/lib/discover-data";
import { currentUser } from "@/lib/mock-data";

// ============ GROEPEN ============

export type GroupKind = "bedrijf" | "regio" | "route" | "interesse";

export type Group = {
  id: string;
  name: string;
  kind: GroupKind;
  description: string;
  members: number;
  memberIds: string[];
  joined: boolean;
  cover: string;
  posts: { id: string; userId: string; text: string; minAgo: number; likes: number }[];
};

const cover = (seed: string) => `https://picsum.photos/seed/grp-${seed}/800/300`;

export const groups: Group[] = [
  {
    id: "g1",
    name: "Van Dijk Transport BV",
    kind: "bedrijf",
    description: "Interne groep voor chauffeurs van Van Dijk Transport. Deel updates en planning.",
    members: 42,
    memberIds: ["u1", "u2", "u3", "u4"],
    joined: true,
    cover: cover("vandijk"),
    posts: [
      { id: "p1", userId: "u2", text: "Nieuwe DAF's staan vandaag klaar bij de werkplaats.", minAgo: 55, likes: 8 },
      { id: "p2", userId: "u3", text: "Reminder: rijdersvergadering vrijdag 09:00.", minAgo: 210, likes: 3 },
    ],
  },
  {
    id: "g2",
    name: "Chauffeurs Zuid-Nederland",
    kind: "regio",
    description: "Regionale groep voor chauffeurs uit Limburg, Brabant en Zeeland.",
    members: 318,
    memberIds: ["u1", "u3"],
    joined: true,
    cover: cover("zuid"),
    posts: [
      { id: "p1", userId: "u3", text: "A67 richting Duitsland loopt vol vanaf 15:30.", minAgo: 40, likes: 14 },
    ],
  },
  {
    id: "g3",
    name: "Route NL ↔ Ruhrgebied",
    kind: "route",
    description: "Alles over de corridor via A12/A2 richting Duisburg, Dortmund en Kamen.",
    members: 187,
    memberIds: ["u2", "u4"],
    joined: false,
    cover: cover("ruhr"),
    posts: [
      { id: "p1", userId: "u4", text: "Autohof Kamen heeft weer verse dieselprijzen laag.", minAgo: 25, likes: 22 },
    ],
  },
  {
    id: "g4",
    name: "Zeeship & Ferry Chauffeurs",
    kind: "route",
    description: "Wachttijden en tips voor Hoek van Holland, Zeebrugge en Vlissingen.",
    members: 96,
    memberIds: ["u2"],
    joined: false,
    cover: cover("ferry"),
    posts: [
      { id: "p1", userId: "u2", text: "Ferry Killingholme heeft vertraging van ~45 min.", minAgo: 90, likes: 6 },
    ],
  },
  {
    id: "g5",
    name: "ADR & Gevaarlijke Lading",
    kind: "interesse",
    description: "Ervaringen met ADR-vervoer, papieren, safety en trainingen.",
    members: 214,
    memberIds: ["u1", "u4"],
    joined: false,
    cover: cover("adr"),
    posts: [
      { id: "p1", userId: "u1", text: "Nieuwe ADR-cursus start volgende maand bij TLN.", minAgo: 700, likes: 11 },
    ],
  },
  {
    id: "g6",
    name: "Vrouwelijke Truckers NL",
    kind: "interesse",
    description: "Community voor vrouwelijke chauffeurs — meet-ups, tips en support.",
    members: 342,
    memberIds: ["u3"],
    joined: true,
    cover: cover("vrouwen"),
    posts: [
      { id: "p1", userId: "u3", text: "Meet-up in Tilburg op 12 augustus, wie is erbij?", minAgo: 480, likes: 27 },
    ],
  },
];

export const groupKindMeta: Record<GroupKind, { label: string; emoji: string; color: string }> = {
  bedrijf: { label: "Bedrijf", emoji: "🏢", color: "bg-primary/20 text-primary" },
  regio: { label: "Regio", emoji: "📍", color: "bg-sky-500/20 text-sky-300" },
  route: { label: "Route", emoji: "🛣️", color: "bg-amber-500/20 text-amber-300" },
  interesse: { label: "Interesse", emoji: "💬", color: "bg-emerald-500/20 text-emerald-300" },
};

export function groupById(id: string): Group | undefined {
  return groups.find((g) => g.id === id);
}

// ============ KONVOOI ============

export type KonvooiMember = {
  userId: string;
  eta: string;
  distanceKm: number;
  status: "onderweg" | "gepauzeerd" | "aangekomen";
};

export const sampleKonvooiMembers: KonvooiMember[] = [
  { userId: "u2", eta: "14:20", distanceKm: 42, status: "onderweg" },
  { userId: "u3", eta: "14:35", distanceKm: 58, status: "onderweg" },
  { userId: "u4", eta: "13:50", distanceKm: 18, status: "gepauzeerd" },
];

// ============ ONDERHOUD ============

export type MaintenanceType = "apk" | "banden" | "olie" | "adblue" | "reparatie" | "wasbeurt" | "controle";

export type MaintenanceItem = {
  id: string;
  type: MaintenanceType;
  title: string;
  date: string;
  km: number;
  cost: number;
  garage?: string;
  note?: string;
  nextDueDate?: string;
  nextDueKm?: number;
  hasDocument: boolean;
};

export const maintenanceMeta: Record<MaintenanceType, { label: string; emoji: string; color: string }> = {
  apk: { label: "APK", emoji: "📋", color: "bg-primary/20 text-primary" },
  banden: { label: "Banden", emoji: "🛞", color: "bg-slate-500/20 text-slate-200" },
  olie: { label: "Oliebeurt", emoji: "🛢️", color: "bg-amber-500/20 text-amber-300" },
  adblue: { label: "AdBlue", emoji: "💧", color: "bg-sky-500/20 text-sky-300" },
  reparatie: { label: "Reparatie", emoji: "🔧", color: "bg-orange-500/20 text-orange-300" },
  wasbeurt: { label: "Wasbeurt", emoji: "🚿", color: "bg-emerald-500/20 text-emerald-300" },
  controle: { label: "Controle", emoji: "🔍", color: "bg-purple-500/20 text-purple-300" },
};

export const initialMaintenance: MaintenanceItem[] = [
  { id: "m1", type: "apk", title: "APK-keuring DAF XG+", date: "2026-05-12", km: 412300, cost: 285, garage: "DAF Dealer Utrecht", nextDueDate: "2027-05-12", hasDocument: true },
  { id: "m2", type: "olie", title: "Oliebeurt + filterwissel", date: "2026-06-04", km: 415800, cost: 480, garage: "TruckService Venlo", nextDueKm: 465800, hasDocument: true, note: "Volledig synthetisch 10W-40" },
  { id: "m3", type: "banden", title: "Trailerbanden vervangen (4x)", date: "2026-04-18", km: 410100, cost: 1620, garage: "Bandencentrale Moerdijk", nextDueKm: 510100, hasDocument: true },
  { id: "m4", type: "reparatie", title: "AdBlue-pomp vervangen", date: "2026-03-02", km: 405600, cost: 940, garage: "DAF Dealer Utrecht", hasDocument: false, note: "Onder garantie deels vergoed" },
  { id: "m5", type: "wasbeurt", title: "Complete truckwash", date: "2026-07-10", km: 418900, cost: 65, garage: "TruckWash Kamen (DE)", hasDocument: false },
  { id: "m6", type: "controle", title: "Tachograaf-verificatie", date: "2025-11-14", km: 398200, cost: 145, garage: "VDL Werkplaats Eindhoven", nextDueDate: "2027-11-14", hasDocument: true },
];

// ============ DOCUMENTEN ============

export type DocumentCategory = "cmr" | "vrachtbrief" | "adr" | "voertuig" | "bonnetjes" | "rijbewijs";

export type StoredDocument = {
  id: string;
  category: DocumentCategory;
  name: string;
  addedAt: string;
  expiresAt?: string;
  sizeKb: number;
  fileType: "pdf" | "jpg" | "png";
};

export const documentCategoryMeta: Record<DocumentCategory, { label: string; emoji: string; hint: string }> = {
  cmr: { label: "CMR", emoji: "📄", hint: "Internationale vrachtbrieven" },
  vrachtbrief: { label: "Vrachtbrief", emoji: "📝", hint: "Nationale vervoerdocumenten" },
  adr: { label: "ADR", emoji: "☢️", hint: "Gevaarlijke stoffen documenten" },
  voertuig: { label: "Voertuig", emoji: "🚛", hint: "Kentekenbewijs, verzekering, keuring" },
  bonnetjes: { label: "Bonnetjes", emoji: "🧾", hint: "Brandstof, tol, parkeren" },
  rijbewijs: { label: "Rijbewijs & Code 95", emoji: "🪪", hint: "Persoonlijke bevoegdheden" },
};

export const initialDocuments: StoredDocument[] = [
  { id: "d1", category: "cmr", name: "CMR_20260722_Rotterdam-Kamen.pdf", addedAt: "2026-07-22", sizeKb: 184, fileType: "pdf" },
  { id: "d2", category: "cmr", name: "CMR_20260718_Antwerpen-Venlo.pdf", addedAt: "2026-07-18", sizeKb: 172, fileType: "pdf" },
  { id: "d3", category: "voertuig", name: "Kentekenbewijs_DAF_XG+.pdf", addedAt: "2025-11-02", sizeKb: 92, fileType: "pdf" },
  { id: "d4", category: "voertuig", name: "Verzekeringspolis_2026.pdf", addedAt: "2026-01-05", expiresAt: "2027-01-05", sizeKb: 240, fileType: "pdf" },
  { id: "d5", category: "adr", name: "ADR_Certificaat_JV.pdf", addedAt: "2024-04-19", expiresAt: "2029-04-19", sizeKb: 128, fileType: "pdf" },
  { id: "d6", category: "rijbewijs", name: "Code95_JV_2026.pdf", addedAt: "2026-02-12", expiresAt: "2031-02-12", sizeKb: 88, fileType: "pdf" },
  { id: "d7", category: "bonnetjes", name: "Diesel_Aral_Kamen_20260720.jpg", addedAt: "2026-07-20", sizeKb: 512, fileType: "jpg" },
  { id: "d8", category: "bonnetjes", name: "Tol_A4_BE_20260719.jpg", addedAt: "2026-07-19", sizeKb: 486, fileType: "jpg" },
  { id: "d9", category: "vrachtbrief", name: "Vrachtbrief_NL_20260721.pdf", addedAt: "2026-07-21", sizeKb: 108, fileType: "pdf" },
];

// ============ INTEGRATIES ============

export type IntegrationStatus = "binnenkort" | "demo" | "niet_gekoppeld";

export type Integration = {
  id: string;
  name: string;
  vendors: string[];
  status: IntegrationStatus;
  description: string;
  dataPoints: string[];
  emoji: string;
};

export const integrationStatusMeta: Record<IntegrationStatus, { label: string; color: string }> = {
  binnenkort: { label: "Binnenkort", color: "bg-primary/20 text-primary border-primary/40" },
  demo: { label: "Demo", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  niet_gekoppeld: { label: "Niet gekoppeld", color: "bg-muted text-muted-foreground border-border" },
};

export const integrations: Integration[] = [
  {
    id: "int-tacho",
    name: "Tachograaf",
    vendors: ["VDO Continental", "Stoneridge", "Intellic"],
    status: "binnenkort",
    description: "Lees rij- en rusttijden, activiteitsstatus en remote download van bestuurderskaart.",
    dataPoints: ["Rij-/rusttijden", "Activiteitenlog", "Bestuurderskaart download"],
    emoji: "⏱️",
  },
  {
    id: "int-fleet",
    name: "Fleetmanagement",
    vendors: ["Webfleet", "Fleetboard", "Scania FMS", "MAN Now"],
    status: "binnenkort",
    description: "Synchroniseer opdrachten, planning en berichten van je fleetmanager.",
    dataPoints: ["Opdrachten", "Planning", "Live meldingen naar dispatch"],
    emoji: "📡",
  },
  {
    id: "int-obd",
    name: "OBD / J1939 / FMS",
    vendors: ["FMS Standard", "J1939 gateway", "Bluetooth OBD"],
    status: "binnenkort",
    description: "Live voertuigdata: verbruik, motorbelasting, remsystemen en foutcodes.",
    dataPoints: ["Brandstofverbruik", "Foutcodes (DTC)", "Motor- en asdruk"],
    emoji: "🔌",
  },
  {
    id: "int-tms",
    name: "Transport Management",
    vendors: ["Transics", "PTV", "Descartes"],
    status: "niet_gekoppeld",
    description: "Koppel orders en zendingen uit je TMS voor automatische ritregistratie.",
    dataPoints: ["Orders", "Stops", "Statusupdates"],
    emoji: "📦",
  },
  {
    id: "int-tolbox",
    name: "Tolbox",
    vendors: ["MyToll", "Toll4Europe", "Telepass"],
    status: "demo",
    description: "Ontvang tolkosten per rit voor onkostennota's (demo — geen echte OBU-koppeling).",
    dataPoints: ["Tolkosten per rit", "Landregistratie"],
    emoji: "🛣️",
  },
];

// ============ PRIVACY ============

export type PrivacyKey =
  | "location"
  | "konvooi"
  | "vehicleData"
  | "communityVisibility"
  | "documents"
  | "analytics";

export type PrivacyOption = {
  key: PrivacyKey;
  label: string;
  description: string;
  defaultOn: boolean;
  category: "Locatie" | "Voertuig" | "Community" | "Data";
};

export const privacyOptions: PrivacyOption[] = [
  { key: "location", label: "Locatie delen", description: "Sta toe dat TruckMate je locatie gebruikt voor navigatie en parkeerzoeken. Alleen tijdens gebruik.", defaultOn: false, category: "Locatie" },
  { key: "konvooi", label: "Konvooimodus", description: "Sta live locatie delen in een konvooi-groep tijdelijk toe. Standaard uit.", defaultOn: false, category: "Locatie" },
  { key: "vehicleData", label: "Voertuigdata (toekomstig)", description: "OBD/J1939-data delen zodra een koppeling actief is. Nu nog niet in gebruik.", defaultOn: false, category: "Voertuig" },
  { key: "communityVisibility", label: "Profiel zichtbaar in community", description: "Andere chauffeurs kunnen je posts en beoordelingen zien.", defaultOn: true, category: "Community" },
  { key: "documents", label: "Documenten backup", description: "Sla documentenkluis versleuteld op in de cloud (demo — momenteel alleen lokaal).", defaultOn: false, category: "Data" },
  { key: "analytics", label: "Gebruiksanalyse", description: "Anonieme statistieken helpen om TruckMate te verbeteren.", defaultOn: false, category: "Data" },
];

// ============ AI ROUTE-ASSISTENT ============

const amenityKeywords: Record<string, Amenity> = {
  douche: "douche",
  douches: "douche",
  toilet: "toilet",
  toiletten: "toilet",
  restaurant: "restaurant",
  eten: "restaurant",
  warm: "restaurant",
  wifi: "wifi",
  internet: "wifi",
  veilig: "veilig",
  veiligheid: "veilig",
  bewaakt: "bewaakt",
  bewaking: "bewaakt",
  hek: "bewaakt",
  winkel: "winkel",
  supermarkt: "winkel",
  shop: "winkel",
  adblue: "adblue",
  wasmachine: "wasmachine",
  was: "wasmachine",
  reparatie: "reparatie",
  werkplaats: "reparatie",
};

export type ParsedAssistantQuery = {
  maxMinutes: number;
  required: Amenity[];
  wantsSafe: boolean;
};

export function parseAssistantQuery(q: string): ParsedAssistantQuery {
  const lower = q.toLowerCase();
  let maxMinutes = 120;
  const timeMatch = lower.match(/(\d{1,3})\s*(u|uur|uren|minuten|min|m)\b/);
  if (timeMatch) {
    const n = parseInt(timeMatch[1], 10);
    const unit = timeMatch[2];
    maxMinutes = unit.startsWith("u") ? n * 60 : n;
  }
  const required: Amenity[] = [];
  for (const [k, v] of Object.entries(amenityKeywords)) {
    if (lower.includes(k) && !required.includes(v)) required.push(v);
  }
  const wantsSafe = lower.includes("veilig") || lower.includes("bewaakt") || lower.includes("nacht");
  return { maxMinutes, required, wantsSafe };
}

export type AssistantResult = {
  stop: Truckstop;
  etaMin: number;
  matches: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
};

export function assistantResults(query: string): AssistantResult[] {
  const parsed = parseAssistantQuery(query || "");
  return truckstops
    .map((t, i) => {
      // Mock ETA op basis van id-index (deterministisch)
      const etaMin = 12 + i * 9;
      const missing = parsed.required.filter((a) => !t.amenities.includes(a));
      const hasAll = missing.length === 0;
      const reasons: string[] = [];
      const warnings: string[] = [];
      if (parsed.required.length && hasAll) {
        reasons.push(`Heeft ${parsed.required.map((a) => amenityLabels[a]).join(", ")}`);
      }
      if (t.freeSpots > 20) reasons.push(`${t.freeSpots} plekken vrij nu`);
      else if (t.freeSpots > 0) reasons.push(`Nog ${t.freeSpots} plekken (beperkt)`);
      if (t.amenities.includes("veilig") || t.amenities.includes("bewaakt")) reasons.push("Veilige/bewaakte parking");
      if (t.rating >= 4.5) reasons.push(`Top beoordeeld ${t.rating.toFixed(1)}★ (${t.reviewsCount} reviews)`);
      if (etaMin <= parsed.maxMinutes) reasons.push(`Binnen ${etaMin} min bereikbaar`);
      if (!hasAll) warnings.push(`Mist ${missing.map((a) => amenityLabels[a]).join(", ")}`);
      if (etaMin > parsed.maxMinutes) warnings.push(`Buiten je tijdvenster (${etaMin} min)`);
      if (parsed.wantsSafe && !t.amenities.includes("veilig") && !t.amenities.includes("bewaakt")) warnings.push("Niet als veilige parking gemarkeerd");
      const score =
        (hasAll ? 40 : 0) +
        (parsed.wantsSafe && (t.amenities.includes("veilig") || t.amenities.includes("bewaakt")) ? 15 : 0) +
        t.rating * 5 +
        Math.min(25, t.freeSpots / 4) -
        Math.max(0, etaMin - parsed.maxMinutes) * 0.5;
      return { stop: t, etaMin, matches: hasAll && etaMin <= parsed.maxMinutes, score, reasons, warnings };
    })
    .sort((a, b) => (Number(b.matches) - Number(a.matches)) || b.score - a.score)
    .slice(0, 4);
}

export const exampleAssistantPrompts = [
  "Vind een veilige parkeerplaats binnen 45 minuten met douche en restaurant.",
  "Bewaakte parking voor de nacht, met wasmachine en wifi.",
  "Snelle stop binnen 20 minuten om te tanken en te eten.",
  "Parking met werkplaats voor kleine reparatie, binnen 1 uur.",
];

export { currentUser };