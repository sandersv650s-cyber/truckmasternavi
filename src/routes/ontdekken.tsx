import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParkingSquare, Fuel, Megaphone, ChevronRight } from "lucide-react";
import { truckstops, fuelStations, initialAlerts } from "@/lib/discover-data";

export const Route = createFileRoute("/ontdekken")({
  head: () => ({
    meta: [
      { title: "Ontdekken — TruckMate" },
      {
        name: "description",
        content:
          "Vind truckstops, dieselprijzen, voorzieningen, communitymeldingen en beloningen op één plek.",
      },
      { property: "og:title", content: "Ontdekken — TruckMate" },
      {
        property: "og:description",
        content: "Alles voor onderweg: parking, brandstof, meldingen en meer.",
      },
    ],
  }),
  component: OntdekkenPage,
});

function OntdekkenPage() {
  const totalFree = truckstops.reduce((s, t) => s + t.freeSpots, 0);
  const cheapest = [...fuelStations].sort((a, b) => a.dieselPrice - b.dieselPrice)[0];
  const activeAlerts = initialAlerts.length;

  const cats: {
    to: "/truckstops" | "/brandstof" | "/meldingen";
    icon: React.ReactNode;
    title: string;
    desc: string;
    accent: string;
    hint: string;
  }[] = [
    {
      to: "/truckstops",
      icon: <ParkingSquare className="h-6 w-6" />,
      title: "Truckstops & parking",
      desc: "Veilige parkings, douches en meer, met live bezetting.",
      accent: "from-primary/25 to-primary/5",
      hint: `${totalFree} plekken vrij nu`,
    },
    {
      to: "/brandstof",
      icon: <Fuel className="h-6 w-6" />,
      title: "Dieselprijzen",
      desc: "Tankstations langs je route met AdBlue en truck-support.",
      accent: "from-amber-500/25 to-amber-500/5",
      hint: `Goedkoopst € ${cheapest.dieselPrice.toFixed(3)} — ${cheapest.city}`,
    },
    {
      to: "/meldingen",
      icon: <Megaphone className="h-6 w-6" />,
      title: "Meldingen onderweg",
      desc: "File, controle, wegwerk of vrije parkeerplek — deel & bevestig.",
      accent: "from-orange-500/25 to-orange-500/5",
      hint: `${activeAlerts} actieve meldingen`,
    },
  ];

  return (
    <AppShell title="Ontdekken">
      <p className="mb-4 text-sm text-muted-foreground">
        Alles wat je onderweg nodig hebt, in één overzicht.
      </p>

      <div className="mb-6 space-y-3">
        {cats.map((c) => (
          <Link key={c.to} to={c.to} className="block">
            <Card className={`overflow-hidden bg-gradient-to-br ${c.accent} border-border/60 transition hover:border-primary/60`}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-background/60 text-primary">
                  {c.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{c.desc}</p>
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    {c.hint}
                  </Badge>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

    </AppShell>
  );
}