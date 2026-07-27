import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Fuel, Plus, Trash2, Upload, RefreshCw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { syncFuelPrices } from "@/lib/fuel.functions";
import {
  deleteStation,
  fuelTypes,
  getFuelProvider,
  importPricesCsv,
  reportPrice,
  upsertStation,
  type FuelType,
  type StationWithPrice,
} from "@/lib/fuel";
import { useMyRoles } from "@/lib/admin";

export const Route = createFileRoute("/beheer/brandstof")({
  head: () => ({
    meta: [
      { title: "Brandstofbeheer — TruckMate beheer" },
      { name: "description", content: "Beheer tankstations, prijzen en bulk-import van prijsdata." },
      { property: "og:title", content: "Brandstofbeheer — TruckMate beheer" },
      { property: "og:description", content: "Stations en prijzen bijwerken." },
    ],
  }),
  component: AdminFuel,
});

const empty = {
  name: "",
  brand: "",
  address: "",
  city: "",
  country: "NL",
  road: "",
  lat: "",
  lng: "",
  truck_suitable: true,
  has_adblue: false,
  open_hours: "",
  is_example: false,
};

function AdminFuel() {
  const { isStaff, checking } = useMyRoles();
  const runSync = useServerFn(syncFuelPrices);
  const [syncing, setSyncing] = useState(false);
  const [rows, setRows] = useState<StationWithPrice[] | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [priceDraft, setPriceDraft] = useState<Record<string, { type: FuelType; value: string }>>({});

  const load = async () => {
    try {
      setRows(await getFuelProvider().list({}));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden mislukt.");
      setRows([]);
    }
  };

  useEffect(() => {
    if (!checking && isStaff) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, isStaff]);

  const save = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await upsertStation({
        ...(editing ? { id: editing } : {}),
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || "NL",
        road: form.road.trim() || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        truck_suitable: form.truck_suitable,
        has_adblue: form.has_adblue,
        open_hours: form.open_hours.trim() || null,
        is_example: form.is_example,
        source: form.is_example ? "seed" : "admin",
      });
      toast.success(editing ? "Station bijgewerkt." : "Station toegevoegd.");
      setForm({ ...empty });
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
    } finally {
      setBusy(false);
    }
  };

  const savePrice = async (stationId: string) => {
    const draft = priceDraft[stationId];
    const value = Number((draft?.value ?? "").replace(",", "."));
    if (!draft || !Number.isFinite(value) || value <= 0) {
      toast.error("Vul een geldige prijs in.");
      return;
    }
    try {
      await reportPrice({ station_id: stationId, fuel_type: draft.type, price_eur: value });
      toast.success("Prijs bijgewerkt.");
      setPriceDraft((d) => ({ ...d, [stationId]: { ...draft, value: "" } }));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Prijs opslaan mislukt.");
    }
  };

  const runImport = async () => {
    if (!csv.trim()) return;
    setBusy(true);
    try {
      const res = await importPricesCsv(csv);
      toast.success(`${res.ok} prijzen geïmporteerd.`);
      if (res.errors.length) toast.error(`${res.errors.length} regels overgeslagen.`);
      setCsv("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import mislukt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminGuard title="Brandstof" require="staff">
      <Card className="mb-4">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">Externe prijsfeed</p>
          <p className="text-[11px] text-muted-foreground">
            Synchroniseer prijzen vanaf een externe provider. Zonder gekoppelde provider blijft alle data
            gemarkeerd als handmatig/voorbeeld.
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              try {
                const res = await runSync({ data: {} });
                if (res.ok) toast.success(res.message);
                else toast.warning(res.message);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Synchronisatie mislukt.");
              } finally {
                setSyncing(false);
              }
            }}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> Prijzen synchroniseren
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">{editing ? "Station bewerken" : "Nieuw station"}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="mb-1 block text-xs">Naam</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Merk</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} maxLength={60} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Weg</Label>
              <Input value={form.road} onChange={(e) => setForm({ ...form, road: e.target.value })} maxLength={20} />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block text-xs">Adres</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={160} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Plaats</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Land</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} maxLength={4} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Breedtegraad</Label>
              <Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} inputMode="decimal" />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Lengtegraad</Label>
              <Input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} inputMode="decimal" />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block text-xs">Openingstijden</Label>
              <Input value={form.open_hours} onChange={(e) => setForm({ ...form, open_hours: e.target.value })} placeholder="24/7" maxLength={60} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-2">
            <span className="text-xs">Truck-geschikt</span>
            <Switch checked={form.truck_suitable} onCheckedChange={(v) => setForm({ ...form, truck_suitable: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-2">
            <span className="text-xs">AdBlue aanwezig</span>
            <Switch checked={form.has_adblue} onCheckedChange={(v) => setForm({ ...form, has_adblue: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-2">
            <span className="text-xs">Markeren als voorbeelddata</span>
            <Switch checked={form.is_example} onCheckedChange={(v) => setForm({ ...form, is_example: v })} />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={save} disabled={busy || !form.name.trim()}>
              <Plus className="mr-1 h-4 w-4" /> {editing ? "Opslaan" : "Toevoegen"}
            </Button>
            {editing && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  setForm({ ...empty });
                }}
              >
                Annuleren
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">Bulk-import prijzen</p>
          <p className="text-[11px] text-muted-foreground">
            Eén regel per prijs: <code>Stationnaam;diesel;1.649</code>. Onbekende stations worden aangemaakt.
          </p>
          <Textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            className="min-h-24 font-mono text-xs"
            placeholder={"Truckpark Maasvlakte;diesel;1.649\nTruckpark Maasvlakte;adblue;0.859"}
          />
          <Button onClick={runImport} disabled={busy || !csv.trim()} className="w-full">
            <Upload className="mr-1 h-4 w-4" /> Importeren
          </Button>
        </CardContent>
      </Card>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Fuel className="mx-auto mb-2 h-5 w-5" />
          Nog geen stations.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((s) => {
            const draft = priceDraft[s.id] ?? { type: "diesel" as FuelType, value: "" };
            return (
              <Card key={s.id}>
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {[s.brand, s.city, s.country].filter(Boolean).join(" · ")} · bron {s.source}
                      </p>
                    </div>
                    {s.is_example && (
                      <Badge variant="outline" className="border-amber-500/50 text-[10px] text-amber-400">
                        Voorbeeld
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditing(s.id);
                        setForm({
                          name: s.name,
                          brand: s.brand ?? "",
                          address: s.address ?? "",
                          city: s.city ?? "",
                          country: s.country ?? "NL",
                          road: s.road ?? "",
                          lat: s.lat != null ? String(s.lat) : "",
                          lng: s.lng != null ? String(s.lng) : "",
                          truck_suitable: s.truck_suitable,
                          has_adblue: s.has_adblue,
                          open_hours: s.open_hours ?? "",
                          is_example: s.is_example,
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Bewerk
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      aria-label="Station verwijderen"
                      onClick={async () => {
                        try {
                          await deleteStation(s.id);
                          toast.success("Station verwijderd.");
                          await load();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Verwijderen mislukt.");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                    {(Object.keys(fuelTypes) as FuelType[])
                      .filter((f) => s.prices[f])
                      .map((f) => (
                        <span key={f} className="rounded border border-border px-1.5 py-0.5">
                          {fuelTypes[f]} € {s.prices[f]!.price_eur.toFixed(3)} ·{" "}
                          {new Date(s.prices[f]!.reported_at).toLocaleDateString("nl-NL")}
                        </span>
                      ))}
                  </div>

                  <div className="flex gap-2">
                    <Select
                      value={draft.type}
                      onValueChange={(v) =>
                        setPriceDraft((d) => ({ ...d, [s.id]: { ...draft, type: v as FuelType } }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(fuelTypes) as FuelType[]).map((f) => (
                          <SelectItem key={f} value={f}>
                            {fuelTypes[f]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={draft.value}
                      onChange={(e) =>
                        setPriceDraft((d) => ({ ...d, [s.id]: { ...draft, value: e.target.value } }))
                      }
                      inputMode="decimal"
                      placeholder="1.649"
                      aria-label={`Nieuwe prijs voor ${s.name}`}
                    />
                    <Button size="sm" onClick={() => savePrice(s.id)}>
                      Prijs opslaan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminGuard>
  );
}
