import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Star } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import {
  fetchHours,
  fetchTerminals,
  isOpenNow,
  terminalTypes,
  type Terminal,
  type TerminalHour,
  type TerminalType,
} from "@/lib/terminals";

export const Route = createFileRoute("/terminals")({
  head: () => ({
    meta: [
      { title: "Distributiecentra & terminals — TruckMate" },
      {
        name: "description",
        content: "Adressen, openingstijden en faciliteiten van distributiecentra, terminals en havens.",
      },
      { property: "og:title", content: "Distributiecentra & terminals — TruckMate" },
      { property: "og:description", content: "Laad- en losadressen met openingstijden." },
    ],
  }),
  component: TerminalsPage,
});

function TerminalsPage() {
  const [rows, setRows] = useState<Terminal[] | null>(null);
  const [hours, setHours] = useState<TerminalHour[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<TerminalType | "all">("all");
  const [onlyFavs, setOnlyFavs] = useState(false);
  const { isFav, toggle, count } = useFavorites("terminals");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTerminals()
      .then(async (t) => {
        setRows(t);
        setHours(await fetchHours(t.map((x) => x.id)));
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Laden mislukt.");
        setRows([]);
      });
  }, []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (t) =>
        (type === "all" || t.type === type) &&
        (!onlyFavs || isFav(t.id)) &&
        (!needle ||
          t.name.toLowerCase().includes(needle) ||
          (t.city ?? "").toLowerCase().includes(needle) ||
          (t.address ?? "").toLowerCase().includes(needle)),
    );
  }, [rows, q, type, onlyFavs, isFav]);

  return (
    <AppShell title="DC's & terminals">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Zoek op naam, plaats of adres…"
        className="mb-3"
      />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["all", ...Object.keys(terminalTypes)] as (TerminalType | "all")[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${type === t ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}
          >
            {t === "all" ? "Alle" : terminalTypes[t]}
          </button>
        ))}
        <button
          onClick={() => setOnlyFavs((v) => !v)}
          aria-pressed={onlyFavs}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${onlyFavs ? "border-amber-400 bg-amber-400/20 text-amber-300" : "border-border text-muted-foreground"}`}
        >
          ★ Favorieten{count ? ` (${count})` : ""}
        </button>
      </div>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Building2 className="mx-auto mb-2 h-5 w-5" />
          Geen locaties gevonden. Beheerders kunnen locaties toevoegen via het beheerpaneel.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((t) => {
            const open = isOpenNow(hours.filter((h) => h.terminal_id === t.id));
            return (
              <Link key={t.id} to="/terminals/$id" params={{ id: t.id }}>
                <Card className="transition hover:border-primary/60">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{t.name}</p>
                        <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[t.address, t.postal_code, t.city, t.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <Badge
                        className={`shrink-0 text-[10px] ${open ? "bg-emerald-500/20 text-emerald-300" : "bg-muted text-muted-foreground"}`}
                      >
                        {open ? "Nu open" : "Gesloten"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {terminalTypes[t.type]}
                      </Badge>
                      {t.facilities.slice(0, 3).map((f) => (
                        <Badge key={f} variant="outline" className="text-[10px]">
                          {f}
                        </Badge>
                      ))}
                      {t.is_example && (
                        <Badge variant="outline" className="border-amber-500/50 text-[10px] text-amber-400">
                          Voorbeelddata
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
