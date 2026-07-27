import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Copy, LogOut, MapPin, MessageSquare, Play, StopCircle, Flag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchConvoy,
  fetchConvoyLocations,
  fetchConvoyMembers,
  leaveConvoy,
  pushLocation,
  setConvoyStatus,
  setSharing,
  type Convoy,
  type ConvoyLocation,
  type ConvoyMember,
} from "@/lib/convoy";
import { getOrCreateConvoyConversation } from "@/lib/chat";
import { ReportDialog } from "@/components/report-dialog";
import { initials } from "@/lib/queries";

export const Route = createFileRoute("/konvooi/$id")({
  head: () => ({
    meta: [
      { title: "Konvooi — TruckMate" },
      { name: "description", content: "Deelnemers, status en tijdelijk locatie delen binnen je konvooi." },
      { property: "og:title", content: "Konvooi — TruckMate" },
      { property: "og:description", content: "Konvooidetails en groepschat." },
    ],
  }),
  component: ConvoyDetail,
});

type MiniProfile = { id: string; full_name: string | null; username: string | null; avatar_url: string | null };

const SHARE_MINUTES = 60;

function ConvoyDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convoy, setConvoy] = useState<Convoy | null>(null);
  const [members, setMembers] = useState<ConvoyMember[]>([]);
  const [profiles, setProfiles] = useState<Record<string, MiniProfile>>({});
  const [locations, setLocations] = useState<ConvoyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  const me = members.find((m) => m.user_id === user?.id) ?? null;
  const isLeader = convoy?.leader_id === user?.id;

  const load = useCallback(async () => {
    try {
      const c = await fetchConvoy(id);
      setConvoy(c);
      if (!c) return;
      const ms = await fetchConvoyMembers(id);
      setMembers(ms);
      const ids = ms.map((m) => m.user_id);
      if (ids.length) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", ids);
        setProfiles(Object.fromEntries((data ?? []).map((p) => [p.id, p as MiniProfile])));
      }
      setLocations(await fetchConvoyLocations(id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Konvooi laden mislukt.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`convoy-loc-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "convoy_locations", filter: `convoy_id=eq.${id}` },
        () => {
          void fetchConvoyLocations(id).then(setLocations).catch(() => undefined);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id]);

  // Live locatie delen: alleen zolang de opt-in aan staat en niet verlopen is.
  useEffect(() => {
    const active =
      me?.sharing_location &&
      me.sharing_until &&
      new Date(me.sharing_until).getTime() > Date.now() &&
      user;
    if (!active) {
      if (watchRef.current !== null) {
        navigator.geolocation?.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      return;
    }
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        void pushLocation({
          convoy_id: id,
          user_id: user!.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed_kmh: pos.coords.speed != null ? Math.round(pos.coords.speed * 3.6) : null,
          heading: pos.coords.heading ?? null,
          expires_at: me!.sharing_until!,
        }).catch(() => undefined);
      },
      () => toast.error("Locatie niet beschikbaar — controleer je browserrechten."),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };
  }, [me, id, user]);

  const toggleSharing = async (on: boolean) => {
    if (!user) return;
    try {
      await setSharing(id, user.id, on, SHARE_MINUTES);
      toast.success(on ? `Locatie delen aan voor ${SHARE_MINUTES} minuten.` : "Locatie delen uit.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Wijzigen mislukt.");
    }
  };

  const changeStatus = async (status: Convoy["status"]) => {
    try {
      await setConvoyStatus(id, status);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Status wijzigen mislukt.");
    }
  };

  const leave = async () => {
    if (!user) return;
    try {
      await leaveConvoy(id, user.id);
      toast.success("Je hebt het konvooi verlaten.");
      navigate({ to: "/konvooi" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verlaten mislukt.");
    }
  };

  const openGroupChat = async () => {
    if (!user || !convoy) return;
    try {
      const conv = await getOrCreateConvoyConversation(
        convoy.id,
        convoy.name,
        user.id,
        members.map((m) => m.user_id),
      );
      navigate({ to: "/chat/$chatId", params: { chatId: conv.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Groepschat openen mislukt.");
    }
  };

  if (loading) {
    return (
      <AppShell title="Konvooi">
        <p className="text-sm text-muted-foreground">Laden…</p>
      </AppShell>
    );
  }
  if (error || !convoy) {
    return (
      <AppShell title="Konvooi">
        <p className="text-sm text-destructive">{error ?? "Dit konvooi bestaat niet (meer)."}</p>
        <Button asChild variant="secondary" className="mt-3">
          <Link to="/konvooi">Terug naar konvooien</Link>
        </Button>
      </AppShell>
    );
  }

  const sharingUntil = me?.sharing_until ? new Date(me.sharing_until) : null;
  const sharingActive = Boolean(me?.sharing_location && sharingUntil && sharingUntil.getTime() > Date.now());

  return (
    <AppShell title={convoy.name}>
      <Card className="mb-3">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{convoy.name}</p>
            <Badge
              className={`text-[10px] ${
                convoy.status === "active"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : convoy.status === "ended"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/20 text-primary"
              }`}
            >
              {convoy.status === "active" ? "actief" : convoy.status === "ended" ? "beëindigd" : "gepland"}
            </Badge>
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {convoy.from_location ?? "—"} → {convoy.to_location ?? "—"}
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2 text-xs">
            <span className="text-muted-foreground">Uitnodigingscode:</span>
            <span className="font-mono font-semibold">{convoy.invite_code}</span>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7 px-2"
              onClick={() => {
                void navigator.clipboard?.writeText(convoy.invite_code);
                toast.success("Code gekopieerd.");
              }}
            >
              <Copy className="mr-1 h-3 w-3" /> Kopieer
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={openGroupChat}>
              <MessageSquare className="mr-1 h-4 w-4" /> Groepschat
            </Button>
            {isLeader && convoy.status !== "active" && (
              <Button size="sm" onClick={() => changeStatus("active")}>
                <Play className="mr-1 h-4 w-4" /> Start konvooi
              </Button>
            )}
            {isLeader && convoy.status === "active" && (
              <Button size="sm" variant="destructive" onClick={() => changeStatus("ended")}>
                <StopCircle className="mr-1 h-4 w-4" /> Beëindig konvooi
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-3">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Live locatie delen</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Opt-in, {SHARE_MINUTES} minuten per keer, alleen zichtbaar voor deelnemers van dit konvooi.
              {sharingActive && sharingUntil
                ? ` Actief tot ${sharingUntil.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}.`
                : ""}
            </p>
          </div>
          <Switch checked={sharingActive} onCheckedChange={toggleSharing} aria-label="Locatie delen" />
        </CardContent>
      </Card>

      <h2 className="mb-2 text-sm font-semibold">Deelnemers ({members.length})</h2>
      <div className="space-y-2">
        {members.map((m) => {
          const p = profiles[m.user_id];
          const loc = locations.find((l) => l.user_id === m.user_id);
          const name = p?.full_name ?? p?.username ?? "Chauffeur";
          return (
            <Card key={m.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={p?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {loc
                      ? `Live · ${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}${loc.speed_kmh ? ` · ${loc.speed_kmh} km/u` : ""}`
                      : "Locatie niet gedeeld"}
                  </p>
                </div>
                {m.role === "leader" && <Badge className="bg-primary/20 text-primary text-[10px]">leider</Badge>}
                {m.user_id !== user?.id && (
                  <ReportDialog
                    reportedUserId={m.user_id}
                    contextType="convoy"
                    contextId={convoy.id}
                    trigger={
                      <Button size="icon" variant="ghost" aria-label="Deelnemer melden">
                        <Flag className="h-4 w-4" />
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="mt-4 w-full">
            <LogOut className="mr-1 h-4 w-4" /> Konvooi verlaten
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konvooi verlaten?</AlertDialogTitle>
            <AlertDialogDescription>
              Je gedeelde locatie wordt direct verwijderd en je ziet de groepschat niet meer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={leave}>Verlaten</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
