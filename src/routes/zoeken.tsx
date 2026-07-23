import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ParkingSquare, Fuel, Megaphone, Star } from "lucide-react";
import {
  truckstops,
  fuelStations,
  initialAlerts,
  amenityCategoryMeta,
  flag,
  minAgoLabel,
  occupancyMeta,
  type AmenityCategory,
} from "@/lib/discover-data";

export const Route = createFileRoute("/zoeken")({
  head: () => ({
    meta: [
      { title: "Zoeken — TruckMate" },
      {
        name: "description",
        content: "Zoek in truckstops, tankstations, meldingen en voorzieningen.",
      },
      { property: "og:title", content: "Zoeken — TruckMate" },
      { property: "og:description", content: "Alles doorzoekbaar op één plek." },
    ],
  }),
  component: ZoekenPage,
});

type Tab = "alles" | "parking" | "brandstof" | "meldingen" | "voorzieningen";

function ZoekenPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("alles");
  const term = q.trim().toLowerCase();

  const parkings = useMemo(
    () =>
      truckstops.filter(
        (t) =>
          !term ||
          `${t.name} ${t.city} ${t.road} ${t.amenities.join(" ")}`
            .toLowerCase()
            .includes(term),
      ),
    [term],
  );
  const fuel = useMemo(
    () =>
      fuelStations.filter(
        (s) =>
          !term ||
          `${s.name} ${s.brand} ${s.city} ${s.road}`.toLowerCase().includes(term),
      ),
    [term],
  );
  const alerts = useMemo(
    () =>
      initialAlerts.filter(
        (a) => !term || `${a.location} ${a.text}`.toLowerCase().includes(term),
      ),
    [term],
  );
  const facilities = useMemo(
    () =>
      (Object.entries(amenityCategoryMeta) as [
        AmenityCategory,
        (typeof amenityCategoryMeta)[AmenityCategory],
      ][]).filter(
        ([, m]) =>
          !term ||
          m.label.toLowerCase().includes(term) ||
          m.description.toLowerCase().includes(term),
      ),
    [term],
  );

  const show = (t: Tab) => tab === "alles" || tab === t;
  const empty =
    parkings.length + fuel.length + alerts.length + facilities.length === 0;
  const cap = (arr: unknown[]) => (tab === "alles" ? arr.slice(0, 3) : arr);

  return (
    <AppShell title="Zoeken">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op parking, brand, plaats of voorziening…"
          className="h-12 pl-9 text-base"
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["alles", "parking", "brandstof", "meldingen", "voorzieningen"] as Tab[]).map(
          (t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                tab === t
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ),
        )}
      </div>

      {empty && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {term ? `Geen resultaten voor "${q}".` : "Begin met typen om te zoeken."}
        </div>
      )}

      {show("parking") && parkings.length > 0 && (
        <Section icon={<ParkingSquare className="h-4 w-4" />} title={`Parkings (${parkings.length})`}>
          {(cap(parkings) as typeof parkings).map((t) => (
            <Link key={t.id} to="/truckstops/$id" params={{ id: t.id }}>
              <Card className="transition hover:border-primary/60">
                <CardContent className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {flag(t.country)} {t.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t.road} · {t.city}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 text-white ${occupancyMeta[t.occupancy].color}`}
                    >
                      {t.freeSpots}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{" "}
                      {t.rating.toFixed(1)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </Section>
      )}

      {show("brandstof") && fuel.length > 0 && (
        <Section icon={<Fuel className="h-4 w-4" />} title={`Tankstations (${fuel.length})`}>
          {(cap(fuel) as typeof fuel).map((s) => (
            <Link key={s.id} to="/brandstof">
              <Card className="transition hover:border-primary/60">
                <CardContent className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.brand} · {s.city}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">€ {s.dieselPrice.toFixed(3)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </Section>
      )}

      {show("meldingen") && alerts.length > 0 && (
        <Section icon={<Megaphone className="h-4 w-4" />} title={`Meldingen (${alerts.length})`}>
          {(cap(alerts) as typeof alerts).map((a) => (
            <Link key={a.id} to="/meldingen">
              <Card className="transition hover:border-primary/60">
                <CardContent className="p-3">
                  <p className="text-sm font-semibold">{a.location}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{a.text}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {minAgoLabel(a.createdMinAgo)} · {a.confirms} bevestigingen
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </Section>
      )}

      {show("voorzieningen") && facilities.length > 0 && (
        <Section icon={<Search className="h-4 w-4" />} title={`Voorzieningen (${facilities.length})`}>
          {facilities.map(([c, m]) => (
            <Link key={c} to="/voorzieningen" search={{ cat: c }}>
              <Card className="transition hover:border-primary/60">
                <CardContent className="flex items-center gap-3 p-3">
                  <span className="text-2xl">{m.emoji}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{m.label}</p>
                    <p className="text-[11px] text-muted-foreground">{m.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </Section>
      )}
    </AppShell>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}