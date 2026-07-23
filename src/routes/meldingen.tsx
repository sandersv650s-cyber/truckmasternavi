import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, X, Plus, MapPin, Trash2, Loader2 } from "lucide-react";
import { alertMeta, type AlertCategory } from "@/lib/discover-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/meldingen")({
  head: () => ({
    meta: [
      { title: "Meldingen onderweg — TruckMate" },
      { name: "description", content: "Deel en bevestig meldingen: file, ongeval, controle, wegwerk en meer." },
      { property: "og:title", content: "Meldingen — TruckMate" },
      { property: "og:description", content: "Community-meldingen voor chauffeurs." },
    ],
  }),
  component: MeldingenPage,
});

const cats: AlertCategory[] = ["file","ongeval","werk","controle","vol","vrij","gladheid","gevaar","wegdicht"];

type AlertRow = {
  id: string;
  user_id: string;
  category: AlertCategory;
  location: string;
  text: string;
  confirms_count: number;
  not_actual_count: number;
  expires_at: string;
  created_at: string;
  profiles: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
};

type VoteRow = { alert_id: string; vote: "confirm" | "not_actual" };

function minAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "nu";
  if (diff < 60) return `${diff}m`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}u`;
  return `${Math.floor(h / 24)}d`;
}

function MeldingenPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [votes, setVotes] = useState<Record<string, "confirm" | "not_actual">>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [cat, setCat] = useState<AlertCategory>("file");
  const [location, setLocation] = useState("");
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<AlertCategory | "alle">("alle");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from("alerts")
      .select("id, user_id, category, location, text, confirms_count, not_actual_count, expires_at, created_at, profiles(full_name, username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (err) { setError(err.message); setLoading(false); return; }
    setAlerts((data ?? []) as unknown as AlertRow[]);
    if (user) {
      const { data: v } = await supabase.from("alert_votes").select("alert_id, vote").eq("user_id", user.id);
      const map: Record<string, "confirm" | "not_actual"> = {};
      for (const r of (v ?? []) as VoteRow[]) map[r.alert_id] = r.vote;
      setVotes(map);
    } else {
      setVotes({});
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!user || !location.trim() || !text.trim()) return;
    setSubmitting(true);
    const ttl = alertMeta[cat].ttlMin;
    const expires_at = new Date(Date.now() + ttl * 60_000).toISOString();
    const { error: err } = await supabase.from("alerts").insert({
      user_id: user.id, category: cat, location: location.trim(), text: text.trim(), expires_at,
    });
    setSubmitting(false);
    if (err) { toast.error(err.message); return; }
    toast.success("Melding geplaatst");
    setShowForm(false); setLocation(""); setText("");
    void load();
  };

  const vote = async (id: string, kind: "confirm" | "not_actual") => {
    if (!user) { toast.error("Log in om te stemmen"); return; }
    const existing = votes[id];
    if (existing === kind) {
      // toggle off
      const { error: err } = await supabase.from("alert_votes").delete().eq("alert_id", id).eq("user_id", user.id);
      if (err) { toast.error(err.message); return; }
    } else if (existing) {
      const { error: err } = await supabase.from("alert_votes").update({ vote: kind }).eq("alert_id", id).eq("user_id", user.id);
      if (err) { toast.error(err.message); return; }
    } else {
      const { error: err } = await supabase.from("alert_votes").insert({ alert_id: id, user_id: user.id, vote: kind });
      if (err) { toast.error(err.message); return; }
    }
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Melding verwijderen?")) return;
    const { error: err } = await supabase.from("alerts").delete().eq("id", id);
    if (err) { toast.error(err.message); return; }
    setAlerts((p) => p.filter((a) => a.id !== id));
  };

  const visible = alerts.filter((a) => filter === "alle" || a.category === filter);

  return (
    <AppShell title="Meldingen">
      <Button className="mb-3 w-full" onClick={() => setShowForm((v) => !v)} disabled={!user}>
        <Plus className="mr-1 h-4 w-4" /> {showForm ? "Sluiten" : "Nieuwe melding"}
      </Button>
      {!user && (
        <p className="mb-3 text-center text-xs text-muted-foreground">Log in om meldingen te plaatsen en te bevestigen.</p>
      )}

      {showForm && user && (
        <Card className="mb-4"><CardContent className="space-y-3 p-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Categorie</p>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${cat===c?"border-primary bg-primary/20 text-primary":"border-border text-muted-foreground"}`}>
                  {alertMeta[c].emoji} {alertMeta[c].label}
                </button>
              ))}
            </div>
          </div>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Locatie (bijv. A2 Hm 62)" maxLength={120} />
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Korte beschrijving" className="min-h-16" maxLength={500} />
          <Button className="w-full" onClick={submit} disabled={submitting || !location.trim() || !text.trim()}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Plaats melding
          </Button>
        </CardContent></Card>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button onClick={() => setFilter("alle")} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${filter==="alle"?"border-primary bg-primary/20 text-primary":"border-border text-muted-foreground"}`}>Alle</button>
        {cats.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${filter===c?"border-primary bg-primary/20 text-primary":"border-border text-muted-foreground"}`}>
            {alertMeta[c].emoji} {alertMeta[c].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      ) : (
        <div className="space-y-2">
          {visible.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nog geen meldingen{filter !== "alle" ? " in deze categorie" : ""}.
            </div>
          )}
          {visible.map((a) => {
            const meta = alertMeta[a.category];
            const expired = new Date(a.expires_at).getTime() < Date.now();
            const myVote = votes[a.id];
            const name = a.profiles?.full_name ?? a.profiles?.username ?? "Chauffeur";
            return (
              <Card key={a.id} className={expired ? "opacity-60" : ""}><CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className={`shrink-0 rounded-lg border px-2 py-1 text-lg ${meta.color}`}>{meta.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${meta.color} border text-[10px]`}>{meta.label}</Badge>
                      {expired && <Badge variant="outline" className="text-[10px] text-muted-foreground">Verlopen</Badge>}
                      <span className="ml-auto text-[10px] text-muted-foreground">{minAgo(a.created_at)}</span>
                    </div>
                    <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3 w-3 shrink-0" /><span>{a.location}</span></p>
                    <p className="mt-1 text-sm">{a.text}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Avatar className="h-5 w-5"><AvatarImage src={a.profiles?.avatar_url ?? undefined} alt="" /><AvatarFallback className="text-[9px]">{initials(name, "?")}</AvatarFallback></Avatar>
                      <span className="text-[10px] text-muted-foreground">{name}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <Button size="sm" variant={myVote === "confirm" ? "default" : "secondary"} onClick={() => vote(a.id, "confirm")} disabled={!user}>
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {a.confirms_count}
                  </Button>
                  <Button size="sm" variant={myVote === "not_actual" ? "default" : "secondary"} onClick={() => vote(a.id, "not_actual")} disabled={!user}>
                    <X className="mr-1 h-3.5 w-3.5" /> {a.not_actual_count}
                  </Button>
                  {user && user.id === a.user_id ? (
                    <Button size="sm" variant="ghost" onClick={() => remove(a.id)} aria-label="Verwijderen"><Trash2 className="h-3.5 w-3.5" /></Button>
                  ) : (
                    <div />
                  )}
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
