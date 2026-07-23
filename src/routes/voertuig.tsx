import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bluetooth, BluetoothSearching, CheckCircle2, Info, Gauge, Fuel, Thermometer, Zap } from "lucide-react";

export const Route = createFileRoute("/voertuig")({
  head: () => ({
    meta: [
      { title: "Voertuig & Bluetooth — TruckMate" },
      { name: "description", content: "Verbind een OBD-II/J1939/FMS adapter en bekijk live voertuigdata." },
      { property: "og:title", content: "Voertuig — TruckMate" },
      { property: "og:description", content: "Live voertuigdata via adapters." },
    ],
  }),
  component: VoertuigPage,
});

const adapters = [
  { id: "a1", name: "Veepeak OBDCheck BLE+", protocol: "OBD-II", compat: "Volledig" },
  { id: "a2", name: "TEXA Bridge J1939", protocol: "J1939", compat: "Volledig" },
  { id: "a3", name: "FMS Gateway Pro", protocol: "FMS", compat: "Gedeeltelijk" },
  { id: "a4", name: "Onbekend ELM327", protocol: "OBD-II", compat: "Beperkt" },
];

function VoertuigPage() {
  const [scanning, setScanning] = useState(false);
  const [connectedId, setConnectedId] = useState<string | null>("a2");

  return (
    <AppShell title="Voertuig">
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm">Demo-modus</AlertTitle>
        <AlertDescription className="text-xs">
          Echte Bluetooth-hardware wordt later toegevoegd via native integratie of een bridge-app.
          Waarden hieronder zijn simulatie.
        </AlertDescription>
      </Alert>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Bluetooth className="h-4 w-4 text-primary" />
              Adapters
            </span>
            <Button size="sm" variant="secondary" onClick={() => setScanning((s) => !s)}>
              <BluetoothSearching className="mr-1 h-4 w-4" />
              {scanning ? "Stop" : "Scan"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {adapters.map((a) => {
            const isConn = connectedId === a.id;
            return (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {a.protocol}
                    </Badge>
                    <Badge
                      className={`text-[10px] ${
                        a.compat === "Volledig"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : a.compat === "Gedeeltelijk"
                          ? "bg-yellow-500/20 text-yellow-200"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {a.compat}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isConn ? "default" : "secondary"}
                  onClick={() => setConnectedId(isConn ? null : a.id)}
                >
                  {isConn ? (
                    <>
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Verbonden
                    </>
                  ) : (
                    "Verbinden"
                  )}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Live voertuigdata</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Metric icon={<Gauge />} label="Snelheid" value="72" unit="km/u" />
          <Metric icon={<Zap />} label="Toerental" value="1350" unit="rpm" />
          <Metric icon={<Thermometer />} label="Motortemp" value="88" unit="°C" />
          <Metric icon={<Fuel />} label="Brandstofflow" value="21.4" unit="L/u" />
          <div className="col-span-2 rounded-lg border border-border p-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Fuel className="h-3.5 w-3.5" /> Brandstofniveau
              </span>
              <span className="font-semibold text-foreground">68%</span>
            </div>
            <Progress value={68} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Metric({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground [&>svg]:h-3 [&>svg]:w-3">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums">
        {value}
        <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}