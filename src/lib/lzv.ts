/**
 * LZV (Lange Zware Voertuigcombinatie) — Nederlandse regels.
 *
 * Belangrijk: TruckMate kan een route NOOIT juridisch goedkeuren. Volgens de
 * RDW mogen LZV's uitsluitend rijden over de groene wegen van de Digitale
 * Wegenkaart Ontheffingen (DWO) plus goedgekeurde aansluitroutes. Zolang er
 * geen officiële DWO-dataset is gekoppeld, tonen we uitsluitend de status
 * "Niet geverifieerd met RDW/DWO".
 */

export const LZV_MAX_LENGTH_CM = 2525; // 25,25 m
export const LZV_MAX_WEIGHT_KG = 60_000;
export const TRUCK_MAX_LENGTH_CM = 1875; // 18,75 m reguliere combinatie
export const TRUCK_MAX_WEIGHT_KG = 50_000; // NL max met ontheffingsvrije combinaties

/** Veilige startwaarden voor een Nederlandse LZV — gebruiker mag alles aanpassen. */
export const LZV_DEFAULTS = {
  length_cm: LZV_MAX_LENGTH_CM,
  weight_kg: LZV_MAX_WEIGHT_KG,
  height_cm: 400,
  width_cm: 255,
  axle_count: 7,
  trailer_count: 2,
} as const;

export type VehicleClass = "truck" | "lzv" | "exceptional";

export const vehicleClassLabels: Record<VehicleClass, string> = {
  truck: "Reguliere vrachtwagen",
  lzv: "LZV (25,25 m / 60 t)",
  exceptional: "Exceptioneel transport (ontheffing)",
};

export const vehicleClassHints: Record<VehicleClass, string> = {
  truck: "Standaard combinatie tot 18,75 m en 50 t. Geen LZV-ontheffing nodig.",
  lzv:
    "Maximaal 25,25 m en 60.000 kg. Alleen toegestaan met geldige LZV-ontheffing én uitsluitend over het door de RDW aangewezen LZV-netwerk (DWO).",
  exceptional:
    "Afmetingen of gewicht buiten de LZV-grenzen. Alleen met een individuele RDW-ontheffing en een door de wegbeheerder goedgekeurde route.",
};

export type LzvVehicleInput = {
  vehicleClass: VehicleClass;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null; // toegestane maximummassa
  current_weight_kg?: number | null; // actueel/beladen gewicht
  axle_weight_kg?: number | null;
  axle_count?: number | null;
  trailer_count?: number | null;
  has_exemption?: boolean | null;
  exemption_ref?: string | null;
  exemption_expires?: string | null;
};

export type Issue = { level: "error" | "warning"; field: string; message: string };

const positive = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) && v > 0;

