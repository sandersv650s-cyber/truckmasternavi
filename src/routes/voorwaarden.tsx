import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_RELEASE_DATE } from "@/lib/app-info";

export const Route = createFileRoute("/voorwaarden")({
  head: () => ({
    meta: [
      { title: "Algemene voorwaarden — TruckMate" },
      { name: "description", content: "Gebruiksvoorwaarden van de TruckMate demo-app." },
      { property: "og:title", content: "Algemene voorwaarden — TruckMate" },
      { property: "og:description", content: "De regels voor gebruik van TruckMate 1.0." },
    ],
  }),
  component: Voorwaarden,
});

function Voorwaarden() {
  return (
    <AppShell title="Voorwaarden" requireAuth={false}>
      <Alert className="mb-4">
        <AlertDescription className="text-xs">
          TruckMate 1.0 is een prototype voor demo-doeleinden. Deze tekst is een
          voorbeeld en geen juridisch bindende overeenkomst.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="space-y-4 p-5 text-sm">
          <p className="text-xs text-muted-foreground">Laatste update: {APP_RELEASE_DATE}</p>

          <S title="1. Gebruik van de demo">
            De demo is bedoeld om functionaliteit te tonen aan chauffeurs, transportbedrijven en
            investeerders. Alle data is fictief en wordt lokaal in je browser bewaard.
          </S>
          <S title="2. Geen navigatie-advies">
            De trucknavigatie in deze demo berekent geen echte routes. Volg tijdens het rijden
            altijd de officiële bewegwijzering en jouw eigen navigatiesysteem.
          </S>
          <S title="3. Veilig gebruik onderweg">
            Bedien de app niet tijdens het rijden. CarPlay- en Android Auto-integratie is nog niet
            actief en wordt gelabeld als "Binnenkort".
          </S>
          <S title="4. Community-inhoud">
            Je bent zelf verantwoordelijk voor wat je in de community-feed, reviews en meldingen
            plaatst. Beledigend, onwettig of misleidend gebruik is niet toegestaan.
          </S>
          <S title="5. Voertuigdata & OBD">
            OBD, J1939 en FMS-koppelingen zijn niet actief. De app doet geen hardwareclaims en
            geeft alleen mockdata weer.
          </S>
          <S title="6. Beschikbaarheid">
            We doen ons best om de demo beschikbaar te houden, maar geven geen garanties op
            uptime of dataretentie tijdens de prototypefase.
          </S>
          <S title="7. Aansprakelijkheid">
            Voor zover wettelijk toegestaan, is de aanbieder niet aansprakelijk voor schade die
            voortvloeit uit het gebruik van de demo.
          </S>
          <S title="8. Wijzigingen">
            We kunnen deze voorwaarden aanpassen. Wijzigingen worden gepubliceerd op deze pagina.
          </S>
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link to="/privacybeleid"><Button variant="secondary" className="w-full">Privacybeleid</Button></Link>
        <Link to="/contact"><Button variant="secondary" className="w-full">Contact</Button></Link>
      </div>
    </AppShell>
  );
}

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{children}</p>
    </div>
  );
}
