import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, Star, MapPin, AlertTriangle, CheckCircle2, ParkingSquare } from "lucide-react";
import { assistantResults, exampleAssistantPrompts, parseAssistantQuery, type AssistantResult } from "@/lib/more-data";
import { flag, occupancyMeta, amenityLabels } from "@/lib/discover-data";

export const Route = createFileRoute("/assistent")({
  head: () => ({
    meta: [
      { title: "AI-routeassistent — TruckMate" },
      { name: "description", content: "Slimme assistent (demo) die parkeer- en stopadvies geeft op basis van je vraag in gewone taal." },
      { property: "og:title", content: "AI-routeassistent — TruckMate" },
      { property: "og:description", content: "Stel een vraag, krijg passende truckstops met uitleg." },
    ],
  }),
  component: AssistentPage,
});

function AssistentPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AssistantResult[]>([]);

  const submit = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setResults([]);
    // Gesimuleerde 'denk-tijd' voor demo-realisme
    setTimeout(() => {
      setResults(assistantResults(q));
      setLoading(false);
    }, 700);
  };

  const parsed = query ? parseAssistantQuery(query) : null;

  return (
    <AppShell demoBanner={"AI-assistent is een demo met vaste antwoorden — nog geen echte LLM aangesloten."} title="AI-assistent">
      <Card className="mb-3 border-primary/40 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 text-xs">
            <p className="font-semibold text-foreground">Slimme routeassistent (demo)</p>
            <p className="mt-0.5 text-muted-foreground">
              Deze assistent gebruikt mock-data en simpele regels. Adviezen zijn nooit een garantie — check altijd zelf beschikbaarheid, ADR-regels en veiligheid.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-3">
        <CardContent className="space-y-2 p-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bijv. 'Vind een veilige parking binnen 45 minuten met douche en restaurant.'"
            className="min-h-20 text-sm"
          />
          <Button className="w-full" onClick={() => submit(input)} disabled={!input.trim() || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Bezig met zoeken…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Vraag stellen
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {!query && (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Voorbeeldvragen</p>
          <div className="mb-4 space-y-2">
            {exampleAssistantPrompts.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setInput(p);
                  submit(p);
                }}
                className="block w-full rounded-lg border border-border bg-card/60 p-3 text-left text-sm transition hover:border-primary/60"
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}

      {parsed && !loading && (
        <Card className="mb-3">
          <CardContent className="p-3 text-xs">
            <p className="mb-1 font-semibold text-foreground">Wat ik begreep:</p>
            <ul className="list-disc pl-4 text-muted-foreground">
              <li>Maximaal <span className="font-medium text-foreground">{parsed.maxMinutes} min</span> rijden</li>
              {parsed.required.length > 0 && (
                <li>
                  Voorzieningen vereist:{" "}
                  <span className="font-medium text-foreground">
                    {parsed.required.map((a) => amenityLabels[a]).join(", ")}
                  </span>
                </li>
              )}
              {parsed.wantsSafe && <li>Voorkeur voor veilige/bewaakte parking</li>}
              {parsed.required.length === 0 && !parsed.wantsSafe && (
                <li>Geen specifieke filters — algemene top-picks</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Zoeken naar passende stops…
        </div>
      )}

      {!loading && query && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <Card key={r.stop.id} className={r.matches ? "border-emerald-500/40" : "border-border"}>
              <CardContent className="p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">#{i + 1}</Badge>
                  {r.matches ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Voldoet
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">
                      Deels
                    </Badge>
                  )}
                  <span className="ml-auto text-[10px] text-muted-foreground">~{r.etaMin} min rijden</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {flag(r.stop.country)} {r.stop.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.stop.road} · {r.stop.city}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{r.stop.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-white ${occupancyMeta[r.stop.occupancy].color}`}>
                    {r.stop.freeSpots}/{r.stop.totalSpots}
                  </span>
                  <ParkingSquare className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{occupancyMeta[r.stop.occupancy].label}</span>
                </div>
                {r.reasons.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {r.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-1 text-[11px] text-emerald-300">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> {reason}
                      </li>
                    ))}
                  </ul>
                )}
                {r.warnings.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {r.warnings.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-1 text-[11px] text-amber-300">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {w}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex gap-2">
                  <Link to="/truckstops/$id" params={{ id: r.stop.id }} className="flex-1">
                    <Button size="sm" className="w-full">
                      <MapPin className="mr-1 h-4 w-4" /> Bekijk parking
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Geen geschikte stops gevonden. Probeer de vraag anders te formuleren.
        </div>
      )}
    </AppShell>
  );
}