/** Volledige validatie van het voertuigprofiel. Lege of nul-waarden zijn nooit "geldig". */
export function validateVehicle(v: LzvVehicleInput): Issue[] {
  const issues: Issue[] = [];
  const isLzv = v.vehicleClass === "lzv";
  const isExc = v.vehicleClass === "exceptional";

  if (!positive(v.weight_kg))
    issues.push({
      level: "error",
      field: "weight_kg",
      message: "Toegestane maximummassa (kg) is verplicht en moet groter dan 0 zijn.",
    });
  else if (v.weight_kg! > 120_000)
    issues.push({ level: "error", field: "weight_kg", message: "Gewicht boven 120.000 kg is onrealistisch." });

  if (v.current_weight_kg != null && v.current_weight_kg !== 0) {
    if (!positive(v.current_weight_kg))
      issues.push({ level: "error", field: "current_weight_kg", message: "Actueel gewicht moet groter dan 0 zijn." });
    else if (positive(v.weight_kg) && v.current_weight_kg! > v.weight_kg!)
      issues.push({
        level: "error",
        field: "current_weight_kg",
        message: "Actueel gewicht is hoger dan de toegestane maximummassa.",
      });
  }

  if (!positive(v.length_cm))
    issues.push({ level: "error", field: "length_cm", message: "Lengte (cm) is verplicht." });
  if (!positive(v.height_cm))
    issues.push({ level: "error", field: "height_cm", message: "Hoogte (cm) is verplicht." });
  if (!positive(v.width_cm))
    issues.push({ level: "error", field: "width_cm", message: "Breedte (cm) is verplicht." });
  if (!positive(v.axle_weight_kg))
    issues.push({
      level: "warning",
      field: "axle_weight_kg",
      message: "Aslast (kg) ontbreekt — HERE kan asgewichtbeperkingen dan niet toepassen.",
    });
  if (!positive(v.axle_count))
    issues.push({ level: "warning", field: "axle_count", message: "Aantal assen ontbreekt." });

  if (isLzv) {
    if (positive(v.length_cm) && v.length_cm! > LZV_MAX_LENGTH_CM) {
      issues.push(
        v.has_exemption
          ? {
              level: "warning",
              field: "length_cm",
              message:
                "Lengte boven 25,25 m. Alleen toegestaan met incidentele ontheffing — route moet door RDW/DWO gecontroleerd worden.",
            }
          : {
              level: "error",
              field: "length_cm",
              message:
                "Lengte boven 25,25 m is niet toegestaan voor een regulier LZV-profiel. Vink 'Ik heb een incidentele ontheffing' aan als dit klopt.",
            },
      );
    }
    if (positive(v.weight_kg) && v.weight_kg! > LZV_MAX_WEIGHT_KG) {
      issues.push(
        v.has_exemption
          ? {
              level: "warning",
              field: "weight_kg",
              message:
                "Gewicht boven 60.000 kg. Alleen toegestaan met incidentele ontheffing — route moet door RDW/DWO gecontroleerd worden.",
            }
          : {
              level: "error",
              field: "weight_kg",
              message:
                "Gewicht boven 60.000 kg is niet toegestaan voor een regulier LZV-profiel. Vink 'Ik heb een incidentele ontheffing' aan als dit klopt.",
            },
      );
    }
    if (!v.has_exemption)
      issues.push({
        level: "warning",
        field: "exemption",
        message:
          "Voor rijden met een LZV is een geldige RDW-ontheffing verplicht. Leg het ontheffingsnummer vast.",
      });
    if (v.has_exemption && !v.exemption_ref?.trim())
      issues.push({ level: "warning", field: "exemption_ref", message: "Ontheffingsnummer ontbreekt." });
    if (v.exemption_expires) {
      const d = new Date(v.exemption_expires);
      if (!Number.isNaN(d.getTime()) && d.getTime() < Date.now())
        issues.push({ level: "error", field: "exemption_expires", message: "De ontheffing is verlopen." });
    }
  }

  if (isExc && !v.has_exemption)
    issues.push({
      level: "error",
      field: "exemption",
      message: "Exceptioneel transport vereist een individuele RDW-ontheffing.",
    });

  if (!isLzv && !isExc) {
    if (positive(v.length_cm) && v.length_cm! > TRUCK_MAX_LENGTH_CM)
      issues.push({
        level: "warning",
        field: "length_cm",
        message: "Langer dan 18,75 m — kies het LZV-profiel als dit een LZV-combinatie is.",
      });
  }
  return issues;
}

export const hasErrors = (issues: Issue[]) => issues.some((i) => i.level === "error");

/** Status van de officiële LZV-netwerkdataset (DWO). */
export type LzvNetworkStatus = {
  /** aantal segmenten in de beheerbare datalaag */
  count: number;
  /** true zodra er officiële (RDW/DWO) segmenten geïmporteerd zijn */
  official: boolean;
  version: string | null;
};

export function lzvStatusLabel(net: LzvNetworkStatus | undefined): {
  label: string;
  tone: "warning" | "neutral";
  detail: string;
} {
  if (net?.official)
    return {
      label: "LZV-controle vereist",
      tone: "warning",
      detail: `LZV-netwerkdataset geladen (${net.version ?? "versie onbekend"}, ${net.count} segmenten). Controleer de route en aansluitroute altijd zelf op de actuele DWO-kaart van de RDW.`,
    };
  return {
    label: "Niet geverifieerd met RDW/DWO",
    tone: "warning",
    detail:
      "Er is nog geen officiële DWO-dataset gekoppeld. TruckMate kan niet vaststellen of deze route over het toegestane LZV-netwerk loopt. Gebruik uitsluitend de groene wegen van de Digitale Wegenkaart Ontheffingen en goedgekeurde aansluitroutes.",
  };
}
