import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Fuel, Gauge, MapPin, Pause } from "lucide-react";
import { rideById, formatDate, formatDuration } from "@/lib/mock-data";
import type { Ride } from "@/lib/mock-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/ritten/$rideId")({
  head: ({ params }) => ({
    meta: [
      { title: `Rit ${params.rideId} — TruckMate` },
      { name: "description", content: "Ritdetails met snelheid, verbruik en samenvatting." },
      { property: "og:title", content: `Rit ${params.rideId} — TruckMate` },
      { property: "og:description", content: "Bekijk je ritdetails in TruckMate." },
    ],
  }),
  loader: ({ params }): Ride => {
    const ride = rideById(params.rideId);
    if (!ride) throw notFound();
    return ride;
  },
  notFoundComponent: () => (
    <AppShell title="Rit niet gevonden">
      <p className="text-sm text-muted-foreground">Deze rit bestaat niet.</p>
      <Link to="/ritten" className="mt-3 inline-block text-sm text-primary underline">
        Terug naar ritten
      </Link>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell title="Fout">
      <p className="text-sm text-destructive">{error.message}</p>
    </AppShell>
  ),
  component: RideDetail,
});

function RideDetail() {
  const ride = Route.useLoaderData();

  return (
    <AppShell
      title="Ritdetails"
      action={
        <Link to="/ritten">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Terug
          </Button>
        </Link>
      }
    >
      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="truncate font-semibold">{ride.from}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-destructive" />
            <span className="truncate font-semibold">{ride.to}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{formatDate(ride.date)}</p>
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Stat icon={<MapPin />} label="Afstand" value={`${ride.km} km`} />
        <Stat icon={<Clock />} label="Rijtijd" value={formatDuration(ride.durationMin)} />
        <Stat icon={<Pause />} label="Stilstand" value={formatDuration(ride.idleMin)} />
        <Stat icon={<Gauge />} label="Gem/Max" value={`${ride.avgSpeed}/${ride.maxSpeed} km/u`} />
        <Stat icon={<Fuel />} label="Verbruikt" value={`${ride.liters} L`} />
        <Stat icon={<Fuel />} label="l/100 km" value={`${ride.l100}`} />
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Snelheid</CardTitle>
        </CardHeader>
        <CardContent className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ride.points}>
              <CartesianGrid stroke="oklch(0.3 0.03 252)" strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke="oklch(0.6 0.02 250)" fontSize={10} />
              <YAxis stroke="oklch(0.6 0.02 250)" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.24 0.035 252)",
                  border: "1px solid oklch(0.32 0.03 252)",
                  borderRadius: 8,
                }}
              />
              <Line type="monotone" dataKey="speed" stroke="oklch(0.72 0.17 55)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Brandstofverbruik (l/100)</CardTitle>
        </CardHeader>
        <CardContent className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ride.points}>
              <CartesianGrid stroke="oklch(0.3 0.03 252)" strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke="oklch(0.6 0.02 250)" fontSize={10} />
              <YAxis stroke="oklch(0.6 0.02 250)" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.24 0.035 252)",
                  border: "1px solid oklch(0.32 0.03 252)",
                  borderRadius: 8,
                }}
              />
              <Line type="monotone" dataKey="fuel" stroke="oklch(0.7 0.16 155)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground [&>svg]:h-3 [&>svg]:w-3">
          {icon}
          <span>{label}</span>
        </div>
        <p className="font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
