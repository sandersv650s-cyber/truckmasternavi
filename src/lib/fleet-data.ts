export type FleetVehicle = {
  id: string;
  plate: string;
  model: string;
  driverId: string | null;
  status: "onderweg" | "geparkeerd" | "onderhoud" | "beschikbaar";
  location: string;
  destination?: string;
  etaMin?: number;
  fuelPct: number;
  km: number;
  nextService: string;
  serviceUrgent: boolean;
};

export type FleetDriver = {
  id: string;
  name: string;
  avatarSeed: string;
  vehicleId: string | null;
  restHoursLeft: number;
  ecoScore: number;
  status: "rijdt" | "pauze" | "off";
};

const av = (s: string) => `https://api.dicebear.com/7.x/adventurer/svg?backgroundColor=1e3a5f&seed=${s}`;

export const fleetDrivers: FleetDriver[] = [
  { id: "fd1", name: "Jan de Vries", avatarSeed: "jan", vehicleId: "fv1", restHoursLeft: 4.2, ecoScore: 87, status: "rijdt" },
  { id: "fd2", name: "Sanne Bakker", avatarSeed: "sanne", vehicleId: "fv2", restHoursLeft: 8.5, ecoScore: 92, status: "pauze" },
  { id: "fd3", name: "Mo El Amrani", avatarSeed: "mo", vehicleId: "fv3", restHoursLeft: 1.5, ecoScore: 78, status: "rijdt" },
  { id: "fd4", name: "Piet Jansen", avatarSeed: "piet", vehicleId: "fv4", restHoursLeft: 9.0, ecoScore: 71, status: "off" },
  { id: "fd5", name: "Lisa van Dijk", avatarSeed: "lisa", vehicleId: null, restHoursLeft: 9.0, ecoScore: 88, status: "off" },
  { id: "fd6", name: "Ahmed Yilmaz", avatarSeed: "ahmed", vehicleId: "fv5", restHoursLeft: 3.1, ecoScore: 84, status: "rijdt" },
];

export function driverAvatar(seed: string) {
  return av(seed);
}

export const fleetVehicles: FleetVehicle[] = [
  { id: "fv1", plate: "BV-123-N", model: "Volvo FH16 750", driverId: "fd1", status: "onderweg", location: "A67 Eindhoven", destination: "Duisburg", etaMin: 92, fuelPct: 62, km: 418900, nextService: "in 4200 km", serviceUrgent: false },
  { id: "fv2", plate: "45-BND-1", model: "Scania R500", driverId: "fd2", status: "geparkeerd", location: "Hasselt-Oost", fuelPct: 41, km: 302400, nextService: "in 800 km", serviceUrgent: true },
  { id: "fv3", plate: "TX-98-DD", model: "DAF XG+ 530", driverId: "fd3", status: "onderweg", location: "A2 Utrecht", destination: "Antwerpen", etaMin: 45, fuelPct: 78, km: 512300, nextService: "in 2100 km", serviceUrgent: false },
  { id: "fv4", plate: "17-JJP-4", model: "MAN TGS 35.480", driverId: "fd4", status: "onderhoud", location: "Werkplaats Utrecht", fuelPct: 22, km: 189200, nextService: "vandaag", serviceUrgent: true },
  { id: "fv5", plate: "GP-712-K", model: "Mercedes Actros", driverId: "fd6", status: "onderweg", location: "A15 Rotterdam", destination: "Kamen (DE)", etaMin: 210, fuelPct: 51, km: 267100, nextService: "in 1500 km", serviceUrgent: false },
  { id: "fv6", plate: "82-LZR-9", model: "Iveco S-Way", driverId: null, status: "beschikbaar", location: "Depot Rotterdam", fuelPct: 100, km: 41200, nextService: "in 12000 km", serviceUrgent: false },
];

export function driverById(id: string | null): FleetDriver | undefined {
  return id ? fleetDrivers.find((d) => d.id === id) : undefined;
}
export function vehicleById(id: string): FleetVehicle | undefined {
  return fleetVehicles.find((v) => v.id === id);
}

export const fleetKPIs = {
  vehicles: fleetVehicles.length,
  onRoad: fleetVehicles.filter((v) => v.status === "onderweg").length,
  inService: fleetVehicles.filter((v) => v.status === "onderhoud").length,
  available: fleetVehicles.filter((v) => v.status === "beschikbaar").length,
  avgFuel: Math.round(fleetVehicles.reduce((s, v) => s + v.fuelPct, 0) / fleetVehicles.length),
  avgEco: Math.round(fleetDrivers.reduce((s, d) => s + d.ecoScore, 0) / fleetDrivers.length),
  serviceAlerts: fleetVehicles.filter((v) => v.serviceUrgent).length,
  weeklyKm: 18420,
  weeklyLiters: 5320,
  costPerKm: 0.42,
};

export const fleetAlerts: { id: string; text: string; level: "info" | "warn" | "urgent"; minAgo: number }[] = [
  { id: "fa1", text: "Onderhoud MAN TGS 35.480 vandaag — vervangende auto Iveco S-Way beschikbaar.", level: "urgent", minAgo: 12 },
  { id: "fa2", text: "Scania R500 heeft nog 800 km tot volgende oliebeurt.", level: "warn", minAgo: 55 },
  { id: "fa3", text: "Mo El Amrani heeft nog 1u30 rijtijd — inplannen rustpauze.", level: "warn", minAgo: 8 },
  { id: "fa4", text: "Weekbrandstofverbruik 3,2% lager dan vorige week.", level: "info", minAgo: 220 },
];