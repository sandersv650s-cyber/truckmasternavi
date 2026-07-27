import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
import { Fuel, Star, Truck, Droplets, Heart, RefreshCw, Navigation, MapPin } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import {
  distanceKm,
  fuelTypes,
  fuelUnit,
  getFuelProvider,
  type FuelType,
  type StationWithPrice,
} from "@/lib/fuel";

export const Route = createFileRoute("/brandstof")({
  head: () => ({
    meta: [
      { title: "Dieselprijzen — TruckMate" },
      { name: "description", content: "Vind truck-geschikte tankstations met AdBlue en actuele dieselprijzen." },
      { property: "og:title", content: "Dieselprijzen — TruckMate" },
      { property: "og:description", content: "Overzicht van tankstations onderweg." },
    ],
  }),
  component: BrandstofPage,
});

type SortKey = "goedkoop" | "naam" | "recent";

function BrandstofPage() {
  const provider = getFuelProvider();
  const [sort, setSort] = useState<SortKey>("goedkoop");
  const [truckOnly, setTruckOnly] = useState(true);
  const [adblue, setAdblue] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const [city, setCity] = useState("");
  const [fuelType, setFuelType] = useState<FuelType>("diesel");
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const { isFav, toggle: toggleFav } = useFavorites("brandstof");
  const [rows, setRows] = useState<StationWithPrice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    provider
      .list({ city: city.trim() || undefined, truckOnly, adblue })
      .then((r) => {
        if (!cancelled) {
          setRows(r);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Prijzen laden mislukt.");
          setRows([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [provider, city, truckOnly, adblue, reloadKey]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setMe(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, []);

  const list = useMemo(() => {
    const base = (rows ?? []).filter((s) => !onlyFav || isFav(s.id));
    return [...base].sort((a, b) => {
      if (sort === "naam") return a.name.localeCompare(b.name);
      if (sort === "recent")
        return (b.prices[fuelType]?.reported_at ?? "").localeCompare(
          a.prices[fuelType]?.reported_at ?? "",
        );
      if (sort === "afstand" && me)
        return (distanceKm(me, a) ?? Infinity) - (distanceKm(me, b) ?? Infinity);
      return (a.prices[fuelType]?.price_eur ?? Infinity) - (b.prices[fuelType]?.price_eur ?? Infinity);
    });
  }, [rows, onlyFav, isFav, sort, fuelType, me]);

  const cheapest = list.reduce<number | null>(
    (min, s) => {
      const p = s.prices[fuelType];
      return p && (min === null || p.price_eur < min) ? p.price_eur : min;
    },
    null,
  );

  return (
    <AppShell title="Dieselprijzen">
      <Card className="mb-3 border-amber-500/40 bg-amber-500/5">
        <CardContent className="p-3 text-xs text-muted-foreground">
          Bron: <span className="font-semibold text-foreground">{provider.label}</span> —{" "}
          {provider.isLive
            ? "live prijsfeed gekoppeld."
            : "nog geen live prijsfeed gekoppeld; prijzen zijn referentiewaarden uit de eigen database. De providerlaag is voorbereid om een externe feed in te pluggen."}
        </CardContent>
      </Card>

      <div className="mb-3 flex gap-2">
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Filter op plaats…" />
        <Button variant="secondary" size="icon" aria-label="Vernieuwen" onClick={() => setReloadKey((k) => k + 1)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {(Object.keys(fuelTypes) as FuelType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFuelType(f)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${fuelType === f ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}
          >
            {fuelTypes[f]}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["goedkoop", "afstand", "naam", "recent"] as SortKey[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${sort === s ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}
          >
            {s === "goedkoop"
              ? "Goedkoopst"
              : s === "afstand"
                ? "Dichtstbij"
                : s === "naam"
                  ? "Naam"
                  : "Recent bijgewerkt"}
          </button>
        ))}
        <button
          onClick={() => setTruckOnly((v) => !v)}
          className={`ml-auto inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${truckOnly ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}
        >
          <Truck className="h-3.5 w-3.5" /> Truck-geschikt
        </button>
        <button
          onClick={() => setAdblue((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${adblue ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}
        >
          <Droplets className="h-3.5 w-3.5" /> AdBlue
        </button>
        <button
          onClick={() => setOnlyFav((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${onlyFav ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}
        >
          <Heart className={`h-3.5 w-3.5 ${onlyFav ? "fill-primary" : ""}`} /> Favorieten
        </button>
      </div>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      {rows === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Geen tankstations met deze filters.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((s) => {
            const price = s.prices[fuelType] ?? null;
            const isCheap = price != null && price.price_eur === cheapest;
            const fav = isFav(s.id);
            const dist = me ? distanceKm(me, s) : null;
            return (
              <Card key={s.id} className={isCheap ? "border-primary/60" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {[s.brand, s.road, s.city, s.country].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {price ? (
                        <p className="text-lg font-black leading-none">
                          € {price.price_eur.toFixed(3)}
                          <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                            {fuelUnit[fuelType]}
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Geen {fuelTypes[fuelType]}</p>
                      )}
                      {isCheap && <Badge className="mt-1 bg-emerald-500/20 text-emerald-300 text-[10px]">Goedkoopst</Badge>}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {s.has_adblue && (
                      <Badge variant="outline" className="text-[10px]">
                        <Droplets className="mr-1 h-3 w-3" /> AdBlue
                      </Badge>
                    )}
                    {s.truck_suitable && (
                      <Badge variant="outline" className="text-[10px]">
                        <Truck className="mr-1 h-3 w-3" /> Truck OK
                      </Badge>
                    )}
                    {dist != null && (
                      <Badge variant="outline" className="text-[10px]">
                        <MapPin className="mr-1 h-3 w-3" /> {dist} km
                      </Badge>
                    )}
                    {price && (
                      <span className="ml-auto">
                        Bijgewerkt{" "}
                        {new Date(price.reported_at).toLocaleString("nl-NL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  {Object.keys(s.prices).length > 1 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                      {(Object.keys(s.prices) as FuelType[])
                        .filter((f) => f !== fuelType)
                        .map((f) => (
                          <span key={f} className="rounded border border-border px-1.5 py-0.5">
                            {fuelTypes[f]} € {s.prices[f]!.price_eur.toFixed(3)}
                          </span>
                        ))}
                    </div>
                  )}
                  {s.lat != null && s.lng != null && (
                    <Button asChild size="sm" variant="secondary" className="mt-2 w-full">
                      <Link
                        to="/routeplanner"
                        search={{ destLat: s.lat, destLng: s.lng, destLabel: s.name }}
                      >
                        <Navigation className="mr-1 h-4 w-4" /> Navigeer hierheen
                      </Link>
                    </Button>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <p className="flex-1 text-[10px] text-muted-foreground">
                      <Fuel className="mr-1 inline h-3 w-3" />
                      {s.open_hours ?? "Openingstijden onbekend"}
                    </p>
                    <Button size="sm" variant="ghost" onClick={() => toggleFav(s.id)} aria-label="Favoriet">
                      <Star className={`h-4 w-4 ${fav ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
