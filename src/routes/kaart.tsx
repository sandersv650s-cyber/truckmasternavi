import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParkingSquare, Fuel, Megaphone, X, Navigation, Star } from "lucide-react";
import {
  truckstops,
  fuelStations,
  initialAlerts,
  occupancyMeta,
  alertMeta,
  flag,
  minAgoLabel,
} from "@/lib/discover-data";

export const Route = createFileRoute("/kaart")({
  head: () => ({
    meta: [
      { title: "Kaart — TruckMate" },
      {
        name: "description",
        content:
          "Interactieve kaart met truckparkings, tankstations en meldingen in Nederland, België en Duitsland.",
      },
      { property: "og:title", content: "Kaart — TruckMate" },
      { property: "og:description", content: "Alles onderweg in één kaartweergave." },
    ],
  }),
  component: KaartPage,
});

type Layer = "parking" | "fuel" | "alert";
type Pin = {
  type: Layer;
  id: string;
  lat: number;
  lng: number;
  title: string;
  sub: string;
  extra?: string;
};

const fuelCoords = (i: number) => ({
  lat: 50.75 + ((i * 7) % 15) * 0.11,
  lng: 3.1 + ((i * 5) % 12) * 0.42,
});
const alertCoords = (i: number) => ({
  lat: 50.9 + ((i * 11) % 14) * 0.09,
  lng: 3.4 + ((i * 9) % 11) * 0.4,
});

