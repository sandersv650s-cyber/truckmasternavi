import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bluetooth, Cpu, Radio, ClipboardList, CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/voertuig")({
  head: () => ({
    meta: [
      { title: "Voertuig — Binnenkort — TruckMate" },
      { name: "description", content: "Bluetooth/OBD-II koppeling komt in een volgende versie." },
      { property: "og:title", content: "Voertuig — Binnenkort" },
      { property: "og:description", content: "Live voertuigdata via adapters volgt later." },
    ],
  }),
  component: VoertuigSoonPage,
});

function VoertuigSoonPage() {
  const features = [
    { icon: <Bluetooth className="h-5 w-5" />, title: "Bluetooth-koppeling", desc: "OBD-II, J1939 en FMS adapters." },
    { icon: <Cpu className="h-5 w-5" />, title: "Live telemetrie", desc: "Snelheid, toerental, verbruik en temperatuur." },
    { icon: <Radio className="h-5 w-5" />, title: "Diagnose-codes", desc: "Foutcodes uitlezen met duidelijke uitleg." },
    { icon: <ClipboardList className="h-5 w-5" />, title: "Automatisch ritlog", desc: "Ritten worden automatisch aangevuld met echte data." },
  ];

  const matrix: { proto: string; desc: string; support: "gepland" | "beta" | "later" }[] = [
    { proto: "OBD-II (ELM327)", desc: "Bestelauto's / lichte trucks", support: "beta" },
    { proto: "J1939 (heavy duty)", desc: "Trucks Volvo / DAF / Scania / MAN", support: "gepland" },
    { proto: "FMS (Fleet Management)", desc: "Fleet-standaard, read-only", support: "gepland" },
    { proto: "Bluetooth LE", desc: "Draadloze adapters van 3e generatie", support: "gepland" },
    { proto: "CAN (rechtstreeks)", desc: "Alleen via gecertificeerde bridges", support: "later" },
  ];

  const dataTypes = [
    "Snelheid & toerental", "Brandstofverbruik (l/100km)", "Motortemperatuur", "AdBlue-niveau",
    "Kilometerstand", "DTC-foutcodes", "Turbodruk", "Remboosterdruk",
  ];

  return (
    <AppShell title="Voertuig">
      <Card className="mb-6 overflow-hidden border-primary/40 bg-gradient-to-br from-primary/25 via-card to-card">
        <CardContent className="p-6 text-center">
          <Badge className="mb-3 bg-primary/30 text-primary">Binnenkort</Badge>
          <h1 className="text-2xl font-black">Voertuigkoppeling</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We werken aan een veilige Bluetooth-integratie met OBD-II, J1939 en FMS adapters.
            Zodra de bridge-app klaar is, komt live voertuigdata hier vanzelf binnen.
          </p>
          <Badge variant="outline" className="mt-3 border-muted text-[10px]">Adapter-status: geen adapter gedetecteerd</Badge>
        </CardContent>
      </Card>

      <Alert className="mb-4">
        <AlertDescription className="text-[11px]">
          Geen hardware-claims: TruckMate leest zelf nog geen voertuigdata. Getoonde protocollen en datatypes zijn een roadmap.
        </AlertDescription>
      </Alert>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Wat komt er</h2>
      <div className="mb-6 grid grid-cols-1 gap-2">
        {features.map((f) => (
          <Card key={f.title}><CardContent className="flex items-start gap-3 p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-background/60 text-primary">{f.icon}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Compatibiliteitsmatrix</h2>
      <Card className="mb-6"><CardContent className="p-0">
        <ul className="divide-y divide-border">
          {matrix.map((m) => {
            const meta = m.support === "beta"
              ? { label: "In beta-test", color: "bg-emerald-500/20 text-emerald-300" }
              : m.support === "gepland"
                ? { label: "Gepland", color: "bg-primary/20 text-primary" }
                : { label: "Later", color: "bg-muted text-muted-foreground" };
            return (
              <li key={m.proto} className="flex items-center gap-3 p-3">
                <Bluetooth className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.proto}</p>
                  <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                </div>
                <Badge className={`shrink-0 text-[10px] ${meta.color}`}>{meta.label}</Badge>
              </li>
            );
          })}
        </ul>
      </CardContent></Card>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Ondersteunde datatypes</h2>
      <Card className="mb-6"><CardContent className="grid grid-cols-2 gap-1 p-3">
        {dataTypes.map((d, i) => (
          <div key={d} className="flex items-center gap-2 text-[11px]">
            {i < 2 ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Circle className="h-3 w-3 text-muted-foreground" />}
            {d}
          </div>
        ))}
      </CardContent></Card>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Tip: gebruik intussen de handmatige ritregistratie en tank-invoer bij Ritten.
      </p>
    </AppShell>
  );
}