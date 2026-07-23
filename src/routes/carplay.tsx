import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CarFront, Smartphone, MapPin, Volume2, Phone, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/carplay")({
  head: () => ({
    meta: [
      { title: "CarPlay & Android Auto — TruckMate" },
      { name: "description", content: "Roadmap voor CarPlay- en Android Auto-ondersteuning." },
      { property: "og:title", content: "CarPlay & Android Auto" },
      { property: "og:description", content: "Veilige rijmodus voor CarPlay en Android Auto." },
    ],
  }),
  component: CarplayPage,
});

function CarplayPage() {
  const items = [
    { icon: <MapPin className="h-4 w-4" />, title: "Truck-navigatie", desc: "Grote knoppen, spraakinstructies met truckrestricties." },
    { icon: <Volume2 className="h-4 w-4" />, title: "Voorlezen meldingen", desc: "Community-meldingen op je route worden hardop voorgelezen." },
    { icon: <MessageSquare className="h-4 w-4" />, title: "Snelle antwoorden", desc: "Vaste antwoorden voor chat, zonder toetsenbord." },
    { icon: <Phone className="h-4 w-4" />, title: "Handsfree bellen konvooi", desc: "Bel je konvooileden met één druk." },
  ];
  return (
    <AppShell title="CarPlay & Android Auto">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Card><CardContent className="p-4 text-center">
          <CarFront className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-1 text-sm font-semibold">Apple CarPlay</p>
          <Badge variant="outline" className="mt-1 border-muted text-[10px]">Niet gekoppeld</Badge>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Smartphone className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-1 text-sm font-semibold">Android Auto</p>
          <Badge variant="outline" className="mt-1 border-muted text-[10px]">Niet gekoppeld</Badge>
        </CardContent></Card>
      </div>

      <Alert className="mb-4">
        <AlertDescription className="text-[11px]">
          Deze functies zijn in ontwikkeling. TruckMate ondersteunt CarPlay en Android Auto nog niet — deze pagina is een roadmap.
        </AlertDescription>
      </Alert>

      <h2 className="mb-2 text-sm font-semibold">Wat je straks kunt</h2>
      <div className="mb-4 space-y-2">
        {items.map((it) => (
          <Card key={it.title}><CardContent className="flex items-start gap-3 p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-background/60 text-primary">{it.icon}</div>
            <div>
              <p className="text-sm font-semibold">{it.title}</p>
              <p className="text-xs text-muted-foreground">{it.desc}</p>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold">Veiligheidsregels</h2>
      <Card><CardContent className="space-y-1 p-4 text-xs text-muted-foreground">
        <p>• Tijdens het rijden zijn alleen spraak, grote knoppen en vaste antwoorden beschikbaar.</p>
        <p>• Tekstinvoer, feed en foto's worden uitgeschakeld op de auto-schermen.</p>
        <p>• Meldingen worden gebundeld voorgelezen om afleiding te beperken.</p>
      </CardContent></Card>
    </AppShell>
  );
}