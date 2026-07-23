import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Wrench, Paperclip, AlertTriangle, Calendar, Gauge, Euro } from "lucide-react";
import { initialMaintenance, maintenanceMeta, type MaintenanceItem, type MaintenanceType } from "@/lib/more-data";

export const Route = createFileRoute("/onderhoud")({
  head: () => ({
    meta: [
      { title: "Onderhoudslogboek — TruckMate" },
      { name: "description", content: "Registreer APK, banden, olie, reparaties en kosten." },
      { property: "og:title", content: "Onderhoudslogboek — TruckMate" },
      { property: "og:description", content: "Alles rond voertuigonderhoud op één plek." },
    ],
  }),
  component: OnderhoudPage,
});

const types: MaintenanceType[] = ["apk", "banden", "olie", "adblue", "reparatie", "wasbeurt", "controle"];

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
}

function OnderhoudPage() {
  const [items, setItems] = useState<MaintenanceItem[]>(initialMaintenance);
  const [filter, setFilter] = useState<MaintenanceType | "alle">("alle");
  const [showForm, setShowForm] = useState(false);

  // form
  const [type, setType] = useState<MaintenanceType>("olie");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [km, setKm] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [garage, setGarage] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const list = useMemo(
    () =>
      [...items]
        .filter((i) => filter === "alle" || i.type === filter)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [items, filter],
  );

  const reminders = useMemo(() => {
    return items
      .map((i) => {
        const d = daysUntil(i.nextDueDate);
        return { item: i, days: d };
      })
      .filter((r) => r.days !== null && r.days <= 60)
      .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  }, [items]);

  const totalCost = items.reduce((s, i) => s + i.cost, 0);

  const submit = () => {
    if (!title.trim() || !date || !km) return;
    setItems((p) => [
      {
        id: `m${Date.now()}`,
        type,
        title: title.trim(),
        date,
        km: parseInt(km, 10) || 0,
        cost: parseFloat(cost) || 0,
        garage: garage.trim() || undefined,
        note: note.trim() || undefined,
        hasDocument: false,
      },
      ...p,
    ]);
    setShowForm(false);
    setTitle("");
    setKm("");
    setCost("");
    setGarage("");
    setNote("");
  };

  return (
    <AppShell demoBanner={"Onderhoudslogboek is een demo — items worden nog niet persistent opgeslagen."} title="Onderhoudslogboek">
      <Card className="mb-3">
        <CardContent className="grid grid-cols-3 gap-2 p-3 text-center text-xs">
          <div><p className="text-[10px] uppercase text-muted-foreground">Items</p><p className="text-sm font-bold">{items.length}</p></div>
          <div><p className="text-[10px] uppercase text-muted-foreground">Herinneringen</p><p className="text-sm font-bold text-amber-300">{reminders.length}</p></div>
          <div><p className="text-[10px] uppercase text-muted-foreground">Totaal kosten</p><p className="text-sm font-bold">€ {totalCost.toLocaleString("nl-NL")}</p></div>
        </CardContent>
      </Card>

      {reminders.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold">Binnenkort verlopend</h2>
          <div className="mb-4 space-y-2">
            {reminders.map(({ item, days }) => {
              const meta = maintenanceMeta[item.type];
              const critical = (days ?? 0) <= 14;
              return (
                <Card key={`rem-${item.id}`} className={critical ? "border-destructive/50" : "border-amber-500/40"}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className={`grid h-9 w-9 place-items-center rounded-lg ${meta.color}`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Vervalt {formatDate(item.nextDueDate!)} · nog {days} dagen
                      </p>
                    </div>
                    <Badge className={critical ? "bg-destructive/20 text-destructive" : "bg-amber-500/20 text-amber-300"}>
                      {critical ? "Kritiek" : "Actie"}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("alle")}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
            filter === "alle" ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          Alle
        </button>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              filter === t ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {maintenanceMeta[t].emoji} {maintenanceMeta[t].label}
          </button>
        ))}
      </div>

      <Button className="mb-3 w-full" onClick={() => setShowForm((v) => !v)}>
        {showForm ? (<><X className="mr-1 h-4 w-4" /> Sluiten</>) : (<><Plus className="mr-1 h-4 w-4" /> Nieuw item</>)}
      </Button>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap gap-1.5">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${
                    type === t ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {maintenanceMeta[t].emoji} {maintenanceMeta[t].label}
                </button>
              ))}
            </div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel (bijv. Oliebeurt)" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" />
              <Input value={km} onChange={(e) => setKm(e.target.value)} inputMode="numeric" placeholder="Km-stand" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" placeholder="Kosten (€)" />
              <Input value={garage} onChange={(e) => setGarage(e.target.value)} placeholder="Garage" />
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notitie (optioneel)" className="min-h-16" />
            <Button className="w-full" onClick={submit} disabled={!title.trim() || !date || !km}>
              Toevoegen
            </Button>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-2 text-sm font-semibold">Historie</h2>
      <div className="space-y-2">
        {list.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nog geen onderhoudsitems in deze categorie.
          </div>
        )}
        {list.map((i) => {
          const meta = maintenanceMeta[i.type];
          return (
            <Card key={i.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.color}`}>
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${meta.color} text-[10px]`}>{meta.label}</Badge>
                      {i.hasDocument && (
                        <Badge variant="outline" className="text-[10px]">
                          <Paperclip className="mr-1 h-3 w-3" /> Bijlage
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold">{i.title}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(i.date)}</span>
                      <span className="inline-flex items-center gap-1"><Gauge className="h-3 w-3" /> {i.km.toLocaleString("nl-NL")} km</span>
                      <span className="inline-flex items-center gap-1"><Euro className="h-3 w-3" /> {i.cost.toLocaleString("nl-NL")}</span>
                      {i.garage && <span>· {i.garage}</span>}
                    </div>
                    {i.note && <p className="mt-1 text-[11px] text-muted-foreground">{i.note}</p>}
                    {i.nextDueDate && (
                      <p className="mt-1 text-[11px] text-amber-300">
                        Volgende: {formatDate(i.nextDueDate)}
                      </p>
                    )}
                    {i.nextDueKm && (
                      <p className="text-[11px] text-amber-300">
                        Of bij {i.nextDueKm.toLocaleString("nl-NL")} km
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}