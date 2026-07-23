import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Truck,
  Play,
  Fuel,
  Gauge,
  Trophy,
  Settings,
  ArrowRight,
  MapPin,
  MessageCircle,
  Map as MapIcon,
  Search,
  Compass,
  Megaphone,
  ParkingSquare,
  Heart,
  Star,
} from "lucide-react";
import { currentUser, rides, posts, userById, formatDate, formatDuration } from "@/lib/mock-data";
import {
  trendingAlerts,
  alertMeta,
  minAgoLabel,
  fuelStations,
  truckstops,
  occupancyMeta,
  flag,
} from "@/lib/discover-data";
import { leaderboard } from "@/lib/discover-data";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TruckMate" },
      {
        name: "description",
        content: "Bekijk je voertuigstatus, start een rit en volg je verbruik in TruckMate.",
      },
      { property: "og:title", content: "Dashboard — TruckMate" },
      {
        property: "og:description",
        content: "Alles wat een chauffeur nodig heeft: status, ritten, community en meer.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const totalKm = rides.reduce((s, r) => s + r.km, 0);
  const avgL100 = (rides.reduce((s, r) => s + r.l100, 0) / rides.length).toFixed(1);
  const recent = rides.slice(0, 2);
  const feed = posts.slice(0, 2);
  const trending = trendingAlerts(3);
  const cheapestFuel = [...fuelStations].sort((a, b) => a.dieselPrice - b.dieselPrice)[0];
  const { ids: favParkingIds } = useFavorites("truckstops");
  const favParkings = truckstops.filter((t) => favParkingIds.includes(t.id)).slice(0, 3);
  const myPoints = leaderboard.find((l) => l.userId === currentUser.id)?.points ?? 1980;

  return (
    <AppShell>
      <section className="mb-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Welkom terug</p>
            <h1 className="truncate text-2xl font-bold">{currentUser.name}</h1>
          </div>
          <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/40">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>JV</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <Card className="mb-4 overflow-hidden border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Actief voertuig</p>
              <p className="truncate font-semibold">{currentUser.truck}</p>
            </div>
            <Badge className="shrink-0 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/25">
              Klaar
            </Badge>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <Stat icon={<Gauge className="h-4 w-4" />} label="Totaal km" value={`${totalKm}`} />
            <Stat icon={<Fuel className="h-4 w-4" />} label="Gem. l/100" value={avgL100} />
            <Stat icon={<Trophy className="h-4 w-4" />} label="Punten" value={`${myPoints}`} />
          </div>
          <Link to="/ritten">
            <Button size="lg" className="h-14 w-full text-base font-bold">
              <Play className="mr-2 h-5 w-5 fill-current" /> Start rit
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="mb-5 grid grid-cols-4 gap-2">
        <QuickAction to="/kaart" icon={<MapIcon className="h-5 w-5" />} label="Kaart" />
        <QuickAction to="/zoeken" icon={<Search className="h-5 w-5" />} label="Zoeken" />
        <QuickAction to="/ontdekken" icon={<Compass className="h-5 w-5" />} label="Ontdek" />
        <QuickAction to="/meldingen" icon={<Megaphone className="h-5 w-5" />} label="Meld" />
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
              return (
                <Link key={a.id} to="/meldingen">
                  <Card className="transition hover:border-primary/60">
                    <CardContent className="flex items-start gap-3 p-3">
                      <div className={`shrink-0 rounded-lg border px-2 py-1 text-lg ${meta.color}`}>
                        {meta.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={`${meta.color} border text-[10px]`}>{meta.label}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {minAgoLabel(a.createdMinAgo)} · {a.confirms}× bevestigd
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

      <div className="mb-5 grid grid-cols-2 gap-2">
        <Link to="/brandstof">
          <Card className="h-full border-amber-500/40 bg-amber-500/5 transition hover:border-amber-500/70">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-amber-300">
                <Fuel className="h-3.5 w-3.5" /> Goedkoopst diesel
              </div>
              <p className="mt-1 text-lg font-black">€ {cheapestFuel.dieselPrice.toFixed(3)}<span className="text-[10px] font-normal text-muted-foreground">/L</span></p>
              <p className="truncate text-[11px] text-muted-foreground">
                {flag(cheapestFuel.country)} {cheapestFuel.name}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/beloningen">
          <Card className="h-full border-emerald-500/40 bg-emerald-500/5 transition hover:border-emerald-500/70">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
                <Trophy className="h-3.5 w-3.5" /> Jouw ranking
              </div>
              <p className="mt-1 text-lg font-black">
                #{Math.max(1, leaderboard.findIndex((l) => l.userId === currentUser.id) + 1)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">van {leaderboard.length}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">{myPoints} punten · 5 badges</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {favParkings.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              <Heart className="mr-1 inline h-4 w-4 fill-primary text-primary" />
              Favoriete parkings
            </h2>
            <Link to="/truckstops" className="text-xs font-medium text-primary hover:underline">
              Alle
            </Link>
          </div>
          <div className="mb-5 space-y-2">
            {favParkings.map((t) => (
              <Link key={t.id} to="/truckstops/$id" params={{ id: t.id }}>
                <Card className="transition hover:border-primary/60">
                  <CardContent className="flex items-center gap-3 p-3">
                    <ParkingSquare className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{flag(t.country)} {t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.road} · {t.city}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${occupancyMeta[t.occupancy].color}`}>
                      {t.freeSpots}
                    </span>
                    <span className="ml-1 flex shrink-0 items-center gap-0.5 text-[11px]">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {t.rating.toFixed(1)}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Recente ritten</h2>
        <Link to="/ritten" className="text-xs font-medium text-primary hover:underline">
          Alles bekijken
        </Link>
      </div>
      <div className="mb-6 space-y-2">
        {recent.map((r) => (
          <Link key={r.id} to="/ritten/$rideId" params={{ rideId: r.id }}>
            <Card className="transition hover:border-primary/60">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">
                      {r.from} → {r.to}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(r.date)} · {formatDuration(r.durationMin)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold">{r.km} km</p>
                  <p className="text-[11px] text-muted-foreground">{r.l100} l/100</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Verbruik deze week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-24">
            {[28, 31, 27, 30, 29, 32, 28].map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-primary/60 to-primary"
                style={{ height: `${(v / 35) * 100}%` }}
                title={`${v} l/100km`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Community updates</h2>
        <Link to="/community" className="text-xs font-medium text-primary hover:underline">
          Naar feed <ArrowRight className="ml-0.5 inline h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {feed.map((p) => {
          const u = userById(p.userId);
          return (
            <Card key={p.id}>
              <CardContent className="flex gap-3 p-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={u.avatar} alt={u.name} />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{p.text}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MessageCircle className="h-3 w-3" /> {p.comments.length} · ♥ {p.likes}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2">
        <Link to="/voertuig" className="flex-1">
          <Button variant="secondary" className="w-full">
            <Truck className="mr-2 h-4 w-4" /> Voertuig
          </Button>
        </Link>
        <Link to="/instellingen" className="flex-1">
          <Button variant="secondary" className="w-full">
            <Settings className="mr-2 h-4 w-4" /> Instellingen
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/60 p-2">
      <div className="mb-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  label,
}: {
  to: "/kaart" | "/zoeken" | "/ontdekken" | "/meldingen";
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