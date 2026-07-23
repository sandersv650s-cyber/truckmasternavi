import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, MapPin, Navigation, Route as RouteIcon, Truck } from "lucide-react";

export const Route = createFileRoute("/navigatie")({
  head: () => ({
    meta: [
      { title: "Truck navigatie — TruckMate" },
      {
        name: "description",
        content:
          "Plan een route die rekening houdt met je voertuigprofiel: hoogte, gewicht, assen en gevaarlijke lading.",
      },
      { property: "og:title", content: "Truck navigatie — TruckMate" },
      { property: "og:description", content: "Truck-safe routes met voertuigprofiel." },
    ],
  }),
  component: NavigatiePage,
});

function NavigatiePage() {
  const [from, setFrom] = useState("Rotterdam Botlek");
  const [to, setTo] = useState("Duisburg DE");
  const [computed, setComputed] = useState(false);

  return (
    <AppShell title="Navigatie">
      <Alert className="mb-4 border-yellow-500/40 bg-yellow-500/10 text-yellow-100">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-sm font-semibold">Rijden gaat voor</AlertTitle>
        <AlertDescription className="text-xs">
          Verkeersborden en werkelijke voertuigbeperkingen zijn altijd leidend. TruckMate is een
          hulpmiddel.
        </AlertDescription>
      </Alert>

      <Card className="mb-4 overflow-hidden">
        <div className="relative h-56 bg-[radial-gradient(circle_at_30%_30%,oklch(0.35_0.06_255)_0%,oklch(0.19_0.03_250)_60%)]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 220" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0H0V40" fill="none" stroke="oklch(0.32 0.03 252)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="400" height="220" fill="url(#grid)" />
            <path
              d="M30 180 C 100 140, 160 120, 220 90 S 340 40, 380 30"
              stroke="oklch(0.72 0.17 55)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={computed ? "0" : "8 6"}
            />
            <circle cx="30" cy="180" r="7" fill="oklch(0.7 0.16 155)" />
            <circle cx="380" cy="30" r="7" fill="oklch(0.62 0.22 27)" />
          </svg>
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="text-[10px]">
              Mock kaart · HERE/TomTom/Mapbox integratie later
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <RouteIcon className="h-4 w-4" /> Route
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="from">Vertrek</Label>
            <div className="relative mt-1">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
              <Input id="from" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div>
            <Label htmlFor="to">Bestemming</Label>
            <div className="relative mt-1">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
              <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Button size="lg" className="h-12 w-full" onClick={() => setComputed(true)}>
            <Navigation className="mr-2 h-4 w-4" /> Bereken truck-route
          </Button>
          {computed && (
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-background/60 p-3 text-center">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Afstand</p>
                <p className="font-bold">218 km</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Tijd</p>
                <p className="font-bold">2u 54m</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Tol</p>
                <p className="font-bold">€ 28,40</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4" /> Voertuigprofiel
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field label="Hoogte (m)" defaultValue="4.00" />
          <Field label="Breedte (m)" defaultValue="2.55" />
          <Field label="Lengte (m)" defaultValue="16.50" />
          <Field label="Gewicht (t)" defaultValue="40" />
          <Field label="Aantal assen" defaultValue="5" />
          <div>
            <Label>Emissieklasse</Label>
            <Select defaultValue="euro6">
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="euro4">Euro 4</SelectItem>
                <SelectItem value="euro5">Euro 5</SelectItem>
                <SelectItem value="euro6">Euro 6</SelectItem>
                <SelectItem value="ev">Elektrisch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Gevaarlijke lading (ADR)</p>
              <p className="text-xs text-muted-foreground">Vermijd tunnels/steden</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Truck-routing wordt in productie gekoppeld aan HERE, TomTom of Mapbox.
      </p>
    </AppShell>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1" defaultValue={defaultValue} inputMode="decimal" />
    </div>
  );
}