function KaartPage() {
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    parking: true,
    fuel: true,
    alert: true,
  });
  const [selected, setSelected] = useState<Pin | null>(null);

  const pins: Pin[] = useMemo(() => {
    const arr: Pin[] = [];
    if (layers.parking) {
      truckstops.forEach((t) =>
        arr.push({
          type: "parking",
          id: t.id,
          lat: t.lat,
          lng: t.lng,
          title: `${flag(t.country)} ${t.name}`,
          sub: `${t.freeSpots}/${t.totalSpots} vrij · ${occupancyMeta[t.occupancy].label}`,
          extra: `${t.rating.toFixed(1)} ★`,
        }),
      );
    }
    if (layers.fuel) {
      fuelStations.forEach((f, i) => {
        const c = fuelCoords(i);
        arr.push({
          type: "fuel",
          id: f.id,
          lat: c.lat,
          lng: c.lng,
          title: `${flag(f.country)} ${f.name}`,
          sub: `${f.brand} · € ${f.dieselPrice.toFixed(3)}/L`,
        });
      });
    }
    if (layers.alert) {
      initialAlerts.forEach((a, i) => {
        const c = alertCoords(i);
        arr.push({
          type: "alert",
          id: a.id,
          lat: c.lat,
          lng: c.lng,
          title: `${alertMeta[a.category].emoji} ${alertMeta[a.category].label}`,
          sub: a.location,
          extra: minAgoLabel(a.createdMinAgo),
        });
      });
    }
    return arr;
  }, [layers]);

  const minLat = 50.4,
    maxLat = 52.4,
    minLng = 2.8,
    maxLng = 8.4;
  const W = 400,
    H = 320;
  const proj = (lat: number, lng: number) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * W,
    y: H - ((lat - minLat) / (maxLat - minLat)) * H,
  });
  const toggle = (k: Layer) =>
    setLayers((p) => ({ ...p, [k]: !p[k] }));

  return (
    <AppShell title="Kaart">
      <div className="mb-3 flex flex-wrap gap-2">
        <LayerBtn
          on={layers.parking}
          onClick={() => toggle("parking")}
          icon={<ParkingSquare className="h-3.5 w-3.5" />}
          label={`Parking (${truckstops.length})`}
          tone="primary"
        />
        <LayerBtn
          on={layers.fuel}
          onClick={() => toggle("fuel")}
          icon={<Fuel className="h-3.5 w-3.5" />}
          label={`Tanken (${fuelStations.length})`}
          tone="amber"
        />
        <LayerBtn
          on={layers.alert}
          onClick={() => toggle("alert")}
          icon={<Megaphone className="h-3.5 w-3.5" />}
          label={`Meldingen (${initialAlerts.length})`}
          tone="orange"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="relative aspect-[5/4] bg-[radial-gradient(circle_at_30%_20%,oklch(0.32_0.08_252)_0%,oklch(0.16_0.03_250)_75%)]">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="kaartgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M40 0H0V40"
                  fill="none"
                  stroke="oklch(0.32 0.03 252)"
                  strokeWidth="0.4"
                />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#kaartgrid)" />
            <path
              d="M20 240 Q 140 200 220 180 T 380 90"
              stroke="oklch(0.55 0.05 250)"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M40 130 Q 180 150 380 210"
              stroke="oklch(0.55 0.05 250)"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M120 20 Q 160 140 260 300"
              stroke="oklch(0.55 0.05 250)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.4"
            />
            {pins.map((p) => {
              const { x, y } = proj(p.lat, p.lng);
              const sel = selected?.id === p.id && selected?.type === p.type;
              const color =
                p.type === "parking"
                  ? "oklch(0.7 0.15 250)"
                  : p.type === "fuel"
                    ? "oklch(0.82 0.16 80)"
                    : "oklch(0.7 0.22 30)";
              return (
                <g
                  key={`${p.type}-${p.id}`}
                  className="cursor-pointer"
                  onClick={() => setSelected(p)}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={sel ? 10 : 6}
                    fill={color}
                    stroke="oklch(0.14 0.02 250)"
                    strokeWidth="1.5"
                  />
                  {sel && (
                    <circle
                      cx={x}
                      cy={y}
                      r="15"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      opacity="0.55"
                    />
                  )}
                </g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute bottom-2 right-2">
            <Badge variant="secondary" className="text-[10px]">
              Interactieve demo · NL/BE/DE
            </Badge>
          </div>
        </div>
      </Card>

      {selected ? (
        <Card className="mt-3 border-primary/50">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {selected.type === "parking"
                    ? "Truckparking"
                    : selected.type === "fuel"
                      ? "Tankstation"
                      : "Melding"}
                </p>
                <p className="truncate text-sm font-semibold">{selected.title}</p>
                <p className="text-[11px] text-muted-foreground">{selected.sub}</p>
                {selected.extra && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-yellow-300">
                    {selected.type === "parking" && (
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    )}
                    {selected.extra}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-background/60"
                aria-label="Sluiten"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              {selected.type === "parking" && (
                <Link to="/truckstops/$id" params={{ id: selected.id }} className="block">
                  <Button size="sm" className="w-full">
                    <Navigation className="mr-1 h-4 w-4" /> Details & reviews
                  </Button>
                </Link>
              )}
              {selected.type === "fuel" && (
                <Link to="/brandstof" className="block">
                  <Button size="sm" className="w-full">
                    <Fuel className="mr-1 h-4 w-4" /> Alle dieselprijzen
                  </Button>
                </Link>
              )}
              {selected.type === "alert" && (
                <Link to="/meldingen" className="block">
                  <Button size="sm" className="w-full">
                    <Megaphone className="mr-1 h-4 w-4" /> Naar meldingen
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Tik op een pin voor details.
        </p>
      )}

      <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
        <Legend color="oklch(0.7 0.15 250)" label="Parking" />
        <Legend color="oklch(0.82 0.16 80)" label="Diesel" />
        <Legend color="oklch(0.7 0.22 30)" label="Melding" />
      </div>
    </AppShell>
  );
}

function LayerBtn({
  on,
  onClick,
  icon,
  label,
  tone,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: "primary" | "amber" | "orange";
}) {
  const toneOn =
    tone === "primary"
      ? "border-primary bg-primary/20 text-primary"
      : tone === "amber"
        ? "border-amber-500 bg-amber-500/20 text-amber-300"
        : "border-orange-500 bg-orange-500/20 text-orange-300";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${
        on ? toneOn : "border-border bg-background/40 text-muted-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center justify-center gap-1 text-muted-foreground">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}