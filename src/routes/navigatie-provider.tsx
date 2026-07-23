import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Map as MapIcon, Loader2, Navigation, Ruler, Weight, Truck } from "lucide-react";

export const Route = createFileRoute("/navigatie-provider")({
  head: () => ({
    meta: [
      { title: "Navigatie-provider — TruckMate" },
      { name: "description", content: "Kies HERE of TomTom als toekomstige truckroute-provider." },
      { property: "og:title", content: "Navigatie-provider — TruckMate" },
      { property: "og:description", content: "HERE en TomTom trucknavigatie — demo." },
    ],
  }),
  component: ProviderPage,
});

type Provider = "here" | "tomtom";

function ProviderPage() {
  const [provider, setProvider] = useState<Provider>("here");
  const [from, setFrom] = useState("Rotterdam");
  const [to, setTo] = useState("Duisburg");
  const [avoidToll, setAvoidToll] = useState(false);
  const [avoidLez, setAvoidLez] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<{ km: number; min: number; toll: number } | null>(null);

  const calc = () => {
    setCalculating(true);
    setResult(null);
    setTimeout(() => {
      const baseKm = 235 + Math.floor(Math.random() * 40);
      const min = Math.round(baseKm * (avoidToll ? 0.95 : 0.82));
      setResult({ km: baseKm, min, toll: avoidToll ? 0 : 18.4 });
      setCalculating(false);
    }, 1400);
  };

  const providers: { id: Provider; name: string; api: string; features: string[] }[] = [
    { id: "here", name: "HERE Truck Routing", api: "REST v8", features: ["Hoogte-/gewichtsrestricties", "ADR-corridors", "LEZ (milieuzones)", "Live traffic"] },
    { id: "tomtom", name: "TomTom Truck Navigation", api: "Extended Routing v1", features: ["Bandenketting-zones", "Tunnel-categorieën", "Truck-POI's", "Historische snelheden"] },
  ];

  return (
    <AppShell title="Navigatie-provider">
      <Alert className="mb-4">
        <AlertDescription className="text-[11px]">
          <Badge className="mr-2 bg-primary/30 text-primary">Demo</Badge>
          HERE en TomTom worden in een volgende versie geïntegreerd. Deze pagina simuleert een truckroute-berekening met mockwaarden — geen echte API-key nodig.
        </AlertDescription>
      </Alert>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {providers.map((p) => {
          const active = provider === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`rounded-xl border p-3 text-left transition ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"}`}
            >
              <MapIcon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <p className="mt-1 text-sm font-semibold">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">API: {p.api}</p>
              <Badge variant="outline" className="mt-1 text-[10px]">Binnenkort</Badge>
            </button>
          );
        })}
      </div>

      <Card className="mb-3">
        <CardContent className="p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Truckrestricties</p>
          <ul className="space-y-1 text-xs">
            {providers.find((p) => p.id === provider)!.features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Truck className="h-3 w-3 text-primary" /> {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">Demo-routeberekening</p>
          <div>
            <Label className="text-xs">Van</Label>
            <Input value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Naar</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-2 text-xs">
            <label className="flex items-center justify-between">
              <span>Vermijd tol</span>
              <Switch checked={avoidToll} onCheckedChange={setAvoidToll} />
            </label>
            <label className="flex items-center justify-between">
              <span>Vermijd milieuzones</span>
              <Switch checked={avoidLez} onCheckedChange={setAvoidLez} />
            </label>
          </div>
          <Button className="w-full" onClick={calc} disabled={calculating}>
            {calculating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Berekenen…</>) : (<><Navigation className="mr-2 h-4 w-4" /> Bereken route</>)}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Voorbeeldresultaat</p>
            <p className="mt-1 text-lg font-bold">{from} → {to}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div><Ruler className="mx-auto h-4 w-4 text-muted-foreground" /><p className="mt-1 text-sm font-bold">{result.km} km</p></div>
              <div><Navigation className="mx-auto h-4 w-4 text-muted-foreground" /><p className="mt-1 text-sm font-bold">{Math.floor(result.min / 60)}u {result.min % 60}m</p></div>
              <div><Weight className="mx-auto h-4 w-4 text-muted-foreground" /><p className="mt-1 text-sm font-bold">€ {result.toll.toFixed(2)}</p></div>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Mock — echte tijden en tol volgen bij integratie.</p>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}