import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { amenityCategoryMeta, truckstops, type AmenityCategory, type Amenity } from "@/lib/discover-data";

const searchSchema = z.object({
  cat: z.enum(["douche","restaurant","supermarkt","garage","truckwash","rustplek"]).optional(),
});

export const Route = createFileRoute("/voorzieningen")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Voorzieningen — TruckMate" },
      { name: "description", content: "Zoek douches, restaurants, garages, truckwash en rustplekken." },
      { property: "og:title", content: "Voorzieningen — TruckMate" },
      { property: "og:description", content: "Vind wat je zoekt langs de route." },
    ],
  }),
  component: VoorzieningenPage,
});

const cats: AmenityCategory[] = ["douche","restaurant","supermarkt","garage","truckwash","rustplek"];

function amenityFor(cat: AmenityCategory): Amenity | null {
  if (cat === "douche") return "douche";
  if (cat === "restaurant") return "restaurant";
  if (cat === "supermarkt") return "winkel";
  if (cat === "garage") return "reparatie";
  return null;
}

function VoorzieningenPage() {
  const { cat: initial } = Route.useSearch();
  const [active, setActive] = useState<AmenityCategory | null>(initial ?? null);
  const match = active ? amenityFor(active) : null;
  const results = active ? truckstops.filter((t) => (match ? t.amenities.includes(match) : true)).slice(0, 8) : [];

  return (
    <AppShell demoBanner={"Voorzieningen tonen voorbeelddata."} title="Voorzieningen">
      <p className="mb-3 text-sm text-muted-foreground">Kies een categorie om plekken in de buurt van je route te zien.</p>
      <div className="mb-6 grid grid-cols-2 gap-2">
        {cats.map((c) => {
          const meta = amenityCategoryMeta[c];
          const on = active === c;
          return (
            <button key={c} onClick={() => setActive(c)} className="text-left">
              <Card className={`transition ${on?"border-primary bg-primary/10":"hover:border-primary/60"}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{meta.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{meta.label}</p>
                      <p className="line-clamp-1 text-[10px] text-muted-foreground">{meta.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
      {active ? (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{amenityCategoryMeta[active].emoji} {amenityCategoryMeta[active].label}</h2>
            <Badge variant="secondary" className="text-[10px]">{results.length} in de buurt</Badge>
          </div>
          <div className="space-y-2">
            {results.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Geen plekken gevonden.</div>
            ) : results.map((t, i) => (
              <Card key={t.id}><CardContent className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.road} · {t.city}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold">{(3 + i * 4.7).toFixed(1)} km</p>
                  <p className="text-[10px] text-muted-foreground">langs route</p>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Selecteer een categorie hierboven.</div>
      )}
    </AppShell>
  );
}