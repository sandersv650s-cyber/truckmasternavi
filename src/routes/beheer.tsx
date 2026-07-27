import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Flag, Building2, ScrollText, MessageSquarePlus, Fuel, UserX } from "lucide-react";

export const Route = createFileRoute("/beheer")({
  head: () => ({
    meta: [
      { title: "Beheerpaneel — TruckMate" },
      { name: "description", content: "Beheer gebruikers, meldingen, locaties en bekijk het auditlogboek." },
      { property: "og:title", content: "Beheerpaneel — TruckMate" },
      { property: "og:description", content: "Beheerdersfuncties van TruckMate Connect." },
    ],
  }),
  component: AdminHome,
});

const tiles = [
  { to: "/beheer/gebruikers", icon: Users, title: "Gebruikers", desc: "Zoeken, schorsen, rollen" },
  { to: "/beheer/meldingen", icon: Flag, title: "Moderatie-inbox", desc: "Rapportages afhandelen" },
  { to: "/beheer/blokkades", icon: UserX, title: "Blokkades", desc: "Wie blokkeert wie" },
  { to: "/beheer/suggesties", icon: MessageSquarePlus, title: "Correcties", desc: "Voorstellen beoordelen" },
  { to: "/beheer/locaties", icon: Building2, title: "DC's & terminals", desc: "Locaties beheren" },
  { to: "/beheer/brandstof", icon: Fuel, title: "Brandstof", desc: "Stations, prijzen, import" },
  { to: "/beheer/auditlog", icon: ScrollText, title: "Auditlog", desc: "Alle beheeracties" },
] as const;

function AdminHome() {
  return (
    <AdminGuard title="Beheer" require="staff">
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to}>
            <Card className="h-full transition hover:border-primary/60">
              <CardContent className="p-4">
                <t.icon className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AdminGuard>
  );
}
