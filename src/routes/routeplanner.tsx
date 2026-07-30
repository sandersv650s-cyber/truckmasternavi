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
import { validateVehicle, type Issue, type VehicleClass } from "@/lib/lzv";
import { changeRoutePointLabel, validateRoutePoints } from "@/lib/route-input";

const HereMap = lazy(() =>
  import("@/components/here-map").then((m) => ({ default: m.HereMap })),
);
const HereNavMode = lazy(() =>
  import("@/components/here-nav-mode").then((m) => ({ default: m.HereNavMode })),
);

type PlannerSearch = { destLat?: number; destLng?: number; destLabel?: string };

export const Route = createFileRoute("/routeplanner")({
  validateSearch: (raw: Record<string, unknown>): PlannerSearch => {
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n !== 0 ? n : undefined;
    };
    return {
      destLat: num(raw.destLat),
      destLng: num(raw.destLng),
      destLabel: typeof raw.destLabel === "string" ? raw.destLabel.slice(0, 120) : undefined,
    };
  },
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
  is_lzv?: boolean | null;
  vehicle_snapshot?: { transport_mode?: string | null } | null;
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
  const [vehicleMeta, setVehicleMeta] = useState<{
    has_exemption: boolean;
    exemption_ref: string | null;
    exemption_expires: string | null;
  }>({ has_exemption: false, exemption_ref: null, exemption_expires: null });
  useEffect(() => {
    if (!profileQ.data) return;
    const p = profileQ.data;
    setTruck({
      height_cm: p.vehicle_height_cm,
      width_cm: p.vehicle_width_cm,
      length_cm: p.vehicle_length_cm,
      weight_kg: p.vehicle_weight_kg ?? p.vehicle_max_permitted_weight_kg,
      current_weight_kg: p.vehicle_current_weight_kg,
      axle_weight_kg: p.vehicle_axle_weight_kg,
      axle_count: p.vehicle_axle_count,
      trailer_count: p.vehicle_trailer_count,
      hazardous: p.vehicle_hazardous,
      is_lzv: p.vehicle_is_lzv ?? null,
    });
    setVehicleMeta({
      has_exemption: Boolean(p.vehicle_has_exemption),
      exemption_ref: p.vehicle_exemption_ref ?? null,
      exemption_expires: p.vehicle_exemption_expires ?? null,
    });
    const vt = typeof p.vehicle_type === "string" ? p.vehicle_type.trim() : "";
    setTransportMode(!vt || vt === "truck" ? "truck" : "car");
  }, [profileQ.data]);

  const savedQ = useQuery({
    queryKey: ["saved_routes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_routes" as any)
        .select(
          "id,name,waypoints,distance_m,duration_s,truck_profile,avoid_features,completed,completed_at,updated_at,is_lzv,vehicle_snapshot",
        )
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SavedRoute[];
    },
  });

  const setWP = (i: number, patch: Partial<WP>) =>
    setWaypoints((prev) => prev.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  const setWPLabel = (i: number, label: string) =>
    setWaypoints((prev) =>
      prev.map((w, idx) => (idx === i ? changeRoutePointLabel(w, label) : w)),
    );
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

  const routeIssues = useMemo(() => validateRoutePoints(waypoints), [waypoints]);
  const canRoute = routeIssues.length === 0 && here.ready;

  const vehicleIssues: Issue[] = useMemo(() => {
    if (transportMode !== "truck") return [];
    const vehicleClass: VehicleClass = truck.is_lzv
      ? "lzv"
      : vehicleMeta.has_exemption
        ? "exceptional"
        : "truck";
    return validateVehicle({
      vehicleClass,
      length_cm: truck.length_cm,
      width_cm: truck.width_cm,
      height_cm: truck.height_cm,
      weight_kg: truck.weight_kg,
      current_weight_kg: truck.current_weight_kg,
      axle_weight_kg: truck.axle_weight_kg,
      axle_count: truck.axle_count,
      trailer_count: truck.trailer_count,
      has_exemption: vehicleMeta.has_exemption,
      exemption_ref: vehicleMeta.exemption_ref,
      exemption_expires: vehicleMeta.exemption_expires,
    });
  }, [transportMode, truck, vehicleMeta]);
  const vehicleErrors = vehicleIssues.filter((i) => i.level === "error");
  const vehicleWarnings = vehicleIssues.filter((i) => i.level === "warning");

  const selectedRoute =
    routes.find((r) => r.id === selectedRouteId) ?? routes[0] ?? null;

  const doCompute = async (opts?: { alternatives?: number }) => {
    if (!here.ready) {
      toast.error("HERE API-sleutel ontbreekt");
      return;
    }
    const inputIssues = validateRoutePoints(waypoints);
    if (inputIssues.length) {
      toast.error(inputIssues[0].message);
      return;
    }
    setComputing(true);
    setComputeError(null);
    if (transportMode === "truck" && vehicleErrors.length) {
      toast.warning(
        `Voertuigprofiel onvolledig: ${vehicleErrors[0].message} HERE rekent verder met de wél ingevulde waarden.`,
      );
    }
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

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Niet ingelogd");
      const inputIssues = validateRoutePoints(waypoints);
      if (inputIssues.length) throw new Error(inputIssues[0].message);
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
        is_lzv: transportMode === "truck" ? Boolean(truck.is_lzv) : false,
        vehicle_snapshot: {
          transport_mode: transportMode,
          ...(transportMode === "truck" ? { truck, exemption: vehicleMeta } : {}),
        },
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
      if (!user) throw new Error("Niet ingelogd");
      const { error } = await supabase
        .from("saved_routes" as any)
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_routes"] }),
  });

  const renameMut = useMutation({
    mutationFn: async (v: { id: string; name: string }) => {
      if (!user) throw new Error("Niet ingelogd");
      const { error } = await supabase
        .from("saved_routes" as any)
        .update({ name: v.name })
        .eq("id", v.id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_routes"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Niet ingelogd");
      const { error } = await supabase
        .from("saved_routes" as any)
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_routes"] }),
  });

  const loadRoute = (r: SavedRoute) => {
    const raw: unknown[] = Array.isArray(r.waypoints) ? r.waypoints : [];
    const parsed: WP[] = [];
    for (const item of raw) {
      const w = (item ?? {}) as { lat?: unknown; lng?: unknown; label?: unknown };
      const lat = Number(w.lat);
      const lng = Number(w.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (lat === 0 && lng === 0) continue;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
      const label =
        typeof w.label === "string" && w.label.trim()
          ? w.label.trim()
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      parsed.push({ key: newKey(), label, lat, lng });
    }
    if (parsed.length < 2) {
      toast.error(
        `"${r.name}" kon niet worden geladen: de opgeslagen route bevat geen geldige vertrek- en bestemmingslocatie.`,
      );
      return;
    }
    setWaypoints(parsed);
    const snapMode = r.vehicle_snapshot?.transport_mode;
    const restoredMode: TransportMode =
      snapMode === "car" || snapMode === "truck"
        ? snapMode
        : r.truck_profile && typeof r.truck_profile === "object"
          ? "truck"
          : "car";
    setTransportMode(restoredMode);
    if (r.truck_profile && typeof r.truck_profile === "object") {
      const tp = r.truck_profile as TruckProfile;
      setTruck({ ...tp, is_lzv: tp.is_lzv ?? Boolean(r.is_lzv) });
    }
    if (Array.isArray(r.avoid_features) && r.avoid_features.length)
      setAvoid(
        r.avoid_features.filter(
          (f): f is AvoidFeature => typeof f === "string" && f in AVOID_LABELS,
        ),
      );
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
              onChangeLabel={(v) => setWPLabel(i, v)}
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
          {showProfilePanel && <div />}
        </CardContent>
      </Card>

      <Card className="mb-3">
        <CardContent className="space-y-3 p-4">
          {routeIssues.length > 0 && (
            <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
              <p className="font-medium">Controleer de route-invoer</p>
              <p className="mt-1 text-xs text-muted-foreground">{routeIssues[0].message}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void doCompute()} disabled={!canRoute || computing}>
              {computing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
              Bereken
            </Button>
            <Button variant="outline" onClick={() => void doCompute({ alternatives: 3 })} disabled={!canRoute || computing}>
              Alternatieven
            </Button>
          </div>
          {computeError && <p className="text-sm text-destructive">{computeError}</p>}
        </CardContent>
      </Card>

      {selectedRoute && (
        <Card className="mb-3">
          <CardContent className="space-y-3 p-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Afstand" value={formatDistance(selectedRoute.distance_m)} />
              <Stat label="Duur" value={formatDuration(selectedRoute.duration_s)} />
              <Stat label="ETA" value={etaString(selectedRoute.duration_s)} />
            </div>
            {warnings.length > 0 && (
              <ul className="space-y-1 text-xs text-yellow-200">
                {warnings.map((w, i) => <li key={i}>• {w}</li>)}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Naam van route" />
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                <Save className="mr-2 h-4 w-4" /> Opslaan
              </Button>
              <Button variant="outline" onClick={startNav}>
                <Navigation className="mr-2 h-4 w-4" /> Start navigatie
              </Button>
              <Button variant="ghost">
                <Share2 className="mr-2 h-4 w-4" /> Delen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Opgeslagen routes
          </h2>
          {savedQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : !savedQ.data || savedQ.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen opgeslagen routes.</p>
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
        </CardContent>
      </Card>

      {navMode && selectedRoute && (
        <Suspense fallback={null}>
          <HereNavMode
            route={selectedRoute}
            waypoints={waypoints.map((w) => ({ lat: w.lat, lng: w.lng, label: w.label }))}
            onStop={() => setNavMode(false)}
            onReroute={rerouteFrom}
          />
        </Suspense>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="text-lg font-bold tabular-nums">{value}</p></div>;
}

function NumField({ label, v, on }: { label: string; v: number | null | undefined; on: (n: number | null) => void }) {
  return <div><Label className="text-xs">{label}</Label><Input type="number" value={v ?? ""} onChange={(e) => on(e.target.value ? Number(e.target.value) : null)} /></div>;
}

function AddressRow({ index, total, value, biasAt, onPick, onChangeLabel, onRemove, onMoveUp, onMoveDown }: { index: number; total: number; value: string; biasAt: LatLng | null; onPick: (pt: LatLng, label: string) => void; onChangeLabel: (v: string) => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void; }) {
  const [hits, setHits] = useState<HereSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hereReady = useHereKey().ready;
  useEffect(() => {
    if (!hereReady || !value || value.length < 2) return;
    const ac = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ac;
    setLoading(true);
    const t = setTimeout(() => {
      autosuggest(value, biasAt ?? undefined, ac.signal)
        .then((r) => setHits(r))
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => { clearTimeout(t); ac.abort(); };
  }, [value, biasAt, hereReady]);
  const pick = async (h: HereSuggestion) => {
    let pos = h.position ?? null;
    if (!pos) pos = await lookupSuggestion(h);
    if (!pos) return toast.error("Locatie niet gevonden");
    onPick(pos, h.address ?? h.title);
    setOpen(false);
  };
  return <div className="relative"><div className="flex items-center gap-2"><Input value={value} onChange={(e) => { onChangeLabel(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} />{total > 2 && <><Button variant="ghost" size="icon" onClick={onMoveUp} disabled={index === 0}><ChevronUp className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={onMoveDown} disabled={index === total - 1}><ChevronDown className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button></>}</div>{open && (hits.length > 0 || loading) && <div className="absolute z-30 mt-1 w-full rounded-md border bg-popover">{loading && <div className="p-2 text-xs">Zoeken…</div>}{hits.map((h) => <button key={h.id} type="button" className="block w-full p-2 text-left" onMouseDown={(e) => { e.preventDefault(); void pick(h); }}><MapPin className="mr-2 inline h-3.5 w-3.5" />{h.title}</button>)}</div>}</div>;
}

function SavedItem({ route, onLoad, onRename, onDelete, onComplete }: { route: SavedRoute; onLoad: () => void; onRename: (name: string) => void; onDelete: () => void; onComplete: () => void; }) {
  return <li className="py-2"><div className="flex items-center gap-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{route.name}</p><p className="text-xs text-muted-foreground">{route.waypoints.length} punten</p></div><Button size="sm" variant="outline" onClick={onLoad}>Laden</Button><Button size="icon" variant="ghost" onClick={() => onRename(route.name)}><RefreshCw className="h-4 w-4" /></Button>{!route.completed && <Button size="icon" variant="ghost" onClick={onComplete}><Save className="h-4 w-4" /></Button>}<Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button></div></li>;
}
