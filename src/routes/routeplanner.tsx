import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Truck,
  Settings2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useHereKey } from "@/lib/use-here-key";
import {
  autosuggest,
  computeRoutes,
  etaString,
  formatDistance,
  formatDuration,
  lookupSuggestion,
  reverseGeocode,
  type AvoidFeature,
  type HereRoute,
  type HereSuggestion,
  type LatLng,
  type TransportMode,
  type TruckProfile,
} from "@/lib/here";

const HereMap = lazy(() =>
  import("@/components/here-map").then((m) => ({ default: m.HereMap })),
);
const HereNavMode = lazy(() =>
  import("@/components/here-nav-mode").then((m) => ({ default: m.HereNavMode })),
);

export const Route = createFileRoute("/routeplanner")({
  head: () => ({
    meta: [
      { title: "Routeplanner — TruckMate" },
      {
        name: "description",
        content:
          "Truck-veilige routes met HERE Technologies: hoogte, gewicht, ADR, tolwegen en alternatieven — allemaal in de app.",
      },
      { property: "og:title", content: "Routeplanner — TruckMate" },
      {
        property: "og:description",
        content: "In-app truck-navigatie op basis van HERE Maps en HERE Routing.",
      },
    ],
  }),
  component: RoutePlannerPage,
});

type PlannerSearch = { destLat?: number; destLng?: number; destLabel?: string };

Route.options.validateSearch = (raw: Record<string, unknown>): PlannerSearch => {
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n !== 0 ? n : undefined;
  };
  return {
    destLat: num(raw.destLat),
    destLng: num(raw.destLng),
    destLabel: typeof raw.destLabel === "string" ? raw.destLabel.slice(0, 120) : undefined,
  };
};

type WP = { key: string; label: string; lat: number; lng: number };
const newKey = () => Math.random().toString(36).slice(2, 9);
const emptyWP = (): WP => ({ key: newKey(), label: "", lat: 0, lng: 0 });

type SavedRoute = {
  id: string;
  name: string;
  waypoints: { label: string; lat: number; lng: number }[];
  distance_m: number | null;
  duration_s: number | null;
  truck_profile: TruckProfile | null;
  avoid_features: string[] | null;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
};

const AVOID_LABELS: Record<AvoidFeature, string> = {
  tollRoad: "Tolwegen",
  controlledAccessHighway: "Snelwegen",
  ferry: "Veerboten",
  tunnel: "Tunnels",
  dirtRoad: "Onverharde wegen",
  difficultTurns: "Moeilijke bochten",
  uTurns: "U-bochten",
};

