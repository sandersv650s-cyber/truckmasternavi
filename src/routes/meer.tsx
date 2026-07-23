import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Users,
  Radio,
  Wrench,
  FileText,
  Plug,
  ShieldCheck,
  ChevronRight,
  Truck,
  Settings,
  Crown,
  Building2,
  Share2,
  CarFront,
  Download,
  Map as MapIcon,
  Trophy,
} from "lucide-react";

export const Route = createFileRoute("/meer")({
  head: () => ({
    meta: [
      { title: "Meer functies — TruckMate" },
      { name: "description", content: "Alle extra modules: AI-assistent, groepen, konvooi, onderhoud, documenten, integraties en privacy." },
      { property: "og:title", content: "Meer functies — TruckMate" },
      { property: "og:description", content: "Uitgebreide modules voor professionele chauffeurs." },
    ],
  }),
  component: MeerPage,
});

type Tile = {
  to:
    | "/assistent"
    | "/groepen"
    | "/konvooi"
    | "/onderhoud"
    | "/documenten"
    | "/integraties"
    | "/privacy"
    | "/voertuig"
    | "/instellingen"
    | "/premium"
    | "/fleet"
    | "/deel-eta"
    | "/carplay"
    | "/offline-kaarten"
    | "/navigatie-provider"
    | "/beloningen";
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  hint?: string;
  badge?: string;
};

function MeerPage() {
  const tiles: Tile[] = [
    { to: "/premium", icon: <Crown className="h-6 w-6" />, title: "TruckMate Premium", desc: "Free, Driver Pro en Fleet Pro plannen vergelijken.", accent: "from-amber-500/25 to-amber-500/5", badge: "Demo" },
    { to: "/fleet", icon: <Building2 className="h-6 w-6" />, title: "Fleet dashboard", desc: "Voertuigen, chauffeurs en KPI's voor transportbedrijven.", accent: "from-primary/25 to-primary/5", badge: "Fleet Pro" },
    { to: "/deel-eta", icon: <Share2 className="h-6 w-6" />, title: "Live ETA delen", desc: "Tijdelijke deel-link voor planner of klant — standaard uit.", accent: "from-sky-500/25 to-sky-500/5", badge: "Privacy-first" },
    { to: "/assistent", icon: <Sparkles className="h-6 w-6" />, title: "AI-routeassistent", desc: "Stel een vraag in gewone taal en krijg slimme parkeer- en stopadviezen.", accent: "from-primary/25 to-primary/5", badge: "Demo" },
    { to: "/beloningen", icon: <Trophy className="h-6 w-6" />, title: "Beloningen & XP", desc: "Levels, badges, streaks en weekuitdagingen.", accent: "from-yellow-500/25 to-yellow-500/5" },
    { to: "/groepen", icon: <Users className="h-6 w-6" />, title: "Groepen", desc: "Bedrijfs-, regio-, route- en interessegroepen met eigen feed.", accent: "from-sky-500/25 to-sky-500/5", hint: "6 voorbeeldgroepen" },
    { to: "/konvooi", icon: <Radio className="h-6 w-6" />, title: "Konvooimodus", desc: "Rijd samen met collega's en deel locatie tijdelijk — standaard uit.", accent: "from-emerald-500/25 to-emerald-500/5", badge: "Privacy-first" },
    { to: "/onderhoud", icon: <Wrench className="h-6 w-6" />, title: "Onderhoudslogboek", desc: "APK, banden, olie, reparaties en kosten op één plek.", accent: "from-amber-500/25 to-amber-500/5" },
    { to: "/documenten", icon: <FileText className="h-6 w-6" />, title: "Documentenkluis", desc: "CMR, vrachtbrief, ADR, voertuigpapieren en bonnetjes.", accent: "from-purple-500/25 to-purple-500/5" },
    { to: "/navigatie-provider", icon: <MapIcon className="h-6 w-6" />, title: "Truck-navigatie", desc: "HERE en TomTom truckroutes — demo met mockberekening.", accent: "from-sky-500/25 to-sky-500/5", badge: "Binnenkort" },
    { to: "/offline-kaarten", icon: <Download className="h-6 w-6" />, title: "Offline kaarten", desc: "Download landen voor navigatie zonder internet.", accent: "from-teal-500/25 to-teal-500/5" },
    { to: "/carplay", icon: <CarFront className="h-6 w-6" />, title: "CarPlay & Android Auto", desc: "Roadmap voor veilige rijmodus.", accent: "from-slate-500/25 to-slate-500/5", badge: "Binnenkort" },
    { to: "/integraties", icon: <Plug className="h-6 w-6" />, title: "Integraties", desc: "Tachograaf, fleet, OBD/J1939/FMS en TMS — binnenkort.", accent: "from-slate-500/25 to-slate-500/5", badge: "Binnenkort" },
    { to: "/privacy", icon: <ShieldCheck className="h-6 w-6" />, title: "Privacycentrum", desc: "Beheer toestemmingen voor locatie, konvooi, voertuig en data.", accent: "from-teal-500/25 to-teal-500/5" },
    { to: "/voertuig", icon: <Truck className="h-6 w-6" />, title: "Voertuig", desc: "Voertuigkoppeling en Bluetooth — binnenkort beschikbaar.", accent: "from-slate-500/25 to-slate-500/5" },
    { to: "/instellingen", icon: <Settings className="h-6 w-6" />, title: "Instellingen", desc: "Account, meldingen, thema en taal.", accent: "from-neutral-500/25 to-neutral-500/5" },
  ];
  return (
    <AppShell title="Meer">
      <p className="mb-4 text-sm text-muted-foreground">
        Extra modules die TruckMate onderscheidend maken. Alles hier is een klikbare demo — voertuigdata en integraties zijn nog niet echt gekoppeld.
      </p>
      <div className="space-y-3">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="block">
            <Card className={`overflow-hidden bg-gradient-to-br ${t.accent} border-border/60 transition hover:border-primary/60`}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-background/60 text-primary">
                  {t.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{t.title}</p>
                    {t.badge && <Badge variant="secondary" className="text-[10px]">{t.badge}</Badge>}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.desc}</p>
                  {t.hint && (
                    <Badge variant="outline" className="mt-2 text-[10px] font-normal">
                      {t.hint}
                    </Badge>
                  )}
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