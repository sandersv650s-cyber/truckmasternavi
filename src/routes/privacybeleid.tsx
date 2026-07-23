import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_RELEASE_DATE } from "@/lib/app-info";

export const Route = createFileRoute("/privacybeleid")({
  head: () => ({
    meta: [
      { title: "Privacybeleid — TruckMate" },
      { name: "description", content: "Hoe TruckMate omgaat met locatie-, voertuig- en persoonsgegevens." },
      { property: "og:title", content: "Privacybeleid — TruckMate" },
      { property: "og:description", content: "Privacy-eerst: alle deelfuncties staan standaard uit." },
    ],
  }),
  component: PrivacyBeleid,
});

function PrivacyBeleid() {
  return (
    <AppShell title="Privacybeleid" requireAuth={false}>
      <Alert className="mb-4">
        <AlertDescription className="text-xs">
          Dit document is onderdeel van de TruckMate 1.0 demo. Voor een productieversie
          vervangt een advocaat deze tekst door de definitieve juridische versie.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="prose prose-invert max-w-none space-y-4 p-5 text-sm">
          <p className="text-xs text-muted-foreground">Laatste update: {APP_RELEASE_DATE}</p>

          <Section title="1. Wie is verantwoordelijk">
            TruckMate wordt aangeboden als demonstratieproduct. In een productieversie is de
            aanbieder verantwoordelijk voor de verwerking van jouw persoonsgegevens conform de AVG.
          </Section>

          <Section title="2. Welke gegevens">
            <ul className="ml-4 list-disc space-y-1">
              <li>Accountgegevens: naam, e-mail, rol (chauffeur, eigenrijder, fleetbeheerder).</li>
              <li>Voertuiggegevens: merk, kenteken, type — alleen als je die zelf invult.</li>
              <li>Locatiegegevens: uitsluitend als je een deelfunctie of konvooimodus actief zet.</li>
              <li>Ritten en verbruik: opgeslagen op je toestel en (indien ingesteld) in je account.</li>
              <li>Community-bijdragen: reviews, meldingen en berichten die je zelf plaatst.</li>
            </ul>
          </Section>

          <Section title="3. Privacy-eerst standaard">
            Live locatie delen, konvooimodus, ETA-delen en publieke zichtbaarheid staan bij een
            nieuw account uit. Je kunt ze op elk moment aanzetten via het{" "}
            <Link className="text-primary underline" to="/privacy">Privacycentrum</Link>.
          </Section>

          <Section title="4. Bewaartermijnen">
            Ritten en documenten worden bewaard zolang jij ze niet verwijdert. Deel-links voor ETA
            vervallen automatisch na de door jou gekozen duur.
          </Section>

          <Section title="5. Jouw rechten">
            Inzage, correctie, verwijdering, dataportabiliteit en bezwaar. Je kunt je account en
            data verwijderen via Instellingen → Data → Verwijder account.
          </Section>

          <Section title="6. Derde partijen">
            Integraties met tachograaf-, fleet- en navigatieproviders zijn nog niet actief. Zodra
            deze live gaan, informeren we je vooraf en vragen we expliciete toestemming.
          </Section>

          <Section title="7. Contact">
            Vragen over privacy? Neem contact met ons op via{" "}
            <Link className="text-primary underline" to="/contact">de contactpagina</Link>.
          </Section>
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link to="/voorwaarden"><Button variant="secondary" className="w-full">Algemene voorwaarden</Button></Link>
        <Link to="/privacy"><Button variant="secondary" className="w-full">Privacycentrum</Button></Link>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-1 text-xs text-muted-foreground">{children}</div>
    </div>
  );
}
