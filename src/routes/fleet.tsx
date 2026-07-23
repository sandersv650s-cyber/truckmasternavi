import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Truck,
  Users,
  Fuel,
  Wrench,
  MapPin,
  Leaf,
  AlertTriangle,
  Info,
  TrendingDown,
  FileDown,
  Building2,
} from "lucide-react";
import { fleetVehicles, fleetDrivers, fleetKPIs, fleetAlerts, driverById, driverAvatar } from "@/lib/fleet-data";
import { useRole, roleMeta } from "@/lib/role";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/fleet")({
  head: () => ({
    meta: [
      { title: "Fleet dashboard — TruckMate" },
      { name: "description", content: "Overzicht van voertuigen, chauffeurs en KPI's voor transportbedrijven." },
      { property: "og:title", content: "Fleet dashboard — TruckMate" },
      { property: "og:description", content: "Voertuigen, chauffeurs, brandstof en onderhoud in één blik." },
    ],
  }),
  component: FleetPage,
});

function FleetPage() {
  const { role, setRole } = useRole();

  return (
    <AppShell title="Fleet dashboard">
      <Card className="mb-4">
        <CardContent className="flex items-center gap-3 p-3">
          <Building2 className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Actieve rol</p>
            <p className="truncate text-sm font-semibold">{roleMeta[role].emoji} {roleMeta[role].label}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRole(role === "fleet" ? "chauffeur" : "fleet")}
          >
            Wissel naar {role === "fleet" ? "Chauffeur" : "Fleetbeheerder"}
          </Button>
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <KPI icon={<Truck className="h-4 w-4" />} label="Voertuigen" value={`${fleetKPIs.vehicles}`} sub={`${fleetKPIs.onRoad} onderweg`} />
        <KPI icon={<Users className="h-4 w-4" />} label="Chauffeurs" value={`${fleetDrivers.length}`} sub={`${fleetDrivers.filter(d => d.status === "rijdt").length} actief`} />
        <KPI icon={<Wrench className="h-4 w-4" />} label="Onderhoud" value={`${fleetKPIs.serviceAlerts}`} sub="urgent" tone={fleetKPIs.serviceAlerts > 0 ? "warn" : "ok"} />
        <KPI icon={<Fuel className="h-4 w-4" />} label="Gem. tank" value={`${fleetKPIs.avgFuel}%`} sub="brandstof" />
        <KPI icon={<Leaf className="h-4 w-4" />} label="Eco score" value={`${fleetKPIs.avgEco}`} sub="team gemiddeld" tone="ok" />
        <KPI icon={<TrendingDown className="h-4 w-4" />} label="€/km" value={`€ ${fleetKPIs.costPerKm}`} sub="week" />
      </div>

      <h2 className="mb-2 text-sm font-semibold">Meldingen</h2>
      <div className="mb-5 space-y-2">
        {fleetAlerts.map((a) => {
          const meta = a.level === "urgent"
            ? { color: "border-destructive/60 bg-destructive/10 text-destructive", icon: <AlertTriangle className="h-4 w-4" /> }
            : a.level === "warn"
              ? { color: "border-amber-500/60 bg-amber-500/10 text-amber-300", icon: <AlertTriangle className="h-4 w-4" /> }
              : { color: "border-border bg-card text-muted-foreground", icon: <Info className="h-4 w-4" /> };
          return (
            <div key={a.id} className={`flex items-start gap-3 rounded-lg border p-3 ${meta.color}`}>
              <div className="mt-0.5 shrink-0">{meta.icon}</div>
              <p className="text-xs">{a.text}</p>
              <span className="ml-auto shrink-0 text-[10px] opacity-70">{a.minAgo}m</span>
            </div>
          );
        })}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Voertuigen</h2>
        <span className="text-[10px] text-muted-foreground">Live posities zijn mock-data</span>
      </div>
      <div className="mb-5 space-y-2">
        {fleetVehicles.map((v) => {
          const drv = driverById(v.driverId);
          const statusColor: Record<typeof v.status, string> = {
            onderweg: "bg-emerald-500/20 text-emerald-300",
            geparkeerd: "bg-sky-500/20 text-sky-300",
            onderhoud: "bg-destructive/20 text-destructive",
            beschikbaar: "bg-muted text-muted-foreground",
          };
          return (
            <Card key={v.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-background/60 text-primary">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{v.model}</p>
                      <Badge className={`text-[10px] ${statusColor[v.status]}`}>{v.status}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{v.plate}</p>
                  </div>
                  {v.serviceUrgent && <Wrench className="h-4 w-4 shrink-0 text-destructive" />}
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex min-w-0 items-center gap-1 truncate">
                    <MapPin className="h-3 w-3" /> {v.location}
                    {v.destination && <> → {v.destination}</>}
                    {v.etaMin !== undefined && <> ({Math.floor(v.etaMin / 60)}u{v.etaMin % 60})</>}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Brandstof</span>
                      <span className="tabular-nums">{v.fuelPct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full ${v.fuelPct < 30 ? "bg-destructive" : v.fuelPct < 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${v.fuelPct}%` }} />
                    </div>
                  </div>
                  {drv ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={driverAvatar(drv.avatarSeed)} alt="" />
                        <AvatarFallback>{drv.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-[11px]">{drv.name.split(" ")[0]}</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Geen chauffeur</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-2 text-sm font-semibold">Chauffeurs</h2>
      <div className="mb-5 space-y-2">
        {fleetDrivers.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={driverAvatar(d.avatarSeed)} alt="" />
                <AvatarFallback>{d.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{d.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {d.status === "rijdt" ? "Rijdt nu" : d.status === "pauze" ? "Op pauze" : "Off duty"} · rust {d.restHoursLeft}u
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-emerald-300 tabular-nums">{d.ecoScore}</p>
                <p className="text-[10px] text-muted-foreground">eco</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold">Rapporten</h2>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {[
          { title: "Weekrapport", value: `${fleetKPIs.weeklyKm.toLocaleString("nl-NL")} km` },
          { title: "Brandstof week", value: `${fleetKPIs.weeklyLiters.toLocaleString("nl-NL")} L` },
          { title: "Rijtijden", value: "Binnen norm" },
          { title: "Incidenten", value: "0 deze week" },
        ].map((r) => (
          <Card key={r.title}>
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.title}</p>
              <p className="mt-1 text-lg font-black">{r.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button variant="secondary" className="w-full">
        <FileDown className="mr-2 h-4 w-4" /> Exporteer rapport (demo)
      </Button>

      <Alert className="mt-4">
        <AlertDescription className="text-[11px]">
          Deze weergave is een demo met fictieve fleetdata. Koppel later een tachograaf of TMS via <b>Integraties</b> voor live data.
        </AlertDescription>
      </Alert>
    </AppShell>
  );
}

function KPI({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: "ok" | "warn" }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest ${tone === "warn" ? "text-destructive" : tone === "ok" ? "text-emerald-300" : "text-muted-foreground"}`}>
          {icon}{label}
        </div>
        <p className="mt-1 text-lg font-black tabular-nums">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}