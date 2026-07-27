import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, ShieldCheck, Plus, LogIn, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { createConvoy, fetchMyConvoys, joinConvoyByCode, type Convoy } from "@/lib/convoy";

export const Route = createFileRoute("/konvooi")({
  head: () => ({
    meta: [
      { title: "Konvooi rijden — TruckMate" },
      {
        name: "description",
        content: "Maak een konvooi, nodig collega's uit en deel tijdelijk je locatie met je groep.",
      },
      { property: "og:title", content: "Konvooi rijden — TruckMate" },
      { property: "og:description", content: "Samen rijden met live status en groepschat." },
    ],
  }),
  component: KonvooiPage,
});

function KonvooiPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Convoy[] | null>(null);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async (uid: string) => {
    try {
      setList(await fetchMyConvoys(uid));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden mislukt.");
      setList([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    void reload(user.id);
  }, [user]);

  const create = async () => {
    if (!user || !name.trim()) return;
    setBusy(true);
    try {
      const c = await createConvoy({
        leader_id: user.id,
        name: name.trim(),
        from_location: from.trim() || null,
        to_location: to.trim() || null,
      });
      toast.success("Konvooi aangemaakt.");
      setName("");
      setFrom("");
      setTo("");
      navigate({ to: "/konvooi/$id", params: { id: c.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Aanmaken mislukt.");
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    if (!user || !code.trim()) return;
    setBusy(true);
    try {
      const c = await joinConvoyByCode(code, user.id);
      toast.success(`Je bent toegevoegd aan "${c.name}".`);
      setCode("");
      navigate({ to: "/konvooi/$id", params: { id: c.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deelnemen mislukt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Konvooi rijden">
      <Card className="mb-3 border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="flex items-start gap-3 p-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 text-xs">
            <p className="font-semibold text-foreground">Privacy-first</p>
            <p className="mt-0.5 text-muted-foreground">
              Locatie delen staat standaard <span className="font-semibold text-foreground">UIT</span>,
              is per konvooi aan te zetten met een eindtijd en alleen zichtbaar voor deelnemers van
              hetzelfde konvooi. Verlopen locaties worden automatisch verwijderd.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-3">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">Nieuw konvooi</p>
          <div>
            <Label className="mb-1 block text-xs">Naam</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Bijv. Rit naar Kamen" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1 block text-xs">Vertrekpunt</Label>
              <Input value={from} onChange={(e) => setFrom(e.target.value)} maxLength={120} placeholder="Utrecht" />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Bestemming</Label>
              <Input value={to} onChange={(e) => setTo(e.target.value)} maxLength={120} placeholder="Kamen" />
            </div>
          </div>
          <Button className="h-11 w-full font-bold" onClick={create} disabled={busy || !name.trim() || !user}>
            <Plus className="mr-1 h-4 w-4" /> Konvooi aanmaken
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">Deelnemen met code</p>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={12}
              placeholder="Uitnodigingscode"
              className="font-mono"
            />
            <Button variant="secondary" onClick={join} disabled={busy || !code.trim() || !user}>
              <LogIn className="mr-1 h-4 w-4" /> Meedoen
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-2 text-sm font-semibold">Mijn konvooien</h2>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {loading || list === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Radio className="mx-auto mb-2 h-5 w-5" />
          Je zit nog in geen enkel konvooi. Maak er één aan of gebruik een uitnodigingscode.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <Link key={c.id} to="/konvooi/$id" params={{ id: c.id }}>
              <Card className="transition hover:border-primary/60">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {c.from_location ?? "—"} → {c.to_location ?? "—"}
                    </p>
                  </div>
                  <Badge
                    className={`text-[10px] ${
                      c.status === "active"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : c.status === "ended"
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/20 text-primary"
                    }`}
                  >
                    {c.status === "active" ? "actief" : c.status === "ended" ? "beëindigd" : "gepland"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
