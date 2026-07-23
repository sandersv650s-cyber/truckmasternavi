import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navigation, X, RefreshCw, AlertTriangle } from "lucide-react";
import {
  formatDistance,
  formatDuration,
  etaString,
  haversine_m,
  nearestOnPolyline,
  remainingAlong,
  type HereRoute,
  type LatLng,
} from "@/lib/here";
import { HereMap } from "@/components/here-map";

type Props = {
  route: HereRoute;
  waypoints: { lat: number; lng: number; label: string }[];
  onStop: () => void;
  onReroute: (from: LatLng) => Promise<HereRoute | null>;
};

const OFF_ROUTE_M = 60; // meters from polyline to trigger off-route
const AUTO_REROUTE_STREAK = 4; // consecutive off-route samples before reroute

export function HereNavMode({ route: initialRoute, waypoints, onStop, onReroute }: Props) {
  const [route, setRoute] = useState<HereRoute>(initialRoute);
  const [pos, setPos] = useState<LatLng | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [offRoute, setOffRoute] = useState(false);
  const [rerouting, setRerouting] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);
  const offStreakRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermError("Geolocatie niet ondersteund op dit apparaat.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        if (p.coords.heading != null && !Number.isNaN(p.coords.heading)) setHeading(p.coords.heading);
      },
      (err) => {
        setPermError(
          err.code === err.PERMISSION_DENIED
            ? "Locatietoegang geweigerd. Sta locatie toe in je browser om te navigeren."
            : "Locatie kon niet worden bepaald.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    watchIdRef.current = id;
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Progress along route
  const progress = useMemo(() => {
    if (!pos || route.polyline.length < 2)
      return {
        index: 0,
        distanceFromRoute: 0,
        remaining_m: route.distance_m,
        remaining_s: route.duration_s,
        nextManeuver: route.maneuvers[0] ?? null,
        distanceToNext_m: 0,
      };
    const near = nearestOnPolyline(pos, route.polyline);
    const remaining_m = remainingAlong(route.polyline, near.index) + near.distance_m;
    const speedFactor = route.duration_s / Math.max(1, route.distance_m);
    const remaining_s = Math.round(remaining_m * speedFactor);
    const next =
      route.maneuvers.find((m) => m.offset > near.index) ??
      route.maneuvers[route.maneuvers.length - 1] ??
      null;
    let distanceToNext_m = 0;
    if (next) {
      const end = Math.min(next.offset, route.polyline.length - 1);
      for (let i = near.index; i < end; i++)
        distanceToNext_m += haversine_m(route.polyline[i], route.polyline[i + 1]);
    }
    return {
      index: near.index,
      distanceFromRoute: near.distance_m,
      remaining_m,
      remaining_s,
      nextManeuver: next,
      distanceToNext_m,
    };
  }, [pos, route]);

  // Off-route detection + auto-reroute
  useEffect(() => {
    if (!pos) return;
    if (progress.distanceFromRoute > OFF_ROUTE_M) {
      offStreakRef.current += 1;
      if (offStreakRef.current >= AUTO_REROUTE_STREAK && !rerouting) {
        setOffRoute(true);
        void doReroute();
      }
    } else {
      offStreakRef.current = 0;
      if (offRoute) setOffRoute(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, progress.distanceFromRoute]);

  async function doReroute() {
    if (!pos || rerouting) return;
    setRerouting(true);
    try {
      const r = await onReroute(pos);
      if (r) {
        setRoute(r);
        setOffRoute(false);
        offStreakRef.current = 0;
      }
    } finally {
      setRerouting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background pb-[env(safe-area-inset-bottom)]">
      {/* Top maneuver banner */}
      <div className="flex items-start gap-3 border-b bg-primary/95 p-4 text-primary-foreground shadow-lg">
        <Navigation className="mt-0.5 h-6 w-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest opacity-80">Volgende manoeuvre</p>
          <p className="line-clamp-2 text-base font-semibold">
            {progress.nextManeuver?.instruction ?? "Volg de route"}
          </p>
          {progress.nextManeuver && (
            <p className="text-xs opacity-90">over {formatDistance(progress.distanceToNext_m)}</p>
          )}
        </div>
        <Button variant="secondary" size="icon" onClick={onStop} aria-label="Stop navigatie">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Map */}
      <div className="relative min-h-0 flex-1">
        <HereMap
          waypoints={waypoints}
          routes={[route]}
          currentLocation={pos}
          heading={heading}
          followMode
        />
        {(offRoute || rerouting) && (
          <Card className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2 border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100">
            <AlertTriangle className="h-4 w-4" />
            {rerouting ? "Route wordt opnieuw berekend…" : "Van de route af"}
          </Card>
        )}
        {permError && (
          <Card className="absolute left-1/2 top-3 max-w-[90%] -translate-x-1/2 border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive-foreground">
            {permError}
          </Card>
        )}
      </div>

      {/* Bottom summary */}
      <div className="grid grid-cols-4 gap-1 border-t bg-card p-3 text-center text-sm">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Resterend</p>
          <p className="font-bold tabular-nums">{formatDistance(progress.remaining_m)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Tijd</p>
          <p className="font-bold tabular-nums">{formatDuration(progress.remaining_s)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">ETA</p>
          <p className="font-bold tabular-nums">{etaString(progress.remaining_s)}</p>
        </div>
        <div className="flex items-center justify-center">
          <Button size="sm" variant="outline" onClick={doReroute} disabled={rerouting || !pos}>
            <RefreshCw className={`mr-1 h-3 w-3 ${rerouting ? "animate-spin" : ""}`} />
            Herbereken
          </Button>
        </div>
      </div>
    </div>
  );
}