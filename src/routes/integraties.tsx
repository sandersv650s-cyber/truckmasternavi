import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plug, CheckCircle2 } from "lucide-react";
import { integrations, integrationStatusMeta } from "@/lib/more-data";

export const Route = createFileRoute("/integraties")({
  head: () => ({
    meta: [
      { title: "Integraties — TruckMate" },
      { name: "description", content: "Tachograaf, fleet, OBD/J1939/FMS en TMS integraties." },
      { property: "og:title", content: "Integraties — TruckMate" },
      { property: "og:description", content: "Data die TruckMate binnenkort kan inlezen." },
    ],
  }),
  component: IntegratiesPage,
});

function IntegratiesPage() {
  return (
    <AppShell demoBanner={"Integraties met tachograaf/fleetsystemen vereisen aparte contracten — nog niet actief."} title="Integraties">
      <Card className="mb-3">
        <CardContent className="flex items-start gap-3 p-3 text-xs">
          <Plug className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            TruckMate werkt volledig zonder externe koppeling. Zodra een integratie beschikbaar is, verrijkt die je dashboard automatisch — je hoeft niets opnieuw in te vullen.
          </p>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {integrations.map((i) => {
          const meta = integrationStatusMeta[i.status];
          return (
            <Card key={i.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-background/60 text-xl">
                    {i.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{i.name}</p>
                      <Badge className={`border text-[10px] ${meta.color}`}>{meta.label}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{i.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {i.vendors.map((v) => (
                        <Badge key={v} variant="outline" className="text-[10px] font-normal">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-border/60 bg-background/40 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Wat we later kunnen inlezen
                  </p>
                  <ul className="space-y-0.5">
                    {i.dataPoints.map((d) => (
                      <li key={d} className="flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="h-3 w-3 text-primary" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant={i.status === "demo" ? "default" : "secondary"}
                  className="mt-3 w-full"
                  disabled={i.status !== "demo"}
                  onClick={() => alert("Demo-modus geactiveerd — data is nog niet echt.")}
                >
                  {i.status === "demo"
                    ? "Demo bekijken"
                    : i.status === "binnenkort"
                      ? "Binnenkort beschikbaar"
                      : "Nog niet gekoppeld"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}