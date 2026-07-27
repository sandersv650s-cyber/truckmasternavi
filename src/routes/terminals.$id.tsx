import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarClock, Clock, Globe, Mail, MapPin, MessageSquarePlus, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  createSuggestion,
  fetchExceptions,
  fetchHours,
  fetchTerminal,
  isOpenNow,
  suggestionFields,
  terminalTypes,
  weekdayLabels,
  type Terminal,
  type TerminalException,
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
  const { user } = useAuth();
  const [t, setT] = useState<Terminal | null>(null);
  const [hours, setHours] = useState<TerminalHour[]>([]);
  const [exceptions, setExceptions] = useState<TerminalException[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [field, setField] = useState<string>("hours");
  const [suggestion, setSuggestion] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTerminal(id)
      .then(async (row) => {
        if (!row) {
          setState("missing");
          return;
        }
        setT(row);
        setHours(await fetchHours([row.id]));
        setExceptions(await fetchExceptions(row.id).catch(() => []));
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
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayException = exceptions.find((e) => e.date === todayIso);

  const submitSuggestion = async () => {
    if (!user || !t) return;
    if (suggestion.trim().length < 5) {
      toast.error("Geef iets meer toelichting.");
      return;
    }
    setSending(true);
    try {
      await createSuggestion({
        terminal_id: t.id,
        user_id: user.id,
        field,
        suggestion: suggestion.trim().slice(0, 1000),
      });
      toast.success("Bedankt — je correctie wordt door een moderator beoordeeld.");
      setSuggestion("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Versturen mislukt.");
    } finally {
      setSending(false);
    }
  };

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
              {todayException?.closed ? "Vandaag gesloten" : open ? "Nu open" : "Gesloten"}
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

      {exceptions.length > 0 && (
        <Card className="mb-3 border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="mb-2 flex items-center gap-1 text-sm font-semibold">
              <CalendarClock className="h-4 w-4" /> Afwijkende openingstijden
            </p>
            <div className="space-y-1 text-xs">
              {exceptions.map((e) => (
                <div key={e.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                    {e.reason ? ` · ${e.reason}` : ""}
                  </span>
                  <span className="shrink-0 font-medium">
                    {e.closed ? "Gesloten" : `${e.opens?.slice(0, 5)} – ${e.closes?.slice(0, 5)}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
        <Card className="mb-3">
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

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="flex items-center gap-1 text-sm font-semibold">
            <MessageSquarePlus className="h-4 w-4" /> Correctie voorstellen
          </p>
          {!user ? (
            <p className="text-xs text-muted-foreground">
              Log in om een correctie door te geven.
            </p>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground">
                Kloppen de gegevens niet? Stuur een voorstel — een moderator keurt het goed voordat
                het zichtbaar wordt.
              </p>
              <div>
                <Label className="mb-1 block text-xs">Onderdeel</Label>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {suggestionFields.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                maxLength={1000}
                placeholder="Wat klopt er niet en wat is de juiste informatie?"
                className="min-h-20 text-xs"
              />
              <Button size="sm" onClick={submitSuggestion} disabled={sending}>
                {sending ? "Versturen…" : "Voorstel versturen"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