function RoutePlannerPage() {
  const { user } = useAuth();
  const search = Route.useSearch() as PlannerSearch;
  const here = useHereKey();
  const qc = useQueryClient();

  const [waypoints, setWaypoints] = useState<WP[]>([emptyWP(), emptyWP()]);
  useEffect(() => {
    if (search.destLat == null || search.destLng == null) return;
    setWaypoints((wps) => {
      const next = [...wps];
      next[next.length - 1] = {
        key: newKey(),
        label: search.destLabel ?? "Bestemming",
        lat: search.destLat!,
        lng: search.destLng!,
      };
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.destLat, search.destLng]);
  const [routes, setRoutes] = useState<HereRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [currentLoc, setCurrentLoc] = useState<LatLng | null>(null);
  const [computing, setComputing] = useState(false);
  const [computeError, setComputeError] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");
  const [navMode, setNavMode] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>("truck");
  const [avoid, setAvoid] = useState<AvoidFeature[]>(["dirtRoad"]);

  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const [truck, setTruck] = useState<TruckProfile>({});
  useEffect(() => {
    if (!profileQ.data) return;
    const p = profileQ.data;
    setTruck({
      height_cm: p.vehicle_height_cm,
      width_cm: p.vehicle_width_cm,
      length_cm: p.vehicle_length_cm,
      weight_kg: p.vehicle_weight_kg,
      axle_weight_kg: p.vehicle_axle_weight_kg,
      axle_count: p.vehicle_axle_count,
      trailer_count: p.vehicle_trailer_count,
      hazardous: p.vehicle_hazardous,
    });
    if (p.vehicle_type && p.vehicle_type !== "truck") setTransportMode("car");
  }, [profileQ.data]);

  const savedQ = useQuery({
    queryKey: ["saved_routes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_routes" as any)
        .select(
          "id,name,waypoints,distance_m,duration_s,truck_profile,avoid_features,completed,completed_at,updated_at",
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SavedRoute[];
    },
  });

  // --- Waypoint helpers ---
  const setWP = (i: number, patch: Partial<WP>) =>
    setWaypoints((prev) => prev.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  const addWP = () =>
    setWaypoints((prev) => {
      const copy = [...prev];
      copy.splice(copy.length - 1, 0, emptyWP());
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
    setWaypoints([emptyWP(), emptyWP()]);
    setRoutes([]);
    setSelectedRouteId(null);
    setComputeError(null);
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
        if (here.ready) {
          try { label = await reverseGeocode({ lat: latitude, lng: longitude }); } catch { /* keep coords */ }
        }
        setWaypoints((prev) => {
          const copy = [...prev];
          copy[0] = { key: copy[0].key, label, lat: latitude, lng: longitude };
          return copy;
        });
        toast.success("Huidige locatie ingesteld als vertrek");
      },
      (err) => {
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Locatietoegang geweigerd — sta locatie toe in je browser."
            : "Locatie kon niet worden bepaald.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const filled = waypoints.filter((w) => w.lat !== 0 || w.lng !== 0);
  const canRoute = filled.length >= 2 && filled.length === waypoints.length && here.ready;
  const selectedRoute =
    routes.find((r) => r.id === selectedRouteId) ?? routes[0] ?? null;

  const doCompute = async (opts?: { alternatives?: number }) => {
    if (!here.ready) {
      toast.error("HERE API-sleutel ontbreekt");
      return;
    }
    if (!canRoute) {
      toast.error("Vul minstens vertrek en bestemming in");
      return;
    }
    setComputing(true);
    setComputeError(null);
    if (!navigator.onLine) {
      setComputing(false);
      setComputeError("Geen internetverbinding — routes vereisen HERE online.");
      return;
    }
    try {
      const via = waypoints.slice(1, -1).map((w) => ({ lat: w.lat, lng: w.lng }));
      const res = await computeRoutes({
        origin: { lat: waypoints[0].lat, lng: waypoints[0].lng },
        destination: {
          lat: waypoints[waypoints.length - 1].lat,
          lng: waypoints[waypoints.length - 1].lng,
        },
        via,
        transportMode,
        truck: transportMode === "truck" ? truck : undefined,
        avoid,
        alternatives: opts?.alternatives ?? 2,
      });
      setRoutes(res);
      setSelectedRouteId(res[0]?.id ?? null);
    } catch (e) {
      setRoutes([]);
      setSelectedRouteId(null);
      setComputeError(e instanceof Error ? e.message : "Route kon niet worden berekend");
    } finally {
      setComputing(false);
    }
  };

  // Reroute from a live position (used by nav mode)
  const rerouteFrom = async (from: LatLng): Promise<HereRoute | null> => {
    if (waypoints.length < 2) return null;
    try {
      const via = waypoints.slice(1, -1).map((w) => ({ lat: w.lat, lng: w.lng }));
      const res = await computeRoutes({
        origin: from,
        destination: {
          lat: waypoints[waypoints.length - 1].lat,
          lng: waypoints[waypoints.length - 1].lng,
        },
        via,
        transportMode,
        truck: transportMode === "truck" ? truck : undefined,
        avoid,
        alternatives: 0,
      });
      return res[0] ?? null;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Herberekenen mislukt");
      return null;
    }
  };

  // --- Save ---
  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Niet ingelogd");
      if (!canRoute) throw new Error("Onvolledige route");
      const name =
        saveName.trim() || `${waypoints[0].label} → ${waypoints[waypoints.length - 1].label}`;
      const payload = {
        user_id: user.id,
        name,
        waypoints: waypoints.map(({ label, lat, lng }) => ({ label, lat, lng })),
        distance_m: selectedRoute ? Math.round(selectedRoute.distance_m) : null,
        duration_s: selectedRoute ? Math.round(selectedRoute.duration_s) : null,
        truck_profile: transportMode === "truck" ? truck : null,
        avoid_features: avoid,
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

  const completeMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("saved_routes" as any)
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_routes"] }),
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
    if (r.truck_profile) setTruck(r.truck_profile);
    if (r.avoid_features && r.avoid_features.length) setAvoid(r.avoid_features as AvoidFeature[]);
    setRoutes([]);
    setSelectedRouteId(null);
    toast.success(`"${r.name}" geladen — druk op Bereken`);
  };

  const startNav = async () => {
    if (!selectedRoute) return;
    if (typeof navigator !== "undefined" && !navigator.geolocation) {
      toast.error("Geolocatie niet ondersteund");
      return;
    }
    setNavMode(true);
  };

  // Warnings summary
  const warnings = useMemo(() => {
    const w = selectedRoute?.notices ?? [];
    return w.slice(0, 8);
  }, [selectedRoute]);

  const toggleAvoid = (f: AvoidFeature) =>
    setAvoid((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  return (
    <AppShell title="Routeplanner">
      {!here.ready && !here.loading && (
        <Card className="mb-3 border-yellow-500/40 bg-yellow-500/10">
          <CardContent className="flex items-start gap-2 p-3 text-xs text-yellow-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">HERE Maps setup vereist (admin)</p>
              <p>
                De kaartsleutel kon niet worden geladen. Vernieuw de pagina;
                blijft dit staan, dan moet de beheerder de secret
                <code className="mx-1">HERE_API_KEY</code> controleren.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card className="mb-3 overflow-hidden">
        <div className="h-72 w-full bg-muted sm:h-96">
          <Suspense
            fallback={
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            }
          >
            <HereMap
              waypoints={waypoints
                .filter((w) => w.lat !== 0 || w.lng !== 0)
                .map((w) => ({ lat: w.lat, lng: w.lng, label: w.label }))}
              routes={routes}
              selectedRouteId={selectedRouteId ?? undefined}
              onSelectRoute={setSelectedRouteId}
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
              biasAt={currentLoc}
              onPick={(pt, label) => setWP(i, { label, lat: pt.lat, lng: pt.lng })}
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

      {/* Truck profile + avoid */}
      <Card className="mb-3">
        <CardContent className="p-4">
          <button
            className="flex w-full items-center justify-between text-left text-sm font-semibold"
            onClick={() => setShowProfilePanel((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Voertuigprofiel & voorkeuren
              <Badge variant={transportMode === "truck" ? "default" : "secondary"} className="text-[10px]">
                {transportMode === "truck" ? "Vrachtwagen" : "Auto"}
              </Badge>
            </span>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </button>
          {showProfilePanel && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={transportMode === "truck" ? "default" : "outline"}
                  onClick={() => setTransportMode("truck")}
                >
                  Vrachtwagen
                </Button>
                <Button
                  size="sm"
                  variant={transportMode === "car" ? "default" : "outline"}
                  onClick={() => setTransportMode("car")}
                >
                  Auto/bestelwagen
                </Button>
              </div>
              {transportMode === "truck" && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <NumField label="Hoogte (cm)" v={truck.height_cm} on={(n) => setTruck({ ...truck, height_cm: n })} />
                  <NumField label="Breedte (cm)" v={truck.width_cm} on={(n) => setTruck({ ...truck, width_cm: n })} />
                  <NumField label="Lengte (cm)" v={truck.length_cm} on={(n) => setTruck({ ...truck, length_cm: n })} />
                  <NumField label="Gewicht (kg)" v={truck.weight_kg} on={(n) => setTruck({ ...truck, weight_kg: n })} />
                  <NumField label="Aslast (kg)" v={truck.axle_weight_kg} on={(n) => setTruck({ ...truck, axle_weight_kg: n })} />
                  <NumField label="Assen" v={truck.axle_count} on={(n) => setTruck({ ...truck, axle_count: n })} />
                  <NumField label="Aanhangers" v={truck.trailer_count} on={(n) => setTruck({ ...truck, trailer_count: n })} />
                  <div>
                    <Label className="text-xs">Tunnelcategorie</Label>
                    <select
                      className="mt-1 block h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      value={truck.tunnel_category ?? ""}
                      onChange={(e) =>
                        setTruck({ ...truck, tunnel_category: (e.target.value || null) as any })
                      }
                    >
                      <option value="">—</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                  </div>
                  <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(truck.hazardous)}
                      onChange={(e) => setTruck({ ...truck, hazardous: e.target.checked })}
                    />
                    Gevaarlijke lading (ADR)
                  </label>
                </div>
              )}
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Vermijden</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(AVOID_LABELS) as AvoidFeature[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleAvoid(f)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        avoid.includes(f)
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {AVOID_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route actions */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          onClick={() => doCompute()}
          disabled={computing || !canRoute}
          className="min-w-[140px] flex-1"
        >
          {computing ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-4 w-4" />
          )}
          {routes.length ? "Opnieuw berekenen" : "Bereken route"}
        </Button>
        <Button
          variant="default"
          disabled={!selectedRoute}
          onClick={startNav}
          className="min-w-[140px] flex-1"
        >
          <Navigation className="mr-1 h-4 w-4" /> Start navigatie
        </Button>
      </div>

      {computeError && (
        <Card className="mb-3 border-destructive/40 bg-destructive/10">
          <CardContent className="flex items-start gap-2 p-3 text-xs text-destructive-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{computeError}</span>
          </CardContent>
        </Card>
      )}

      {/* Alternatives */}
      {routes.length > 1 && (
        <Card className="mb-3">
          <CardContent className="p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Alternatieven ({routes.length})
            </p>
            <div className="flex gap-2 overflow-x-auto">
              {routes.map((r, i) => {
                const active = r.id === (selectedRouteId ?? routes[0].id);
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRouteId(r.id)}
                    className={`min-w-[130px] rounded-lg border p-2 text-left text-xs ${
                      active ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <p className="font-semibold">Route {i + 1}{i === 0 ? " (snelste)" : ""}</p>
                    <p>{formatDistance(r.distance_m)} · {formatDuration(r.duration_s)}</p>
                    {r.traffic_delay_s > 60 && (
                      <p className="text-yellow-400">+{formatDuration(r.traffic_delay_s)} verkeer</p>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedRoute && (
        <Card className="mb-3">
          <CardContent className="p-4">
            <div className="mb-3 grid grid-cols-4 gap-2 text-center">
              <Stat label="Afstand" value={formatDistance(selectedRoute.distance_m)} />
              <Stat label="Duur" value={formatDuration(selectedRoute.duration_s)} />
              <Stat label="ETA" value={etaString(selectedRoute.duration_s)} />
              <Stat
                label="Verkeer"
                value={
                  selectedRoute.traffic_delay_s > 60
                    ? `+${formatDuration(selectedRoute.traffic_delay_s)}`
                    : "0 min"
                }
              />
            </div>
            {warnings.length > 0 && (
              <div className="mb-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-100">
                <p className="mb-1 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" /> Waarschuwingen ({warnings.length})
                </p>
                <ul className="list-inside list-disc space-y-0.5">
                  {warnings.map((n, i) => (
                    <li key={i}>{n.title}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Naam voor deze route"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !user}>
                {saveMut.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                Opslaan
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!selectedRoute) return;
                  const wps = waypoints.filter((w) => w.lat !== 0 || w.lng !== 0);
                  const text = `${wps[0]?.label ?? "Vertrek"} → ${wps[wps.length - 1]?.label ?? "Bestemming"} · ${formatDistance(selectedRoute.distance_m)} · ${formatDuration(selectedRoute.duration_s)} · ETA ${etaString(selectedRoute.duration_s)}`;
                  try {
                    if (typeof navigator !== "undefined" && (navigator as any).share) {
                      await (navigator as any).share({ title: "TruckMate route", text });
                    } else {
                      await navigator.clipboard.writeText(text);
                      toast.success("Route gekopieerd naar klembord");
                    }
                  } catch {
                    /* user cancelled */
                  }
                }}
              >
                <Share2 className="mr-1 h-4 w-4" /> Delen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      {selectedRoute && selectedRoute.maneuvers.length > 0 && (
        <Card className="mb-3">
          <CardContent className="p-0">
            <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Route-instructies ({selectedRoute.maneuvers.length})
            </div>
            <ol className="max-h-80 divide-y overflow-y-auto">
              {selectedRoute.maneuvers.map((s, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-2 text-sm">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p>{s.instruction}</p>
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
                  onComplete={() => completeMut.mutate(r.id)}
                />
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Aanbieder: HERE Technologies (Maps + Routing v8). Truck-parameters worden meegestuurd.
          </p>
        </CardContent>
      </Card>

      {navMode && selectedRoute && (
        <Suspense fallback={null}>
          <HereNavMode
            route={selectedRoute}
            waypoints={waypoints
              .filter((w) => w.lat !== 0 || w.lng !== 0)
              .map((w) => ({ lat: w.lat, lng: w.lng, label: w.label }))}
            onStop={() => setNavMode(false)}
            onReroute={rerouteFrom}
          />
        </Suspense>
      )}
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

function NumField({
  label,
  v,
  on,
}: {
  label: string;
  v: number | null | undefined;
  on: (n: number | null) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        className="mt-1 h-9"
        value={v ?? ""}
        onChange={(e) => on(e.target.value ? Number(e.target.value) : null)}
      />
    </div>
  );
}

function AddressRow({
  index,
  total,
  value,
  biasAt,
  onPick,
  onChangeLabel,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  total: number;
  value: string;
  biasAt: LatLng | null;
  onPick: (pt: LatLng, label: string) => void;
  onChangeLabel: (v: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [hits, setHits] = useState<HereSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const isStart = index === 0;
  const isEnd = index === total - 1;
  const badge = isStart ? "A" : isEnd ? "B" : String(index);
  const color = isStart ? "bg-green-500" : isEnd ? "bg-red-500" : "bg-blue-500";
  const hereReady = useHereKey().ready;

  useEffect(() => {
    if (!hereReady) return;
    if (!value || value.length < 2) {
      setHits([]);
      return;
    }
    const ac = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ac;
    setLoading(true);
    const t = setTimeout(() => {
      autosuggest(value, biasAt ?? undefined, ac.signal)
        .then((r) => setHits(r))
        .catch((e) => {
          if ((e as Error).name !== "AbortError") setHits([]);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [value, biasAt, hereReady]);

  const pick = async (h: HereSuggestion) => {
    let pos = h.position ?? null;
    if (!pos) pos = await lookupSuggestion(h);
    if (!pos) {
      toast.error("Locatie niet gevonden");
      return;
    }
    onPick(pos, h.address ?? h.title);
    setOpen(false);
  };

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
          {hits.map((h) => (
            <button
              key={h.id}
              type="button"
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => {
                e.preventDefault();
                void pick(h);
              }}
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate font-medium">{h.title}</p>
                {h.address && h.address !== h.title && (
                  <p className="truncate text-xs text-muted-foreground">{h.address}</p>
                )}
              </div>
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
  onComplete,
}: {
  route: SavedRoute;
  onLoad: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onComplete: () => void;
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
              <p className="truncate text-sm font-medium">
                {route.name}
                {route.completed && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    Voltooid
                  </Badge>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {route.waypoints.length} punten
                {route.distance_m ? ` · ${formatDistance(route.distance_m)}` : ""}
                {route.duration_s ? ` · ${formatDuration(route.duration_s)}` : ""}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={onLoad}>
              Laden
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Hernoemen">
              <RefreshCw className="h-4 w-4" />
            </Button>
            {!route.completed && (
              <Button size="icon" variant="ghost" onClick={onComplete} aria-label="Markeer voltooid">
                <Save className="h-4 w-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Verwijderen">
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}