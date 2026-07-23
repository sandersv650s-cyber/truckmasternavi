import { useDemoTour } from "@/lib/demo";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { useState } from "react";
import {
  LayoutDashboard,
  Map as MapIcon,
  Compass,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
} from "lucide-react";

const steps = [
  {
    icon: LayoutDashboard,
    title: "Welkom bij TruckMate",
    body: "Dit is een interactieve demo. Alle gegevens zijn fictief, alle koppelingen gesimuleerd. Volg deze korte rondleiding om de app te leren kennen.",
  },
  {
    icon: MapIcon,
    title: "Kaart & navigatie",
    body: "Bekijk truckparkings, dieselprijzen en meldingen op de kaart. De trucknavigatie (HERE/TomTom) is gemarkeerd als 'Demo'.",
  },
  {
    icon: Compass,
    title: "Ontdekken",
    body: "Vind truckstops, brandstof, voorzieningen en beloningen. Maak favorieten aan — die blijven bewaard in deze demo.",
  },
  {
    icon: Users,
    title: "Community & chat",
    body: "Deel meldingen, praat mee in groepen, stuur berichten en start een konvooi met collega's.",
  },
  {
    icon: Sparkles,
    title: "Alles bij de hand",
    body: "Via 'Meer' vind je onderhoud, documenten, fleet-dashboard, AI-assistent en instellingen. Reset de demo altijd via Instellingen.",
  },
];

export function DemoTour() {
  const { done, finish } = useDemoTour();
  const [i, setI] = useState(0);
  if (done) return null;
  const step = steps[i];
  const Icon = step.icon;
  const last = i === steps.length - 1;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center">
      <Card className="w-full max-w-md border-primary/40">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <Badge className="bg-primary/20 text-primary">Rondleiding {i + 1}/{steps.length}</Badge>
            <button
              onClick={finish}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Sluiten"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-tight">{step.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          </div>
          <div className="mb-4 flex items-center justify-center gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 w-6 rounded-full transition ${idx === i ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {i > 0 && (
              <Button variant="secondary" className="flex-1" onClick={() => setI(i - 1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Terug
              </Button>
            )}
            {!last ? (
              <Button className="flex-1" onClick={() => setI(i + 1)}>
                Volgende <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button className="flex-1" onClick={finish}>
                <CheckCircle2 className="mr-1 h-4 w-4" /> Aan de slag
              </Button>
            )}
          </div>
          <button
            onClick={finish}
            className="mt-3 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Overslaan
          </button>
        </CardContent>
      </Card>
    </div>
  );
}