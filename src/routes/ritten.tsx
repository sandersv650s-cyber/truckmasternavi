import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Gauge, Fuel, Clock, MapPin, Timer } from "lucide-react";
import { rides, formatDate, formatDuration } from "@/lib/mock-data";

export const Route = createFileRoute("/ritten")({
  head: () => ({
    meta: [
      { title: "Ritten — TruckMate" },
      { name: "description", content: "Start of stop een rit en bekijk je geregistreerde ritten." },
      { property: "og:title", content: "Ritten — TruckMate" },
      { property: "og:description", content: "Live ritregistratie met verbruik en snelheid." },
    ],
  }),
  component: RittenPage,
});

type Live = {
  running: boolean;
  seconds: number;
  km: number;
  avgSpeed: number;
  maxSpeed: number;
  idleSec: number;
  liters: number;
  currentSpeed: number;
};

function RittenPage() {
  const [live, setLive] = useState<Live>({
    running: false,
    seconds: 0,
    km: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    idleSec: 0,
    liters: 0,
    currentSpeed: 0,
  });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!live.running) return;
    timer.current = setInterval(() => {
      setLive((p) => {
        const speed = Math.max(0, Math.round(60 + Math.sin(p.seconds / 5) * 25 + (Math.random() * 10 - 5)));
        const idleAdd = speed < 5 ? 1 : 0;
        const kmAdd = speed / 3600;
        const totalKm = p.km + kmAdd;
        const litersAdd = (speed / 3600) * 0.3;
        const newSeconds = p.seconds + 1;
        const avg = totalKm / (newSeconds / 3600) || 0;
        return {
          ...p,
          seconds: newSeconds,
          km: +totalKm.toFixed(2),
          avgSpeed: Math.round(avg),
          maxSpeed: Math.max(p.maxSpeed, speed),
          idleSec: p.idleSec + idleAdd,
          liters: +(p.liters + litersAdd).toFixed(2),
          currentSpeed: speed,
        };
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [live.running]);

  const toggle = () =>
    setLive((p) =>
      p.running
        ? { ...p, running: false }
        : { running: true, seconds: 0, km: 0, avgSpeed: 0, maxSpeed: 0, idleSec: 0, liters: 0, currentSpeed: 0 },
    );

  const hh = Math.floor(live.seconds / 3600).toString().padStart(2, "0");
  const mm = Math.floor((live.seconds % 3600) / 60).toString().padStart(2, "0");
  const ss = (live.seconds % 60).toString().padStart(2, "0");

  return (
    <AppShell title="Ritten">
      <Card
        className={`mb-4 overflow-hidden ${
          live.running ? "border-primary bg-gradient-to-br from-primary/20 to-card" : ""
        }`}
      >
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {live.running ? "Rit bezig" : "Klaar om te starten"}
              </p>
              <p className="text-3xl font-black tabular-nums">
                {hh}:{mm}:{ss}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Huidige snelheid</p>
              <p className="text-3xl font-black tabular-nums text-primary">
                {live.currentSpeed}
                <span className="ml-1 text-sm font-normal text-muted-foreground">km/u</span>
              </p>
            </div>
          </div>
          <div className="mb-4 grid grid-cols-4 gap-2 text-center">
            <Kpi icon={<MapPin className="h-3.5 w-3.5" />} label="km" value={live.km.toFixed(1)} />
            <Kpi icon={<Gauge className="h-3.5 w-3.5" />} label="gem" value={`${live.avgSpeed}`} />
            <Kpi icon={<Timer className="h-3.5 w-3.5" />} label="max" value={`${live.maxSpeed}`} />
            <Kpi icon={<Fuel className="h-3.5 w-3.5" />} label="L" value={live.liters.toFixed(1)} />
          </div>
          <Button
            size="lg"
            variant={live.running ? "destructive" : "default"}
            className="h-14 w-full text-base font-bold"
            onClick={toggle}
          >
            {live.running ? (
              <>
                <Square className="mr-2 h-5 w-5 fill-current" /> Stop rit
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5 fill-current" /> Start rit
              </>
            )}
          </Button>
          {!live.running && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Live telemetrie wordt gesimuleerd voor demo-doeleinden.
            </p>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-2 mt-4 text-base font-semibold">Recente ritten</h2>
      <div className="space-y-2">
        {rides.map((r) => (
          <Link key={r.id} to="/ritten/$rideId" params={{ rideId: r.id }}>
            <Card className="transition hover:border-primary/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{r.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="truncate">{r.to}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.date)}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {r.km} km
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDuration(r.durationMin)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" /> {r.avgSpeed} km/u
                  </span>
                  <span className="flex items-center gap-1">
                    <Fuel className="h-3 w-3" /> {r.l100} l/100
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/60 p-2">
      <div className="mb-0.5 flex items-center justify-center gap-1 text-[9px] uppercase text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}