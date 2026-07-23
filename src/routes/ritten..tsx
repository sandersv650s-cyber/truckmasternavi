import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Fuel, Gauge, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDuration, type Ride } from "@/lib/queries";

export const Route = createFileRoute("/ritten/$rideId")({
  head: ({ params }) => ({
    meta: [
      { title: `Rit — TruckMate` },
      { name: "description", content: "Ritdetails met snelheid, verbruik en samenvatting." },
      { property: "og:title", content: `Rit — TruckMate` },
      { property: "og:description", content: "Bekijk je ritdetails in TruckMate." },
    ],
    ...(params ? {} : {}),
  }),
  notFoundComponent: () => (
    <AppShell title="Rit niet gevonden">
      <p className="text-sm text-muted-foreground">Deze rit bestaat niet of hoort niet bij jouw account.</p>
      <Link to="/ritten" className="mt-3 inline-block text-sm text-primary underline">Terug naar ritten</Link>
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
  const { rideId } = Route.useParams();
  const q = useQuery({
    queryKey: ["ride", rideId],
    queryFn: async () => {
      const { data, error } = await supabase.from("rides").select("*").eq("id", rideId).maybeSingle();
      if (error) throw error;
      return data as Ride | null;
    },
  });

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
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : !q.data ? (
        <p className="text-sm text-muted-foreground">Rit niet gevonden.</p>
      ) : (
        <>
          <Card className="mb-4">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="truncate font-semibold">{q.data.from_location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-destructive" />
                <span className="truncate font-semibold">{q.data.to_location}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(q.data.started_at)}</p>
              {q.data.notes && <p className="mt-2 text-sm">{q.data.notes}</p>}
            </CardContent>
          </Card>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <Stat icon={<MapPin />} label="Afstand" value={`${Number(q.data.km).toFixed(1)} km`} />
            <Stat icon={<Clock />} label="Rijtijd" value={formatDuration(q.data.duration_min)} />
            {q.data.avg_speed != null && <Stat icon={<Gauge />} label="Gemiddeld" value={`${Math.round(Number(q.data.avg_speed))} km/u`} />}
            {q.data.max_speed != null && <Stat icon={<Gauge />} label="Maximum" value={`${Math.round(Number(q.data.max_speed))} km/u`} />}
            {q.data.liters != null && <Stat icon={<Fuel />} label="Verbruikt" value={`${Number(q.data.liters).toFixed(1)} L`} />}
            {q.data.l100 != null && <Stat icon={<Fuel />} label="l/100 km" value={`${Number(q.data.l100).toFixed(1)}`} />}
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Telemetrie is gesimuleerd zolang truck-Bluetooth/OBD niet ondersteund is in web/PWA.
          </p>
        </>
      )}
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
