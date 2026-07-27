import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Fuel, Star, Truck, Droplets, Heart, RefreshCw } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { getFuelProvider, type StationWithPrice } from "@/lib/fuel";

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

  const list = useMemo(() => {
    const base = (rows ?? []).filter((s) => !onlyFav || isFav(s.id));
    return [...base].sort((a, b) => {
      if (sort === "naam") return a.name.localeCompare(b.name);
      if (sort === "recent")
        return (b.price?.reported_at ?? "").localeCompare(a.price?.reported_at ?? "");
      return (a.price?.price_eur ?? Infinity) - (b.price?.price_eur ?? Infinity);
    });
  }, [rows, onlyFav, isFav, sort]);

  const cheapest = list.reduce<number | null>(
    (min, s) => (s.price && (min === null || s.price.price_eur < min) ? s.price.price_eur : min),
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
        {(["goedkoop", "naam", "recent"] as SortKey[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${sort === s ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}
          >
            {s === "goedkoop" ? "Goedkoopst" : s === "naam" ? "Naam" : "Recent bijgewerkt"}
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
            const isCheap = s.price != null && s.price.price_eur === cheapest;
            const fav = isFav(s.id);
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
                      {s.price ? (
                        <p className="text-lg font-black leading-none">
                          € {s.price.price_eur.toFixed(3)}
                          <span className="ml-1 text-[10px] font-normal text-muted-foreground">/L</span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Geen prijs</p>
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
                    {s.price && (
                      <span className="ml-auto">
                        Bijgewerkt{" "}
                        {new Date(s.price.reported_at).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
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
