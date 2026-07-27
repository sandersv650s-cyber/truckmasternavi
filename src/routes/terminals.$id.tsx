import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import {
  fetchHours,
  fetchTerminal,
  isOpenNow,
  terminalTypes,
  weekdayLabels,
  type Terminal,
  type TerminalHour,
} from "@/lib/terminals";

export const Route = createFileRoute("/terminals/$id")({
  head: () => ({
    meta: [
      { title: "Locatiedetails — TruckMate" },
      { name: "description", content: "Openingstijden, faciliteiten en contactgegevens van deze locatie." },
      { property: "og:title", content: "Locatiedetails — TruckMate" },
      { property: "og:description", content: "Details van een distributiecentrum of terminal." },
    ],
  }),
  component: TerminalDetail,
});

function TerminalDetail() {
  const { id } = Route.useParams();
  const [t, setT] = useState<Terminal | null>(null);
  const [hours, setHours] = useState<TerminalHour[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    fetchTerminal(id)
      .then(async (row) => {
        if (!row) {
          setState("missing");
          return;
        }
        setT(row);
        setHours(await fetchHours([row.id]));
        setState("ready");
      })
      .catch(() => setState("missing"));
  }, [id]);

  if (state === "loading") {
    return (
      <AppShell title="Locatie">
        <p className="text-sm text-muted-foreground">Laden…</p>
      </AppShell>
    );
  }
  if (state === "missing" || !t) {
    return (
      <AppShell title="Locatie">
        <p className="text-sm text-muted-foreground">Deze locatie bestaat niet (meer).</p>
        <Button asChild variant="secondary" className="mt-3">
          <Link to="/terminals">Terug naar overzicht</Link>
        </Button>
      </AppShell>
    );
  }

  const open = isOpenNow(hours);

  return (
    <AppShell title={t.name}>
      <Card className="mb-3">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-base font-bold">{t.name}</p>
              <Badge variant="outline" className="mt-1 text-[10px]">
                {terminalTypes[t.type]}
              </Badge>
            </div>
            <Badge className={`text-[10px] ${open ? "bg-emerald-500/20 text-emerald-300" : "bg-muted text-muted-foreground"}`}>
              {open ? "Nu open" : "Gesloten"}
            </Badge>
          </div>
          <p className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {[t.address, t.postal_code, t.city, t.country].filter(Boolean).join(", ")}
          </p>
          {t.phone && (
            <a href={`tel:${t.phone}`} className="flex items-center gap-1 text-xs text-primary">
              <Phone className="h-3.5 w-3.5" /> {t.phone}
            </a>
          )}
          {t.email && (
            <a href={`mailto:${t.email}`} className="flex items-center gap-1 text-xs text-primary">
              <Mail className="h-3.5 w-3.5" /> {t.email}
            </a>
          )}
          {t.website && (
            <a href={t.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary">
              <Globe className="h-3.5 w-3.5" /> Website
            </a>
          )}
        </CardContent>
      </Card>

      <Card className="mb-3">
        <CardContent className="p-4">
          <p className="mb-2 flex items-center gap-1 text-sm font-semibold">
            <Clock className="h-4 w-4" /> Openingstijden
          </p>
          {hours.length === 0 ? (
            <p className="text-xs text-muted-foreground">Geen openingstijden bekend.</p>
          ) : (
            <div className="space-y-1 text-xs">
              {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
                const h = hours.find((x) => x.weekday === wd);
                return (
                  <div key={wd} className="flex justify-between">
                    <span className="text-muted-foreground">{weekdayLabels[wd]}</span>
                    <span className="font-medium">
                      {!h || h.closed ? "Gesloten" : `${h.opens?.slice(0, 5)} – ${h.closes?.slice(0, 5)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {t.facilities.length > 0 && (
        <Card className="mb-3">
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-semibold">Faciliteiten</p>
            <div className="flex flex-wrap gap-1">
              {t.facilities.map((f) => (
                <Badge key={f} variant="outline" className="text-[10px]">
                  {f}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(t.wait_time_notes || t.notes) && (
        <Card>
          <CardContent className="space-y-2 p-4 text-xs text-muted-foreground">
            {t.wait_time_notes && (
              <p>
                <span className="font-semibold text-foreground">Wachttijden: </span>
                {t.wait_time_notes}
              </p>
            )}
            {t.notes && <p>{t.notes}</p>}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
