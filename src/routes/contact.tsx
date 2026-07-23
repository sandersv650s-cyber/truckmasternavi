import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, MessageCircle, Building2, Send, Check } from "lucide-react";
import { useState } from "react";
import { APP_CONTACT_EMAIL } from "@/lib/app-info";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — TruckMate" },
      { name: "description", content: "Neem contact op met het TruckMate team." },
      { property: "og:title", content: "Contact — TruckMate" },
      { property: "og:description", content: "Vragen, feedback of samenwerken? Stuur ons een bericht." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <AppShell title="Contact" requireAuth={false}>
      <Alert className="mb-4">
        <AlertDescription className="text-xs">
          Dit is een demo-formulier. Berichten worden niet echt verstuurd.
        </AlertDescription>
      </Alert>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Info icon={<Mail className="h-4 w-4" />} title="E-mail" value={APP_CONTACT_EMAIL} />
        <Info icon={<MessageCircle className="h-4 w-4" />} title="Support" value="ma–vr 08:00–18:00" />
        <Info icon={<Building2 className="h-4 w-4" />} title="Zakelijk" value="Fleet & partners" />
      </div>

      <Card>
        <CardContent className="p-4">
          {sent ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="h-6 w-6" />
              </div>
              <p className="font-semibold">Verzonden (demo)</p>
              <p className="mt-1 text-xs text-muted-foreground">In een echte versie ontvang je binnen 1 werkdag antwoord.</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSent(false)}>Nieuw bericht</Button>
            </div>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div>
                <Label className="text-xs">Naam</Label>
                <Input required placeholder="Jan de Vries" />
              </div>
              <div>
                <Label className="text-xs">E-mail</Label>
                <Input required type="email" placeholder="jij@voorbeeld.nl" />
              </div>
              <div>
                <Label className="text-xs">Onderwerp</Label>
                <Input required placeholder="Ik heb een vraag over..." />
              </div>
              <div>
                <Label className="text-xs">Bericht</Label>
                <Textarea required rows={5} placeholder="Vertel ons hoe we kunnen helpen." />
              </div>
              <Button type="submit" className="w-full">
                <Send className="mr-2 h-4 w-4" /> Verstuur (demo)
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Info({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="text-primary">{icon}</span>
          {title}
        </div>
        <p className="mt-1 truncate text-sm font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}
