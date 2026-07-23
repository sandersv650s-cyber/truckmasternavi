import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, Star, Plus, Check, Truck, Droplets, Heart } from "lucide-react";
import { fuelStations, flag, minAgoLabel } from "@/lib/discover-data";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/brandstof")({
  head: () => ({
    meta: [
      { title: "Dieselprijzen — TruckMate" },
      { name: "description", content: "Vind de goedkoopste diesel langs je route, met AdBlue en truck-support." },
      { property: "og:title", content: "Dieselprijzen — TruckMate" },
      { property: "og:description", content: "Overzicht van tankstations onderweg." },
    ],
  }),
  component: BrandstofPage,
});

type SortKey = "goedkoop" | "dichtbij" | "recent";

function BrandstofPage() {
  const [sort, setSort] = useState<SortKey>("goedkoop");
  const [truckOnly, setTruckOnly] = useState(true);
  const [adblue, setAdblue] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const { isFav, toggle: toggleFav } = useFavorites("brandstof");
  const [stops, setStops] = useState<string[]>([]);

  const list = useMemo(() => {
    const f = fuelStations.filter(
      (s) =>
        (!truckOnly || s.truckSuitable) &&
        (!adblue || s.adblue) &&
        (!onlyFav || isFav(s.id)),
    );
    return [...f].sort((a, b) =>
      sort === "goedkoop" ? a.dieselPrice - b.dieselPrice :
      sort === "dichtbij" ? a.distanceFromRouteKm - b.distanceFromRouteKm :
      a.updatedMinAgo - b.updatedMinAgo);
  }, [sort, truckOnly, adblue, onlyFav, isFav]);
  const toggleStop = (id: string) => setStops((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const cheapest = list.length ? Math.min(...list.map((s) => s.dieselPrice)) : 0;

  return (
    <AppShell title="Dieselprijzen">
      <Card className="mb-4 border-amber-500/40 bg-amber-500/5"><CardContent className="p-3 text-xs text-muted-foreground">
        Prijzen zijn <span className="font-semibold text-foreground">demo-data</span> en niet gekoppeld aan een live provider.
      </CardContent></Card>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["goedkoop","dichtbij","recent"] as SortKey[]).map((s) => (
          <button key={s} onClick={() => setSort(s)} className={`rounded-full border px-3 py-1 text-xs font-medium ${sort===s?"border-primary bg-primary/20 text-primary":"border-border text-muted-foreground"}`}>
            {s==="goedkoop"?"Goedkoopst":s==="dichtbij"?"Dichtstbij":"Recent bijgewerkt"}
          </button>
        ))}
        <button onClick={() => setTruckOnly((v) => !v)} className={`ml-auto inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${truckOnly?"border-primary bg-primary/20 text-primary":"border-border text-muted-foreground"}`}>
          <Truck className="h-3.5 w-3.5" /> Truck-geschikt
        </button>
        <button onClick={() => setAdblue((v) => !v)} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${adblue?"border-primary bg-primary/20 text-primary":"border-border text-muted-foreground"}`}>
          <Droplets className="h-3.5 w-3.5" /> AdBlue
        </button>
        <button onClick={() => setOnlyFav((v) => !v)} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${onlyFav?"border-primary bg-primary/20 text-primary":"border-border text-muted-foreground"}`}>
          <Heart className={`h-3.5 w-3.5 ${onlyFav ? "fill-primary" : ""}`} /> Favorieten
        </button>
      </div>

      <div className="space-y-2">
        {list.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Geen tankstations met deze filters.
          </div>
        )}
        {list.map((s) => {
          const isCheap = s.dieselPrice === cheapest;
          const fav = isFav(s.id);
          const asStop = stops.includes(s.id);
          return (
            <Card key={s.id} className={isCheap ? "border-primary/60" : ""}><CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{flag(s.country)} {s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{s.brand} · {s.road} · {s.city}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black leading-none">€ {s.dieselPrice.toFixed(3)}<span className="ml-1 text-[10px] font-normal text-muted-foreground">/L</span></p>
                  {isCheap && <Badge className="mt-1 bg-emerald-500/20 text-emerald-300 text-[10px]">Goedkoopst</Badge>}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>+{s.distanceFromRouteKm} km · {s.detourMin} min omweg</span>
                {s.adblue && <Badge variant="outline" className="text-[10px]"><Droplets className="mr-1 h-3 w-3" /> AdBlue</Badge>}
                {s.truckSuitable && <Badge variant="outline" className="text-[10px]"><Truck className="mr-1 h-3 w-3" /> Truck OK</Badge>}
                <span className="ml-auto">Bijgewerkt {minAgoLabel(s.updatedMinAgo)}</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground"><Fuel className="mr-1 inline h-3 w-3" />Open: {s.openHours}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant={asStop?"default":"secondary"} className="flex-1" onClick={() => toggleStop(s.id)}>
                  {asStop ? (<><Check className="mr-1 h-4 w-4" /> Toegevoegd</>) : (<><Plus className="mr-1 h-4 w-4" /> Als tussenstop</>)}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleFav(s.id)} aria-label="favoriet">
                  <Star className={`h-4 w-4 ${fav?"fill-yellow-400 text-yellow-400":""}`} />
                </Button>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </AppShell>
  );
}