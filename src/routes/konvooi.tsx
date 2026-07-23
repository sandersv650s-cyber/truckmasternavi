import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Radio, MapPin, Clock, StopCircle, Play, ShieldCheck, Copy } from "lucide-react";
import { sampleKonvooiMembers } from "@/lib/more-data";
import { userById } from "@/lib/mock-data";

export const Route = createFileRoute("/konvooi")({
  head: () => ({
    meta: [
      { title: "Konvooimodus — TruckMate" },
      { name: "description", content: "Rijd samen met collega's. Live locatie delen is standaard uit en heeft altijd een einde." },
      { property: "og:title", content: "Konvooimodus — TruckMate" },
      { property: "og:description", content: "Tijdelijk locatie delen met een konvooi-groep." },
    ],
  }),
  component: KonvooiPage,
});

const durations = [30, 60, 120, 240];

function KonvooiPage() {
  const [name, setName] = useState("Konvooi naar Kamen");
  const [duration, setDuration] = useState(60);
  const [active, setActive] = useState(false);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!active || !endsAt) return;
    const tick = () => {
      const rem = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) {
        setActive(false);
        setEndsAt(null);
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [active, endsAt]);

  const start = () => {
    setEndsAt(Date.now() + duration * 60_000);
    setActive(true);
  };
  const stop = () => {
    setActive(false);
    setEndsAt(null);
  };

  const inviteCode = "TM-K74Q9";

  return (
    <AppShell title="Konvooimodus">
      <Card className="mb-3 border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="flex items-start gap-3 p-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 text-xs">
            <p className="font-semibold text-foreground">Privacy-first</p>
            <p className="mt-0.5 text-muted-foreground">
              Locatie delen is standaard <span className="font-semibold text-foreground">UIT</span>. Als je start, kies je zelf een einde. Stop is altijd 1 tik. Voor deze demo zijn alle locaties nep.
            </p>
          </div>
        </CardContent>
      </Card>

      {!active ? (
        <Card className="mb-4">
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Naam konvooi</p>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bijv. Route naar Kamen" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Duur</p>
              <div className="flex flex-wrap gap-1.5">
                {durations.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      duration === d ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {d < 60 ? `${d} min` : `${d / 60} u`}
                  </button>
                ))}
              </div>
            </div>
            <Button size="lg" className="h-12 w-full font-bold" onClick={start} disabled={!name.trim()}>
              <Play className="mr-2 h-4 w-4 fill-current" /> Start konvooi & deel locatie
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              Je locatie wordt automatisch niet meer gedeeld na de gekozen duur.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-4 border-primary/50 bg-primary/5">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                </span>
                <p className="text-sm font-semibold">{name}</p>
              </div>
              <Badge className="bg-primary/20 text-primary text-[10px]">Live</Badge>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Nog{" "}
                <span className="font-semibold text-foreground">
                  {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
                </span>{" "}
                min · verloopt automatisch
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-background/40 p-3 text-xs">
              <span className="text-muted-foreground">Uitnodigingscode:</span>
              <span className="font-mono font-semibold">{inviteCode}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-7 px-2"
                onClick={() => navigator.clipboard?.writeText(inviteCode)}
              >
                <Copy className="mr-1 h-3 w-3" /> Kopieer
              </Button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" variant="destructive" className="h-12 w-full font-bold">
                  <StopCircle className="mr-2 h-4 w-4" /> Stop nu
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konvooi stoppen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Je locatie wordt direct niet meer gedeeld. Deelnemers zien je laatste positie niet meer bijwerken.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={stop}>Stop delen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-2 text-sm font-semibold">Deelnemers (mock)</h2>
      <div className="space-y-2">
        {sampleKonvooiMembers.map((m) => {
          const u = userById(m.userId);
          return (
            <Card key={m.userId}>
              <CardContent className="flex items-center gap-3 p-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.avatar} alt="" />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {m.distanceKm} km · ETA {m.eta}
                  </p>
                </div>
                <Badge
                  className={`text-[10px] ${
                    m.status === "onderweg"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : m.status === "gepauzeerd"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-primary/20 text-primary"
                  }`}
                >
                  {m.status}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Beheer permissies in het{" "}
          <Link to="/privacy" className="text-primary underline">
            privacycentrum
          </Link>
          .
        </span>
        <Radio className="h-3.5 w-3.5" />
      </div>
    </AppShell>
  );
}