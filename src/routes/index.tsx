import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Truck, Play, Fuel, Gauge, Trophy, Settings, ArrowRight, MapPin, MessageCircle,
  Map as MapIcon, Search, Megaphone, LayoutGrid, Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchProfile, formatDate, formatDuration, initials, type Ride } from "@/lib/queries";
import { alertMeta, fuelStations, flag, type AlertCategory } from "@/lib/discover-data";
import { useRole } from "@/lib/role";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TruckMate" },
      { name: "description", content: "Start een rit, bekijk je verbruik en volg de community in TruckMate." },
      { property: "og:title", content: "Dashboard — TruckMate" },
      { property: "og:description", content: "Alles wat een chauffeur nodig heeft in één app." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const profileQ = useQuery({ queryKey: ["profile", user?.id], enabled: !!user, queryFn: () => fetchProfile(user!.id) });
  const ridesQ = useQuery({
    queryKey: ["rides", "recent", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides").select("*").eq("user_id", user!.id).eq("status", "completed")
        .order("started_at", { ascending: false }).limit(5);
      if (error) throw error;
      return (data ?? []) as Ride[];
    },
  });
  const trendingQ = useQuery({
    queryKey: ["alerts", "trending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("id, category, location, text, confirms_count, created_at, expires_at")
        .gt("expires_at", new Date().toISOString())
        .order("confirms_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data ?? []) as { id: string; category: AlertCategory; location: string; text: string; confirms_count: number; created_at: string; expires_at: string }[];
    },
  });

  const rides = ridesQ.data ?? [];
  const totalKm = rides.reduce((s, r) => s + Number(r.km || 0), 0);
  const l100s = rides.map((r) => r.l100).filter((v): v is number => v != null).map(Number);
  const avgL100 = l100s.length ? (l100s.reduce((a, b) => a + b, 0) / l100s.length).toFixed(1) : "—";
  const trending = trendingQ.data ?? [];
  const cheapestFuel = [...fuelStations].sort((a, b) => a.dieselPrice - b.dieselPrice)[0];
  const { role } = useRole();
  const displayName = profileQ.data?.full_name || user?.email?.split("@")[0] || "Chauffeur";

  return (
    <AppShell>
      {role === "fleet" && (
        <Link to="/fleet" className="mb-4 block">
          <Card className="border-primary/50 bg-gradient-to-br from-primary/20 via-card to-card">
            <CardContent className="flex items-center gap-3 p-3">
              <Building2 className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Fleet dashboard</p>
                <p className="text-[11px] text-muted-foreground">Voertuigen, chauffeurs en KPI's</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
            </CardContent>
          </Card>
        </Link>
      )}

      <section className="mb-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Welkom terug</p>
            <h1 className="truncate text-2xl font-bold">{displayName}</h1>
          </div>
          <Link to="/profiel">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/40">
              {profileQ.data?.avatar_url && <AvatarImage src={profileQ.data.avatar_url} alt="" />}
              <AvatarFallback>{initials(displayName)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </section>

      <Card className="mb-4 overflow-hidden border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Voertuig</p>
              <p className="truncate font-semibold">{profileQ.data?.truck || "Nog niet ingesteld"}</p>
            </div>
            <Badge className="shrink-0 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/25">Klaar</Badge>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <Stat icon={<Gauge className="h-4 w-4" />} label="Totaal km" value={totalKm > 0 ? totalKm.toFixed(0) : "—"} />
            <Stat icon={<Fuel className="h-4 w-4" />} label="Gem. l/100" value={avgL100} />
            <Stat icon={<Trophy className="h-4 w-4" />} label="Ritten" value={`${rides.length}`} />
          </div>
          <Link to="/ritten">
            <Button size="lg" className="h-14 w-full text-base font-bold">
              <Play className="mr-2 h-5 w-5 fill-current" /> Start rit
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="mb-5 grid grid-cols-5 gap-2">
        <QuickAction to="/kaart" icon={<MapIcon className="h-5 w-5" />} label="Kaart" />
        <QuickAction to="/zoeken" icon={<Search className="h-5 w-5" />} label="Zoeken" />
        <QuickAction to="/community" icon={<MessageCircle className="h-5 w-5" />} label="Feed" />
        <QuickAction to="/meldingen" icon={<Megaphone className="h-5 w-5" />} label="Meld" />
        <QuickAction to="/meer" icon={<LayoutGrid className="h-5 w-5" />} label="Meer" />
      </div>

      {trending.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Trending meldingen</h2>
            <Link to="/meldingen" className="text-xs font-medium text-primary hover:underline">
              Alle <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          </div>
          <div className="mb-5 space-y-2">
            {trending.map((a) => {
              const meta = alertMeta[a.category];
              const mins = Math.max(0, Math.floor((Date.now() - new Date(a.created_at).getTime()) / 60000));
              const ago = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}u`;
              return (
                <Link key={a.id} to="/meldingen">
                  <Card className="transition hover:border-primary/60">
                    <CardContent className="flex items-start gap-3 p-3">
                      <div className={`shrink-0 rounded-lg border px-2 py-1 text-lg ${meta.color}`}>{meta.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={`${meta.color} border text-[10px]`}>{meta.label}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {ago} · {a.confirms_count}× bevestigd
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs font-medium">{a.location}</p>
                        <p className="line-clamp-2 text-[11px] text-muted-foreground">{a.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <Link to="/brandstof" className="mb-5 block">
        <Card className="border-amber-500/40 bg-amber-500/5 transition hover:border-amber-500/70">
          <CardContent className="flex items-center gap-3 p-3">
            <Fuel className="h-5 w-5 shrink-0 text-amber-300" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-300">Goedkoopste diesel</p>
              <p className="truncate text-sm">{flag(cheapestFuel.country)} {cheapestFuel.name}</p>
            </div>
            <p className="shrink-0 text-lg font-black">€ {cheapestFuel.dieselPrice.toFixed(3)}<span className="text-[10px] font-normal text-muted-foreground">/L</span></p>
          </CardContent>
        </Card>
      </Link>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Recente ritten</h2>
        <Link to="/ritten" className="text-xs font-medium text-primary hover:underline">Alles bekijken</Link>
      </div>
      {ridesQ.isLoading ? (
        <div className="mb-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Laden…</div>
      ) : rides.length === 0 ? (
        <div className="mb-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nog geen ritten. <Link to="/ritten" className="text-primary underline">Start je eerste rit</Link>.
        </div>
      ) : (
        <div className="mb-6 space-y-2">
          {rides.slice(0, 3).map((r) => (
            <Link key={r.id} to="/ritten/$rideId" params={{ rideId: r.id }}>
              <Card className="transition hover:border-primary/60">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{r.from_location} → {r.to_location}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(r.started_at)} · {formatDuration(r.duration_min)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold">{Number(r.km).toFixed(0)} km</p>
                    {r.l100 != null && <p className="text-[11px] text-muted-foreground">{Number(r.l100).toFixed(1)} l/100</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader className="pb-2"><CardTitle className="text-base">Community</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-muted-foreground">Bekijk de laatste berichten van andere chauffeurs.</p>
          <Link to="/community"><Button variant="secondary" className="w-full">Open feed <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-2">
        <Link to="/voertuig" className="flex-1">
          <Button variant="secondary" className="w-full"><Truck className="mr-2 h-4 w-4" /> Voertuig</Button>
        </Link>
        <Link to="/instellingen" className="flex-1">
          <Button variant="secondary" className="w-full"><Settings className="mr-2 h-4 w-4" /> Instellingen</Button>
        </Link>
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/60 p-2">
      <div className="mb-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function QuickAction({
  to, icon, label,
}: {
  to: "/kaart" | "/zoeken" | "/community" | "/meldingen" | "/meer";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link to={to} className="block">
      <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card/60 py-3 text-xs font-medium transition hover:border-primary/60 hover:bg-primary/10">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
    </Link>
  );
}
