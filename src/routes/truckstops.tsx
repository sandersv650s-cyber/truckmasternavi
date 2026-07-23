import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { List, Map as MapIcon, Star, Search, Filter, Heart } from "lucide-react";
import {
  truckstops,
  amenityLabels,
  occupancyMeta,
  flag,
  minAgoLabel,
  type Amenity,
  type Truckstop,
} from "@/lib/discover-data";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/truckstops")({
  head: () => ({
    meta: [
      { title: "Truckstops — TruckMate" },
      {
        name: "description",
        content:
          "Bekijk truckstops in NL, BE en DE met live bezetting, voorzieningen en beoordelingen.",
      },
      { property: "og:title", content: "Truckstops — TruckMate" },
      { property: "og:description", content: "Vind een veilige parking in de buurt." },
    ],
  }),
  component: TruckstopsPage,
});

const amenityKeys: Amenity[] = [
  "veilig",
  "bewaakt",
  "douche",
  "toilet",
  "restaurant",
  "winkel",
  "wifi",
  "wasmachine",
  "reparatie",
  "adblue",
];

function TruckstopsPage() {
  const [view, setView] = useState<"kaart" | "lijst">("lijst");
  const [q, setQ] = useState("");
  const [minFree, setMinFree] = useState(0);
  const [active, setActive] = useState<Amenity[]>([]);
  const [onlyFav, setOnlyFav] = useState(false);
  const { isFav, toggle: toggleFav, count: favCount } = useFavorites("truckstops");

  const toggle = (a: Amenity) =>
    setActive((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return truckstops.filter((t) => {
      if (t.freeSpots < minFree) return false;
      if (!active.every((a) => t.amenities.includes(a))) return false;
      if (term && !`${t.name} ${t.city} ${t.road}`.toLowerCase().includes(term)) return false;
      if (onlyFav && !isFav(t.id)) return false;
      return true;
    });
  }, [q, minFree, active, onlyFav, isFav]);

  return (
    <AppShell title="Truckstops">
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op naam, plaats of weg"
            className="pl-9"
          />
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setView(view === "kaart" ? "lijst" : "kaart")}
          aria-label={view === "kaart" ? "Toon lijst" : "Toon kaart"}
        >
          {view === "kaart" ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filters
          </div>
          <div className="flex flex-wrap gap-1.5">
            {amenityKeys.map((a) => {
              const on = active.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => toggle(a)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    on
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border bg-background/40 text-muted-foreground hover:border-primary/60"
                  }`}
                >
                  {amenityLabels[a]}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Min. vrije plekken</span>
            <div className="flex gap-1">
              {[0, 10, 25, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setMinFree(n)}
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                    minFree === n
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {n === 0 ? "Alle" : `≥ ${n}`}
                </button>
              ))}
            </div>
            <button
              onClick={() => setOnlyFav((v) => !v)}
              className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                onlyFav ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              <Heart className={`h-3 w-3 ${onlyFav ? "fill-primary" : ""}`} /> Favorieten{favCount ? ` (${favCount})` : ""}
            </button>
          </div>
        </CardContent>
      </Card>

      {view === "kaart" && <MapView stops={filtered} />}

      <p className="mb-2 text-xs text-muted-foreground">
        {filtered.length} resultaten
        <Badge variant="secondary" className="ml-2 text-[10px]">Demo</Badge>
      </p>
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Geen truckstops gevonden met deze filters.
          </div>
        ) : (
          filtered.map((t) => <StopRow key={t.id} t={t} fav={isFav(t.id)} onFav={() => toggleFav(t.id)} />)
        )}
      </div>
    </AppShell>
  );
}

function MapView({ stops }: { stops: Truckstop[] }) {
  const minLat = 50.6, maxLat = 52.2, minLng = 3.0, maxLng = 8.2;
  const proj = (lat: number, lng: number) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * 400,
    y: 220 - ((lat - minLat) / (maxLat - minLat)) * 220,
  });
  return (
    <Card className="mb-4 overflow-hidden">
      <div className="relative h-56 bg-[radial-gradient(circle_at_30%_30%,oklch(0.35_0.06_255)_0%,oklch(0.19_0.03_250)_60%)]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 220" preserveAspectRatio="none">
          <defs>
            <pattern id="tsgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="oklch(0.32 0.03 252)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="400" height="220" fill="url(#tsgrid)" />
          {stops.map((t) => {
            const { x, y } = proj(t.lat, t.lng);
            const c =
              t.occupancy === "vol"
                ? "oklch(0.62 0.22 27)"
                : t.occupancy === "druk"
                  ? "oklch(0.72 0.17 55)"
                  : t.occupancy === "gemiddeld"
                    ? "oklch(0.82 0.15 90)"
                    : "oklch(0.7 0.16 155)";
            return <circle key={t.id} cx={x} cy={y} r="6" fill={c} stroke="oklch(0.15 0.02 250)" strokeWidth="1.5" />;
          })}
        </svg>
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="text-[10px]">Mock kaart · demo</Badge>
        </div>
      </div>
    </Card>
  );
}

function StopRow({ t, fav, onFav }: { t: Truckstop; fav: boolean; onFav: () => void }) {
  const occ = occupancyMeta[t.occupancy];
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFav(); }}
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/70 backdrop-blur"
        aria-label={fav ? "Verwijder uit favorieten" : "Toevoegen aan favorieten"}
      >
        <Heart className={`h-4 w-4 ${fav ? "fill-primary text-primary" : "text-muted-foreground"}`} />
      </button>
      <Link to="/truckstops/$id" params={{ id: t.id }}>
        <Card className="transition hover:border-primary/60">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate pr-10 text-sm font-semibold">
                <span className="mr-1">{flag(t.country)}</span>
                {t.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t.road} · {t.city}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-md bg-background/60 px-1.5 py-0.5 text-xs">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{t.rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-white ${occ.color}`}>
              {occ.label}
            </span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{t.freeSpots}</span> / {t.totalSpots} vrij
            </span>
            <span className="ml-auto text-muted-foreground">{minAgoLabel(t.occupancyUpdatedMinAgo)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {t.amenities.slice(0, 5).map((a) => (
              <Badge key={a} variant="outline" className="text-[10px] font-normal">
                {amenityLabels[a]}
              </Badge>
            ))}
            {t.amenities.length > 5 && (
              <Badge variant="outline" className="text-[10px]">
                +{t.amenities.length - 5}
              </Badge>
            )}
          </div>
        </CardContent>
        </Card>
      </Link>
    </div>
  );
}