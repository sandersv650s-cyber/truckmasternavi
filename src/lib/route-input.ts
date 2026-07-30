export type RoutePoint = {
  label: string;
  lat: number;
  lng: number;
};

export type RouteInputIssue = {
  index: number;
  message: string;
};

export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/**
 * A handmatig aangepast label mag nooit de eerder gekozen HERE-coördinaten
 * behouden. Anders ziet de gebruiker een nieuw adres terwijl de oude locatie
 * wordt gerouteerd.
 */
export function changeRoutePointLabel<T extends RoutePoint>(point: T, label: string): T {
  if (label === point.label) return point;
  return { ...point, label, lat: 0, lng: 0 };
}

export function validateRoutePoints(points: RoutePoint[]): RouteInputIssue[] {
  if (points.length < 2) {
    return [{ index: -1, message: "Voeg minimaal een vertrekpunt en bestemming toe." }];
  }

  const issues: RouteInputIssue[] = [];
  points.forEach((point, index) => {
    const role = index === 0 ? "Vertrekpunt" : index === points.length - 1 ? "Bestemming" : `Tussenstop ${index}`;

    if (!point.label.trim()) {
      issues.push({ index, message: `${role} is leeg.` });
      return;
    }

    if (!isValidCoordinate(point.lat, point.lng)) {
      issues.push({
        index,
        message: `${role} is nog niet geselecteerd uit de adresresultaten.`,
      });
    }
  });

  return issues;
}
