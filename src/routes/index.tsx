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
  Bluetooth,
  Settings,
  ArrowRight,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { currentUser, rides, posts, userById, formatDate, formatDuration } from "@/lib/mock-data";

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
            <Stat icon={<Bluetooth className="h-4 w-4" />} label="OBD" value="Verbonden" />
          </div>
          <Link to="/ritten">
            <Button size="lg" className="h-14 w-full text-base font-bold">
              <Play className="mr-2 h-5 w-5 fill-current" /> Start rit
            </Button>
          </Link>
        </CardContent>
      </Card>

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
            <Bluetooth className="mr-2 h-4 w-4" /> Voertuig
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