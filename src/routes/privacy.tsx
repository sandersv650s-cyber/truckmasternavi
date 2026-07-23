import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { privacyOptions } from "@/lib/more-data";
import { usePrivacy } from "@/lib/privacy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacycentrum — TruckMate" },
      { name: "description", content: "Beheer toestemmingen voor locatie, konvooi, voertuigdata, community en documenten." },
      { property: "og:title", content: "Privacycentrum — TruckMate" },
      { property: "og:description", content: "Alles rond je gegevens op één plek." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { state, set, reset } = usePrivacy();
  const categories = Array.from(new Set(privacyOptions.map((o) => o.category)));

  return (
    <AppShell title="Privacy">
      <Card className="mb-4 border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="flex items-start gap-3 p-3 text-xs">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <div>
            <p className="font-semibold text-foreground">Privacyvriendelijk standaard</p>
            <p className="mt-0.5 text-muted-foreground">
              Alle gevoelige opties staan standaard uit. Je bepaalt zelf wat je deelt, en kunt elke keuze op elk moment terugdraaien.
            </p>
          </div>
        </CardContent>
      </Card>

      {categories.map((cat) => (
        <section key={cat} className="mb-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h2>
          <div className="space-y-2">
            {privacyOptions
              .filter((o) => o.category === cat)
              .map((o) => (
                <Card key={o.key}>
                  <CardContent className="flex items-start gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{o.label}</p>
                        {!o.defaultOn && (
                          <Badge variant="outline" className="text-[10px]">Standaard uit</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{o.description}</p>
                    </div>
                    <Switch checked={state[o.key]} onCheckedChange={(v) => set(o.key, v)} aria-label={o.label} />
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      ))}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="secondary" className="w-full">
            <RotateCcw className="mr-1 h-4 w-4" /> Herstel privacy-standaarden
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Standaarden herstellen?</AlertDialogTitle>
            <AlertDialogDescription>
              Alle privacy-instellingen worden teruggezet naar de veilige standaardwaarden. Actieve konvooisessies stoppen niet automatisch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={reset}>Herstellen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Zie ook{" "}
        <Link to="/instellingen" className="text-primary underline">instellingen</Link>{" "}
        voor account en meldingen.
      </p>
    </AppShell>
  );
}