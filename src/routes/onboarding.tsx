import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Truck, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { roleMeta, useRole, markOnboardingDone, type Role } from "@/lib/role";
import { usePrivacy } from "@/lib/privacy";
import { privacyOptions } from "@/lib/more-data";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welkom bij TruckMate" },
      { name: "description", content: "Stel je profiel in: rol, voertuig en privacy." },
      { property: "og:title", content: "Welkom bij TruckMate" },
      { property: "og:description", content: "Snelle setup in 3 stappen." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { role, setRole } = useRole();
  const { state: privacy, set: setPrivacy } = usePrivacy();
  const [step, setStep] = useState(1);
  const [truck, setTruck] = useState({ model: "Volvo FH16 750", plate: "BV-123-N", type: "Trekker + oplegger" });

  const total = 3;

  const finish = () => {
    markOnboardingDone();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 text-primary">
            <Truck className="h-4 w-4" />
          </div>
          <span className="text-base font-bold">TruckMate</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">Stap {step}/{total}</Badge>
        </div>
        <div className="h-1 w-full bg-muted">
          <div className="h-1 bg-primary transition-all" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {step === 1 && (
          <>
            <h1 className="text-2xl font-black">Kies je rol</h1>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">Dit bepaalt welke functies we op de voorgrond zetten.</p>
            <div className="space-y-2">
              {(Object.keys(roleMeta) as Role[]).map((r) => {
                const m = roleMeta[r];
                const active = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`w-full rounded-xl border p-4 text-left transition ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{m.emoji}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                      {active && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-black">Jouw truck</h1>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">Deze gegevens gebruiken we voor navigatie-restricties en onderhoud.</p>
            <Card>
              <CardContent className="space-y-4 p-4">
                <div>
                  <Label className="text-xs">Merk / model</Label>
                  <Input value={truck.model} onChange={(e) => setTruck({ ...truck, model: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Kenteken</Label>
                  <Input value={truck.plate} onChange={(e) => setTruck({ ...truck, plate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Input value={truck.type} onChange={(e) => setTruck({ ...truck, type: e.target.value })} />
                </div>
                <p className="text-[11px] text-muted-foreground">Je kunt dit later aanpassen bij Instellingen → Voertuig.</p>
              </CardContent>
            </Card>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-black">Privacy eerst</h1>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">Alles staat privacy-vriendelijk uit. Zet aan wat je nuttig vindt — je kunt dit altijd wijzigen.</p>
            <div className="space-y-2">
              {privacyOptions.map((p) => (
                <label key={p.key} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                  <Switch checked={privacy[p.key]} onCheckedChange={(v) => setPrivacy(p.key, v)} />
                </label>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex gap-2">
          {step > 1 && (
            <Button variant="secondary" className="flex-1" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Terug
            </Button>
          )}
          {step < total ? (
            <Button className="flex-1" onClick={() => setStep(step + 1)}>
              Volgende <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={finish}>
              Beginnen <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        <button onClick={finish} className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground">
          Overslaan
        </button>
      </main>
    </div>
  );
}