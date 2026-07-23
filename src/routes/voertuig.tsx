import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bluetooth, Cpu, Radio, ClipboardList } from "lucide-react";

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
        </CardContent>
      </Card>
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Wat komt er</h2>
      <div className="grid grid-cols-1 gap-2">
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
      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Tip: gebruik intussen de handmatige ritregistratie en tank-invoer bij Ritten.
      </p>
    </AppShell>
  );
}