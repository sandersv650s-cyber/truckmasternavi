import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_VERSION, APP_RELEASE_DATE } from "@/lib/app-info";

export const Route = createFileRoute("/release-notes")({
  head: () => ({
    meta: [
      { title: "Release notes — TruckMate" },
      { name: "description", content: "Wat is er nieuw in TruckMate." },
      { property: "og:title", content: "Release notes — TruckMate" },
      { property: "og:description", content: "Overzicht van functies per versie." },
    ],
  }),
  component: ReleaseNotes,
});

type Release = {
  version: string;
  date: string;
  tag: "Nu" | "Preview" | "Concept";
  highlights: string[];
};

const releases: Release[] = [
  {
    version: APP_VERSION,
    date: APP_RELEASE_DATE,
    tag: "Nu",
    highlights: [
      "Eerste publieke investeerdersdemo van TruckMate.",
      "Volledig Nederlandstalige interface met taalwissel (EN/DE/FR/PL) voor kernlabels.",
      "Dashboard, trucknavigatie-demo, ritregistratie, community, chat, groepen en konvooimodus.",
      "Truckparkings, dieselprijzen, voorzieningen, meldingen, favorieten en reviews.",
      "Fleet-dashboard, live ETA-delen, onderhoudslogboek en documentenkluis.",
      "Privacycentrum met alle deelfuncties standaard uit.",
      "Duidelijke 'Demo' en 'Binnenkort' labels op nog niet actieve integraties.",
    ],
  },
  {
    version: "1.1",
    date: "Gepland",
    tag: "Preview",
    highlights: [
      "Echte HERE/TomTom trucknavigatie met tol en milieuzones.",
      "Offline kaarten downloaden per land.",
      "Push-notificaties voor meldingen langs je route.",
      "Vertalingen uitbreiden buiten navigatielabels.",
    ],
  },
  {
    version: "1.2",
    date: "Concept",
    tag: "Concept",
    highlights: [
      "Bluetooth OBD-II / J1939 / FMS voor live voertuigdata.",
      "Tachograaf-koppeling (VDO, Stoneridge).",
      "CarPlay & Android Auto met voorlezen van meldingen.",
      "Premium betalingen en Fleet Pro facturatie.",
    ],
  },
];

const tagStyle: Record<Release["tag"], string> = {
  Nu: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  Preview: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  Concept: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

function ReleaseNotes() {
  return (
    <AppShell title="Release notes" requireAuth={false}>
      <p className="mb-4 text-sm text-muted-foreground">
        Overzicht van wat vandaag werkt in TruckMate en wat we in volgende versies plannen.
      </p>
      <div className="space-y-3">
        {releases.map((r) => (
          <Card key={r.version}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg font-black">v{r.version}</span>
                <Badge variant="outline" className={`text-[10px] ${tagStyle[r.tag]}`}>{r.tag}</Badge>
                <span className="ml-auto text-[11px] text-muted-foreground">{r.date}</span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {r.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link to="/over"><Button variant="secondary" className="w-full">Over TruckMate</Button></Link>
        <Link to="/contact"><Button variant="secondary" className="w-full">Feedback geven</Button></Link>
      </div>
    </AppShell>
  );
}
