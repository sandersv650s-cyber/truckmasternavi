import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Sparkles, Shield, Users, Wrench, Building2 } from "lucide-react";
import { APP_VERSION, APP_RELEASE_DATE } from "@/lib/app-info";

export const Route = createFileRoute("/over")({
  head: () => ({
    meta: [
      { title: "Over TruckMate Demo v1.0" },
      { name: "description", content: "TruckMate Demo v1.0 — alle gegevens en koppelingen zijn gesimuleerd." },
      { property: "og:title", content: "Over TruckMate Demo v1.0" },
      { property: "og:description", content: "De mobiele app voor vrachtwagenchauffeurs en transportbedrijven." },
    ],
  }),
  component: OverPage,
});

function OverPage() {
  const pillars = [
    { icon: <Sparkles className="h-5 w-5" />, title: "Slim onderweg", desc: "Truckparkings, dieselprijzen, voorzieningen en meldingen op één plek." },
    { icon: <Users className="h-5 w-5" />, title: "Community-gedreven", desc: "Chauffeurs helpen elkaar met live info, reviews en groepen." },
    { icon: <Wrench className="h-5 w-5" />, title: "Papierloos", desc: "Onderhoudslogboek en documentenkluis voor CMR, ADR en vrachtbrieven." },
    { icon: <Building2 className="h-5 w-5" />, title: "Ook voor fleets", desc: "Dashboard voor transportbedrijven met voertuigen, chauffeurs en KPI's." },
    { icon: <Shield className="h-5 w-5" />, title: "Privacy eerst", desc: "Alle locatie- en voertuigdata staat standaard uit — jij bepaalt." },
  ];
  return (
    <AppShell title="Over TruckMate">
      <Card className="mb-4 overflow-hidden border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="p-5 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/20 text-primary">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black">TruckMate</h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Badge className="bg-primary/20 text-primary">Demo v{APP_VERSION}</Badge>
            <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-300">
              Investeerdersdemo
            </Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            TruckMate Demo v1.0 — de mobiele app voor vrachtwagenchauffeurs en transportbedrijven.
            Alle getoonde gegevens, ritten, kaarten en koppelingen (navigatie, tachograaf, OBD, betalingen)
            zijn in deze demo gesimuleerd.
          </p>
        </CardContent>
      </Card>

      <div className="mb-4 space-y-2">
        {pillars.map((p) => (
          <Card key={p.title}>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                {p.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="space-y-2 p-4 text-xs text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Uitgave:</span> {APP_RELEASE_DATE}
          </p>
          <p>
            <span className="font-semibold text-foreground">Status:</span> Klikbare prototype-demo.
            Voertuigkoppeling, tachograaf, offline kaarten en betalingen zijn nog niet actief en
            worden duidelijk als "Demo" of "Binnenkort" gelabeld.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Link to="/release-notes"><Button variant="secondary" className="w-full">Release notes</Button></Link>
        <Link to="/contact"><Button variant="secondary" className="w-full">Contact</Button></Link>
        <Link to="/privacybeleid"><Button variant="ghost" size="sm" className="w-full">Privacybeleid</Button></Link>
        <Link to="/voorwaarden"><Button variant="ghost" size="sm" className="w-full">Voorwaarden</Button></Link>
      </div>
    </AppShell>
  );
}
