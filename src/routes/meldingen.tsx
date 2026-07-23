import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, X, Flag, Plus, MapPin } from "lucide-react";
import { initialAlerts, alertMeta, isExpired, minAgoLabel, type AlertCategory, type TrafficAlert } from "@/lib/discover-data";
import { currentUser, userById } from "@/lib/mock-data";

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

function MeldingenPage() {
  const [alerts, setAlerts] = useState<TrafficAlert[]>(initialAlerts);
  const [showForm, setShowForm] = useState(false);
  const [cat, setCat] = useState<AlertCategory>("file");
  const [location, setLocation] = useState("");
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<AlertCategory | "alle">("alle");

  const submit = () => {
    if (!location.trim() || !text.trim()) return;
    setAlerts((p) => [{ id: `a${Date.now()}`, category: cat, userId: currentUser.id, location: location.trim(), text: text.trim(), createdMinAgo: 0, confirms: 0, notActual: 0 }, ...p]);
    setShowForm(false); setLocation(""); setText("");
  };
  const confirm = (id: string) => setAlerts((p) => p.map((a) => a.id === id ? { ...a, confirms: a.confirms + 1 } : a));
  const nope = (id: string) => setAlerts((p) => p.map((a) => a.id === id ? { ...a, notActual: a.notActual + 1 } : a));
  const visible = alerts.filter((a) => filter === "alle" || a.category === filter);

  return (
    <AppShell demoBanner={"Voorbeeldmeldingen — echte community-alerts vereisen een aparte tabel + moderatie en zijn nog niet live."} title="Meldingen">
      <Button className="mb-3 w-full" onClick={() => setShowForm((v) => !v)}>
        <Plus className="mr-1 h-4 w-4" /> {showForm ? "Sluiten" : "Nieuwe melding"}
      </Button>

      {showForm && (
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
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Locatie (bijv. A2 Hm 62)" />
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Korte beschrijving" className="min-h-16" />
          <Button className="w-full" onClick={submit} disabled={!location.trim() || !text.trim()}>Plaats melding</Button>
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

      <div className="space-y-2">
        {visible.length === 0 && <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Geen meldingen in deze categorie.</div>}
        {visible.map((a) => {
          const meta = alertMeta[a.category];
          const u = userById(a.userId);
          const expired = isExpired(a);
          return (
            <Card key={a.id} className={expired ? "opacity-60" : ""}><CardContent className="p-3">
              <div className="flex items-start gap-2">
                <div className={`shrink-0 rounded-lg border px-2 py-1 text-lg ${meta.color}`}>{meta.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={`${meta.color} border text-[10px]`}>{meta.label}</Badge>
                    {expired && <Badge variant="outline" className="text-[10px] text-muted-foreground">Verlopen</Badge>}
                    <span className="ml-auto text-[10px] text-muted-foreground">{minAgoLabel(a.createdMinAgo)}</span>
                  </div>
                  <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3 w-3 shrink-0" /><span>{a.location}</span></p>
                  <p className="mt-1 text-sm">{a.text}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Avatar className="h-5 w-5"><AvatarImage src={u.avatar} alt="" /><AvatarFallback>{u.name[0]}</AvatarFallback></Avatar>
                    <span className="text-[10px] text-muted-foreground">{u.name}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => confirm(a.id)}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {a.confirms}</Button>
                <Button size="sm" variant="secondary" onClick={() => nope(a.id)}><X className="mr-1 h-3.5 w-3.5" /> {a.notActual}</Button>
                <Button size="sm" variant="ghost" aria-label="Rapporteren"><Flag className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </AppShell>
  );
}