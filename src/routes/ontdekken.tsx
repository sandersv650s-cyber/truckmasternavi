import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParkingSquare, Fuel, Megaphone, Search, Trophy, ChevronRight, Map as MapIcon, Sparkles, LayoutGrid } from "lucide-react";
import { truckstops, fuelStations, initialAlerts, amenityCategoryMeta, type AmenityCategory } from "@/lib/discover-data";

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
    to: "/kaart" | "/zoeken" | "/assistent" | "/truckstops" | "/brandstof" | "/terminals" | "/konvooi" | "/meldingen" | "/voorzieningen" | "/beloningen" | "/meer";
    icon: React.ReactNode;
    title: string;
    desc: string;
    accent: string;
    hint: string;
  }[] = [
    {
      to: "/assistent",
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI-routeassistent",
      desc: "Vraag in gewone taal — krijg passende stops met uitleg.",
      accent: "from-primary/25 to-primary/5",
      hint: "Demo",
    },
    {
      to: "/kaart",
      icon: <MapIcon className="h-6 w-6" />,
      title: "Interactieve kaart",
      desc: "Alle parkings, tankstations en meldingen in één kaartweergave.",
      accent: "from-primary/25 to-primary/5",
      hint: "Klikbare pins",
    },
    {
      to: "/zoeken",
      icon: <Search className="h-6 w-6" />,
      title: "Globaal zoeken",
      desc: "Zoek in truckstops, tankstations, meldingen en voorzieningen.",
      accent: "from-slate-500/25 to-slate-500/5",
      hint: "Alles doorzoekbaar",
    },
    {
      to: "/truckstops",
      icon: <ParkingSquare className="h-6 w-6" />,
      title: "Truckstops & parking",
      desc: "Veilige parkings, douches en meer, met live bezetting.",
      accent: "from-sky-500/25 to-sky-500/5",
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
      to: "/terminals",
      icon: <Building2 className="h-6 w-6" />,
      title: "DC's & terminals",
      desc: "Distributiecentra, terminals en havens met openingstijden.",
      accent: "from-teal-500/25 to-teal-500/5",
      hint: "Beheerd door TruckMate",
    },
    {
      to: "/konvooi",
      icon: <Radio className="h-6 w-6" />,
      title: "Konvooi rijden",
      desc: "Rijd samen, deel tijdelijk je locatie en chat als groep.",
      accent: "from-emerald-500/25 to-emerald-500/5",
      hint: "Opt-in locatie",
    },
    {
      to: "/meldingen",
      icon: <Megaphone className="h-6 w-6" />,
      title: "Meldingen onderweg",
      desc: "File, controle, wegwerk of vrije parkeerplek — deel & bevestig.",
      accent: "from-orange-500/25 to-orange-500/5",
      hint: `${activeAlerts} actieve meldingen`,
    },
    {
      to: "/voorzieningen",
      icon: <Search className="h-6 w-6" />,
      title: "Voorzieningen zoeken",
      desc: "Douche, restaurant, garage, truckwash of rustplek.",
      accent: "from-sky-500/25 to-sky-500/5",
      hint: "6 categorieën",
    },
    {
      to: "/beloningen",
      icon: <Trophy className="h-6 w-6" />,
      title: "Beloningen & leaderboard",
      desc: "Verdien badges door nuttige bijdragen en betrouwbare meldingen.",
      accent: "from-emerald-500/25 to-emerald-500/5",
      hint: "8 badges beschikbaar",
    },
    {
      to: "/meer",
      icon: <LayoutGrid className="h-6 w-6" />,
      title: "Meer functies",
      desc: "Groepen, konvooi, onderhoud, documenten, integraties en privacy.",
      accent: "from-purple-500/25 to-purple-500/5",
      hint: "7 modules",
    },
  ];

  const quickCats: AmenityCategory[] = ["douche","restaurant","garage","truckwash"];

  return (
    <AppShell demoBanner={"Ontdek-content bevat voorbeelddata."} title="Ontdekken">
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

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Snel naar voorzieningen</h2>
      <div className="grid grid-cols-2 gap-2">
        {quickCats.map((c) => {
          const meta = amenityCategoryMeta[c];
          return (
            <Link key={c} to="/voorzieningen" search={{ cat: c }} className="block">
              <Card className="transition hover:border-primary/60">
                <CardContent className="flex items-center gap-2 p-3">
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-sm font-medium">{meta.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

    </AppShell>
  );
}