import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Square, Pause, Gauge, Fuel, Clock, MapPin, Timer, Loader2, Trash2, Route as RouteIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, formatDuration, type Ride } from "@/lib/queries";
import { formatDistance, formatDuration as fmtDur } from "@/lib/routing";
import { toast } from "sonner";

export const Route = createFileRoute("/ritten")({
  head: () => ({
    meta: [
      { title: "Ritten — TruckMate" },
      { name: "description", content: "Start, pauzeer of stop een rit en bekijk je ritgeschiedenis." },
      { property: "og:title", content: "Ritten — TruckMate" },
      { property: "og:description", content: "Ritregistratie voor vrachtwagenchauffeurs." },
    ],
  }),
  component: RittenPage,
});

type LiveState = {
  seconds: number;
  km: number;
  avgSpeed: number;
  maxSpeed: number;
  liters: number;
  currentSpeed: number;
};

function RittenPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const activeQ = useQuery({
    queryKey: ["rides", "active", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("user_id", user!.id)
        .in("status", ["active", "paused"])
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Ride | null;
    },
  });

  const listQ = useQuery({
    queryKey: ["rides", "list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Ride[];
    },
  });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [live, setLive] = useState<LiveState>({ seconds: 0, km: 0, avgSpeed: 0, maxSpeed: 0, liters: 0, currentSpeed: 0 });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const active = activeQ.data ?? null;
  const running = active?.status === "active";

  // Simulated live telemetry (browser can't read truck telemetry)
  useEffect(() => {
    if (!running) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(() => {
      setLive((p) => {
        const speed = Math.max(0, Math.round(60 + Math.sin(p.seconds / 5) * 25 + (Math.random() * 10 - 5)));
        const kmAdd = speed / 3600;
        const totalKm = p.km + kmAdd;
        const litersAdd = (speed / 3600) * 0.3;
        const newSeconds = p.seconds + 1;
        const avg = totalKm / (newSeconds / 3600) || 0;
        return {
          seconds: newSeconds,
          km: +totalKm.toFixed(2),
          avgSpeed: Math.round(avg),
          maxSpeed: Math.max(p.maxSpeed, speed),
          liters: +(p.liters + litersAdd).toFixed(2),
          currentSpeed: speed,
        };
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  useEffect(() => {
    // Reset live state when active ride changes/ends
    if (!active) setLive({ seconds: 0, km: 0, avgSpeed: 0, maxSpeed: 0, liters: 0, currentSpeed: 0 });
  }, [active?.id, active]);

  const startMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("rides").insert({
        user_id: user!.id,
        from_location: from.trim() || "Vertrek",
        to_location: to.trim() || "Bestemming",
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setFrom("");
      setTo("");
      qc.invalidateQueries({ queryKey: ["rides"] });
      toast.success("Rit gestart");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (patch: Partial<Ride>) => {
      const { error } = await supabase.from("rides").update(patch).eq("id", active!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rides"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const stopMut = useMutation({
    mutationFn: async () => {
      const endedAt = new Date().toISOString();
      const durationMin = Math.round(live.seconds / 60);
      const l100 = live.km > 0 ? +((live.liters / live.km) * 100).toFixed(1) : null;
      const { error } = await supabase
        .from("rides")
        .update({
          status: "completed",
          ended_at: endedAt,
          duration_min: durationMin,
          km: live.km,
          avg_speed: live.avgSpeed,
          max_speed: live.maxSpeed,
          liters: live.liters,
          l100,
        })
        .eq("id", active!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
      toast.success("Rit bewaard");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
      toast.success("Rit verwijderd");
    },
  });

  const hh = Math.floor(live.seconds / 3600).toString().padStart(2, "0");
  const mm = Math.floor((live.seconds % 3600) / 60).toString().padStart(2, "0");
  const ss = (live.seconds % 60).toString().padStart(2, "0");

  return (
    <AppShell title="Ritten">
      {activeQ.isLoading ? (
        <Card className="mb-4"><CardContent className="p-5 text-sm text-muted-foreground">Laden…</CardContent></Card>
      ) : active ? (
        <Card className={`mb-4 overflow-hidden ${running ? "border-primary bg-gradient-to-br from-primary/20 to-card" : ""}`}>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {running ? "Rit bezig" : "Gepauzeerd"}
                </p>
                <p className="text-3xl font-black tabular-nums">{hh}:{mm}:{ss}</p>
                <p className="mt-1 text-xs text-muted-foreground">{active.from_location} → {active.to_location}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Snelheid</p>
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
            <div className="flex gap-2">
              {running ? (
                <Button size="lg" variant="secondary" className="h-14 flex-1 font-bold" onClick={() => updateMut.mutate({ status: "paused" })} disabled={updateMut.isPending}>
                  <Pause className="mr-2 h-5 w-5 fill-current" /> Pauze
                </Button>
              ) : (
                <Button size="lg" className="h-14 flex-1 font-bold" onClick={() => updateMut.mutate({ status: "active" })} disabled={updateMut.isPending}>
                  <Play className="mr-2 h-5 w-5 fill-current" /> Hervatten
                </Button>
              )}
              <Button size="lg" variant="destructive" className="h-14 flex-1 font-bold" onClick={() => stopMut.mutate()} disabled={stopMut.isPending}>
                {stopMut.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Square className="mr-2 h-5 w-5 fill-current" />} Stop
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Live telemetrie wordt gesimuleerd. Truck-Bluetooth/OBD wordt nog niet ondersteund in web/PWA.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-4">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Nieuwe rit</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="from" className="text-xs">Van</Label>
                <Input id="from" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Rotterdam" />
              </div>
              <div>
                <Label htmlFor="to" className="text-xs">Naar</Label>
                <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Antwerpen" />
              </div>
            </div>
            <Button size="lg" className="mt-4 h-14 w-full text-base font-bold" onClick={() => startMut.mutate()} disabled={startMut.isPending}>
              {startMut.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
              Start rit
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Zonder OBD wordt de telemetrie gesimuleerd. Echte truckdata volgt zodra hardware wordt ondersteund.
            </p>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-2 mt-4 text-base font-semibold">Geschiedenis</h2>
      {listQ.isLoading ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Laden…</div>
      ) : listQ.error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">Kon ritten niet laden.</div>
      ) : (listQ.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nog geen ritten. Start je eerste rit hierboven.
        </div>
      ) : (
        <div className="space-y-2">
          {listQ.data!.map((r) => (
            <div key={r.id} className="relative">
              <Link to="/ritten/$rideId" params={{ rideId: r.id }}>
                <Card className="transition hover:border-primary/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className="truncate">{r.from_location}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="truncate">{r.to_location}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.started_at)}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{Number(r.km).toFixed(1)} km</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDuration(r.duration_min)}</span>
                      {r.avg_speed != null && <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {Math.round(Number(r.avg_speed))} km/u</span>}
                      {r.l100 != null && <span className="flex items-center gap-1"><Fuel className="h-3 w-3" /> {Number(r.l100).toFixed(1)} l/100</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); if (confirm("Rit verwijderen?")) deleteMut.mutate(r.id); }}
                className="absolute right-2 top-2 rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Verwijder rit"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <SavedRoutesSection userId={user?.id} />
    </AppShell>
  );
}

function SavedRoutesSection({ userId }: { userId: string | undefined }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["saved_routes", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_routes" as any)
        .select("id,name,waypoints,distance_m,duration_s,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown) as Array<{
        id: string;
        name: string;
        waypoints: Array<{ label: string; lat: number; lng: number }>;
        distance_m: number | null;
        duration_s: number | null;
        updated_at: string;
      }>;
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_routes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved_routes"] });
      toast.success("Route verwijderd");
    },
  });
  return (
    <>
      <div className="mb-2 mt-6 flex items-center justify-between">
        <h2 className="text-base font-semibold">Opgeslagen routes</h2>
        <Link to="/routeplanner" className="text-xs text-primary hover:underline">Naar planner</Link>
      </div>
      {q.isLoading ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Laden…</div>
      ) : !q.data || q.data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nog geen opgeslagen routes. Ga naar de Routeplanner om er één te maken.
        </div>
      ) : (
        <div className="space-y-2">
          {q.data.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <RouteIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.waypoints.length} punten
                    {r.distance_m ? ` · ${formatDistance(r.distance_m)}` : ""}
                    {r.duration_s ? ` · ${fmtDur(r.duration_s)}` : ""}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Route "${r.name}" verwijderen?`)) del.mutate(r.id); }} aria-label="Verwijder route">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
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

// Silence unused import lint
void useNavigate;
