import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  Crosshair,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
  ExternalLink,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  computeRoute,
  externalNavUrl,
  formatDistance,
  formatDuration,
  geocode,
  reverseGeocode,
  routingProvider,
  type GeocodeHit,
  type RouteResult,
  type Waypoint,
} from "@/lib/routing";

const PlannerMap = lazy(() =>
  import("@/components/planner-map").then((m) => ({ default: m.PlannerMap })),
);

export const Route = createFileRoute("/routeplanner")({
  head: () => ({
    meta: [
      { title: "Routeplanner — TruckMate" },
      {
        name: "description",
        content:
          "Plan een route met tussenstops, bereken afstand en aankomsttijd en sla routes op in je TruckMate-account.",
      },
      { property: "og:title", content: "Routeplanner — TruckMate" },
      {
        property: "og:description",
        content: "Interactieve kaart, adreszoekfunctie en opgeslagen routes voor chauffeurs.",
      },
    ],
  }),
  component: RoutePlannerPage,
});

type WP = Waypoint & { key: string };
const newKey = () => Math.random().toString(36).slice(2, 9);

type SavedRoute = {
  id: string;
  name: string;
  waypoints: Waypoint[];
  distance_m: number | null;
  duration_s: number | null;
  updated_at: string;
};

function RoutePlannerPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [waypoints, setWaypoints] = useState<WP[]>([
    { key: newKey(), label: "", lat: 0, lng: 0 },
    { key: newKey(), label: "", lat: 0, lng: 0 },
  ]);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [computing, setComputing] = useState(false);
  const [saveName, setSaveName] = useState("");

  const savedQ = useQuery({
    queryKey: ["saved_routes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_routes" as any)
        .select("id,name,waypoints,distance_m,duration_s,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavedRoute[];
    },
  });

  // --- Waypoint helpers ---
  const setWP = (i: number, patch: Partial<WP>) =>
    setWaypoints((prev) => prev.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  const addWP = () =>
    setWaypoints((prev) => {
      const copy = [...prev];
      copy.splice(copy.length - 1, 0, { key: newKey(), label: "", lat: 0, lng: 0 });
      return copy;
    });
  const removeWP = (i: number) =>
    setWaypoints((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));
  const moveWP = (i: number, dir: -1 | 1) =>
    setWaypoints((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const reverseAll = () => setWaypoints((prev) => [...prev].reverse());
  const clearAll = () => {
    setWaypoints([
      { key: newKey(), label: "", lat: 0, lng: 0 },
      { key: newKey(), label: "", lat: 0, lng: 0 },
    ]);
    setRoute(null);
  };

  // --- Current location ---
  const useCurrentAsStart = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocatie niet ondersteund op dit apparaat");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLoc({ lat: latitude, lng: longitude });
        let label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          label = await reverseGeocode(latitude, longitude);
        } catch {
          /* fallback ok */
        }
        setWaypoints((prev) => {
          const copy = [...prev];
          copy[0] = { key: copy[0].key, label, lat: latitude, lng: longitude };
          return copy;
        });
        toast.success("Huidige locatie ingesteld als vertrek");
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Locatie geweigerd — sta locatie toe in je browserinstellingen."
            : "Locatie kon niet worden bepaald.";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  // --- Compute route ---
  const filled = waypoints.filter((w) => w.lat !== 0 || w.lng !== 0);
  const canRoute = filled.length >= 2 && filled.length === waypoints.length;

  const doCompute = async () => {
    if (!canRoute) {
      toast.error("Vul minstens vertrek en bestemming in");
      return;
    }
    setComputing(true);
    try {
      const res = await computeRoute(waypoints);
      setRoute(res);
    } catch (e) {
      setRoute(null);
      toast.error(e instanceof Error ? e.message : "Route kon niet worden berekend");
    } finally {
      setComputing(false);
    }
  };

  // --- Save ---
  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Niet ingelogd");
      if (!canRoute) throw new Error("Onvolledige route");
      const name = saveName.trim() || `${waypoints[0].label} → ${waypoints[waypoints.length - 1].label}`;
      const payload = {
        user_id: user.id,
        name,
        waypoints: waypoints.map(({ label, lat, lng }) => ({ label, lat, lng })),
        distance_m: route?.distance_m ? Math.round(route.distance_m) : null,
        duration_s: route?.duration_s ? Math.round(route.duration_s) : null,
      };
      const { error } = await supabase.from("saved_routes" as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved_routes"] });
      setSaveName("");
      toast.success("Route opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const renameMut = useMutation({
    mutationFn: async (v: { id: string; name: string }) => {
      const { error } = await supabase
        .from("saved_routes" as any)
        .update({ name: v.name })
        .eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_routes"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_routes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_routes"] }),
  });

  const loadRoute = (r: SavedRoute) => {
    setWaypoints(r.waypoints.map((w) => ({ ...w, key: newKey() })));
    setRoute(null);
    toast.success(`"${r.name}" geladen — druk op Bereken om opnieuw te berekenen`);
  };

  // --- ETA ---
  const eta =
    route
      ? new Date(Date.now() + route.duration_s * 1000).toLocaleTimeString("nl-NL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <AppShell
      title="Routeplanner"
      demoBanner={
        !routingProvider.supportsTruckProfile
          ? "Route berekend met OpenStreetMap (auto-profiel). Truckbeperkingen (hoogte/gewicht) worden nog niet toegepast."
          : undefined
      }
    >
      {/* Map */}
      <Card className="mb-3 overflow-hidden">
        <div className="h-72 w-full sm:h-96 bg-muted">
          <Suspense
            fallback={
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            }
          >
            <PlannerMap
              waypoints={waypoints.filter((w) => w.lat !== 0 || w.lng !== 0)}
              geometry={route?.geometry ?? null}
              currentLocation={currentLoc}
            />
          </Suspense>
        </div>
      </Card>

      {/* Waypoint editor */}
      <Card className="mb-3">
        <CardContent className="space-y-2 p-4">
          {waypoints.map((w, i) => (
            <AddressRow
              key={w.key}
              index={i}
              total={waypoints.length}
              value={w.label}
              onPick={(hit) =>
                setWP(i, { label: hit.display_name, lat: hit.lat, lng: hit.lng })
              }
              onChangeLabel={(v) => setWP(i, { label: v })}
              onRemove={() => removeWP(i)}
              onMoveUp={() => moveWP(i, -1)}
              onMoveDown={() => moveWP(i, 1)}
            />
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={useCurrentAsStart}>
              <Crosshair className="mr-1 h-4 w-4" /> Huidige locatie
            </Button>
            <Button variant="outline" size="sm" onClick={addWP}>
              <Plus className="mr-1 h-4 w-4" /> Tussenstop
            </Button>
            <Button variant="outline" size="sm" onClick={reverseAll}>
              <ArrowUpDown className="mr-1 h-4 w-4" /> Omkeren
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="mr-1 h-4 w-4" /> Leeg
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Route actions */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Button onClick={doCompute} disabled={computing || !canRoute} className="flex-1 min-w-[140px]">
          {computing ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-4 w-4" />
          )}
          {route ? "Opnieuw berekenen" : "Bereken route"}
        </Button>
        <Button
          variant="outline"
          asChild
          disabled={!canRoute}
        >
          <a
            href={externalNavUrl(waypoints)}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!canRoute}
            className={!canRoute ? "pointer-events-none opacity-50" : ""}
          >
            <Navigation className="mr-1 h-4 w-4" /> Start in Maps
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </div>

      {/* Summary */}
      {route && (
        <Card className="mb-3">
          <CardContent className="p-4">
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <Stat label="Afstand" value={formatDistance(route.distance_m)} />
              <Stat label="Duur" value={formatDuration(route.duration_s)} />
              <Stat label="ETA" value={eta ?? "—"} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Naam voor deze route"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                {saveMut.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                Opslaan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      {route && route.steps.length > 0 && (
        <Card className="mb-3">
          <CardContent className="p-0">
            <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Route-instructies ({route.steps.length})
            </div>
            <ol className="max-h-80 divide-y overflow-y-auto">
              {route.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-2 text-sm">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{s.instruction}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistance(s.distance_m)} · {formatDuration(s.duration_s)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Saved routes */}
      <Card>
        <CardContent className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Opgeslagen routes
          </h2>
          {savedQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : !savedQ.data || savedQ.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nog geen opgeslagen routes. Bereken een route en druk op Opslaan.
            </p>
          ) : (
            <ul className="divide-y">
              {savedQ.data.map((r) => (
                <SavedItem
                  key={r.id}
                  route={r}
                  onLoad={() => loadRoute(r)}
                  onRename={(name) => renameMut.mutate({ id: r.id, name })}
                  onDelete={() => deleteMut.mutate(r.id)}
                />
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Aanbieder: {routingProvider.name}. Adressen via Nominatim (fair-use). Gebruik voor
            productie een dedicated truck-routingprovider.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function AddressRow({
  index,
  total,
  value,
  onPick,
  onChangeLabel,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  total: number;
  value: string;
  onPick: (hit: GeocodeHit) => void;
  onChangeLabel: (v: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const isStart = index === 0;
  const isEnd = index === total - 1;
  const badge = isStart ? "A" : isEnd ? "B" : String(index);
  const color = isStart
    ? "bg-green-500"
    : isEnd
      ? "bg-red-500"
      : "bg-blue-500";

  useEffect(() => {
    if (!value || value.length < 3) {
      setHits([]);
      return;
    }
    const ac = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ac;
    setLoading(true);
    const t = setTimeout(() => {
      geocode(value, ac.signal)
        .then((r) => setHits(r))
        .catch((e) => {
          if ((e as Error).name !== "AbortError") setHits([]);
        })
        .finally(() => setLoading(false));
    }, 350);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [value]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${color} text-xs font-bold text-white`}
        >
          {badge}
        </span>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={isStart ? "Vertrekadres" : isEnd ? "Bestemming" : "Tussenstop"}
            value={value}
            onChange={(e) => {
              onChangeLabel(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
          />
        </div>
        {total > 2 && (
          <>
            <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={index === 0} aria-label="Omhoog">
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={index === total - 1}
              aria-label="Omlaag"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Verwijderen">
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      {open && (hits.length > 0 || loading) && (
        <div className="absolute left-8 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Zoeken…
            </div>
          )}
          {hits.map((h, i) => (
            <button
              key={i}
              type="button"
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(h);
                setOpen(false);
              }}
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-2">{h.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SavedItem({
  route,
  onLoad,
  onRename,
  onDelete,
}: {
  route: SavedRoute;
  onLoad: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(route.name);
  return (
    <li className="py-2">
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" />
            <Button
              size="sm"
              onClick={() => {
                onRename(name.trim() || route.name);
                setEditing(false);
              }}
            >
              Ok
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Annuleer
            </Button>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{route.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {route.waypoints.length} punten
                {route.distance_m ? ` · ${formatDistance(route.distance_m)}` : ""}
                {route.duration_s ? ` · ${formatDuration(route.duration_s)}` : ""}
              </p>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {new Date(route.updated_at).toLocaleDateString("nl-NL")}
            </Badge>
            <Button size="sm" variant="outline" onClick={onLoad}>
              Laden
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Hernoemen">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (confirm(`Route "${route.name}" verwijderen?`)) onDelete();
              }}
              aria-label="Verwijderen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}