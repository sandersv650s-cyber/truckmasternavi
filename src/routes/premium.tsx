import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Crown, Sparkles, Building2, X } from "lucide-react";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "TruckMate Premium" },
      { name: "description", content: "Upgrade naar Driver Pro of Fleet Pro voor extra functies." },
      { property: "og:title", content: "TruckMate Premium" },
      { property: "og:description", content: "Free, Driver Pro en Fleet Pro plannen." },
    ],
  }),
  component: PremiumPage,
});

type Plan = {
  id: "free" | "driver" | "fleet";
  name: string;
  emoji: React.ReactNode;
  tag?: string;
  price: { m: number; y: number };
  features: string[];
  missing?: string[];
  cta: string;
  highlight?: boolean;
};

function PremiumPage() {
  const [cycle, setCycle] = useState<"m" | "y">("y");

  const plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      emoji: <Sparkles className="h-5 w-5" />,
      price: { m: 0, y: 0 },
      features: ["Basisnavigatie", "Community & meldingen", "Truckstop-info", "Handmatige ritregistratie"],
      missing: ["Slimme parkeer-AI", "Offline kaarten", "Fleet dashboard"],
      cta: "Huidig plan",
    },
    {
      id: "driver",
      name: "Driver Pro",
      emoji: <Crown className="h-5 w-5" />,
      tag: "Populair",
      price: { m: 6.99, y: 59 },
      features: [
        "Alles uit Free",
        "AI-routeassistent zonder limiet",
        "Slimme parkeervoorspelling",
        "Offline kaarten (5 landen)",
        "Documentenkluis cloud-backup",
        "Uitgebreid onderhoudslogboek",
        "Geen advertenties",
      ],
      cta: "Start 14 dagen gratis",
      highlight: true,
    },
    {
      id: "fleet",
      name: "Fleet Pro",
      emoji: <Building2 className="h-5 w-5" />,
      price: { m: 14.99, y: 149 },
      features: [
        "Alles uit Driver Pro",
        "Fleet dashboard voor bedrijven",
        "Onbeperkt chauffeurs & voertuigen",
        "Rapportage en export",
        "Live ETA-links voor klanten",
        "Prioriteit support",
        "Aankomende tacho-koppeling",
      ],
      cta: "Vraag demo aan",
    },
  ];

  return (
    <AppShell demoBanner={"Premium-plannen zijn illustratief — er is nog geen betaalprovider aangesloten."} title="Premium">
      <Alert className="mb-4 border-primary/40 bg-primary/10">
        <AlertDescription className="text-xs">
          <Badge className="mr-2 bg-primary/30 text-primary">Demo</Badge>
          Betalingen zijn nog niet actief. Je kunt hier de plannen bekijken en vergelijken.
        </AlertDescription>
      </Alert>

      <div className="mb-4 flex items-center justify-center rounded-full border border-border bg-card p-1">
        <button
          onClick={() => setCycle("m")}
          className={`flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition ${cycle === "m" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Maandelijks
        </button>
        <button
          onClick={() => setCycle("y")}
          className={`flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition ${cycle === "y" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Jaarlijks <span className="ml-1 text-[10px] opacity-80">−2 mnd</span>
        </button>
      </div>

      <div className="space-y-3">
        {plans.map((p) => (
          <Card key={p.id} className={p.highlight ? "border-primary/70 bg-gradient-to-br from-primary/15 via-card to-card" : ""}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/60 text-primary">{p.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold">{p.name}</p>
                    {p.tag && <Badge className="text-[10px]">{p.tag}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.price[cycle] === 0 ? "Gratis" : (
                      <>
                        <span className="text-xl font-black text-foreground">€ {p.price[cycle].toFixed(cycle === "y" ? 0 : 2)}</span>
                        <span> / {cycle === "y" ? "jaar" : "maand"}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
                {p.missing?.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X className="mt-0.5 h-4 w-4 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                variant={p.highlight ? "default" : "secondary"}
                disabled={p.id === "free"}
                onClick={() => alert("Demo — betalingen zijn nog niet actief.")}
              >
                {p.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Prijzen zijn indicatief en inclusief btw. Opzegbaar per maand.
      </p>
    </AppShell>
  );
}