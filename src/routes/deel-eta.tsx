import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Copy, MapPin, Clock, StopCircle, Truck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/deel-eta")({
  head: () => ({
    meta: [
      { title: "Deel live ETA — TruckMate" },
      { name: "description", content: "Deel je aankomsttijd tijdelijk met planner of klant." },
      { property: "og:title", content: "Deel live ETA — TruckMate" },
      { property: "og:description", content: "Tijdelijke, privacyvriendelijke deel-link met ETA." },
    ],
  }),
  component: DeelEtaPage,
});

function DeelEtaPage() {
  const [enabled, setEnabled] = useState(false);
  const [duration, setDuration] = useState<"30" | "120" | "trip">("120");
  const [audience, setAudience] = useState<"planner" | "klant" | "beide">("planner");

  const link = useMemo(() => {
    const id = Math.random().toString(36).slice(2, 10);
    return `https://truckmate.app/eta/${id}`;
  }, [enabled]);

  const durationLabel = duration === "30" ? "30 minuten" : duration === "120" ? "2 uur" : "Tot einde rit";
  const expiryLabel = duration === "trip" ? "einde rit" : new Date(Date.now() + Number(duration) * 60_000).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  return (
    <AppShell title="Deel live ETA">
      <Alert className="mb-4">
        <AlertDescription className="text-xs">
          <Badge className="mr-2 bg-primary/30 text-primary">Privacy-first</Badge>
          Locatie delen staat standaard uit. De link vervalt automatisch. Je kunt op elk moment stoppen.
        </AlertDescription>
      </Alert>

      <Card className="mb-4 border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-background/60 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Actieve rit</p>
              <p className="text-xs text-muted-foreground">Rotterdam → Duisburg</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          {enabled && (
            <p className="mt-2 text-[11px] text-emerald-300">
              <MapPin className="mr-0.5 inline h-3 w-3" /> Deel-link actief tot {expiryLabel}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="space-y-4 p-4">
          <div>
            <Label className="mb-2 block text-xs font-medium">Duur</Label>
            <RadioGroup value={duration} onValueChange={(v) => setDuration(v as "30" | "120" | "trip")} className="space-y-2">
              {[
                ["30", "30 minuten"],
                ["120", "2 uur"],
                ["trip", "Tot einde rit"],
              ].map(([v, l]) => (
                <Label key={v} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/60">
                  <RadioGroupItem value={v} />
                  <span className="text-sm">{l}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label className="mb-2 block text-xs font-medium">Wie mag zien</Label>
            <RadioGroup value={audience} onValueChange={(v) => setAudience(v as "planner" | "klant" | "beide")} className="space-y-2">
              {[
                ["planner", "Alleen planner"],
                ["klant", "Alleen klant"],
                ["beide", "Planner en klant"],
              ].map(([v, l]) => (
                <Label key={v} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/60">
                  <RadioGroupItem value={v} />
                  <span className="text-sm">{l}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <Card className="mb-4 border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">Deel-link</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-background/60 px-2 py-1 text-[11px]">{link}</code>
              <Button size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(link)}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" /> Duur: {durationLabel} · Doelgroep: {audience}
            </p>
          </CardContent>
        </Card>
      )}

      {enabled && (
        <>
          <h2 className="mb-2 text-sm font-semibold">Voorbeeldweergave</h2>
          <Card className="mb-4 overflow-hidden">
            <div className="h-32 w-full bg-gradient-to-br from-primary/40 via-primary/10 to-sky-500/30" />
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">TruckMate live ETA</p>
              <p className="text-lg font-bold">Jan de Vries → Duisburg</p>
              <p className="text-sm">Verwachte aankomst <b>15:42</b> · nog 92 min</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Update elke 60s · vervalt om {expiryLabel}</p>
            </CardContent>
          </Card>
        </>
      )}

      {enabled && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <StopCircle className="mr-2 h-4 w-4" /> Stop delen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delen stoppen?</AlertDialogTitle>
              <AlertDialogDescription>De link vervalt direct en anderen zien je niet meer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction onClick={() => setEnabled(false)}>Stop delen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppShell>
  );
}