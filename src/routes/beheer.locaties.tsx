import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Plus, Trash2 } from "lucide-react";
import {
  deleteTerminal,
  fetchTerminals,
  terminalTypes,
  upsertTerminal,
  type Terminal,
  type TerminalType,
} from "@/lib/terminals";
import { useIsAdmin } from "@/lib/admin";

export const Route = createFileRoute("/beheer/locaties")({
  head: () => ({
    meta: [
      { title: "Locatiebeheer — TruckMate beheer" },
      { name: "description", content: "Voeg distributiecentra en terminals toe of werk ze bij." },
      { property: "og:title", content: "Locatiebeheer — TruckMate beheer" },
      { property: "og:description", content: "Beheer laad- en losadressen." },
    ],
  }),
  component: AdminTerminals,
});

const empty = {
  name: "",
  type: "dc" as TerminalType,
  address: "",
  postal_code: "",
  city: "",
  country: "NL",
  phone: "",
  facilities: "",
  wait_time_notes: "",
};

function AdminTerminals() {
  const { isAdmin, checking } = useIsAdmin();
  const [rows, setRows] = useState<Terminal[] | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setRows(await fetchTerminals());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden mislukt.");
      setRows([]);
    }
  };

  useEffect(() => {
    if (!checking && isAdmin) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, isAdmin]);

  const save = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await upsertTerminal({
        ...(editing ? { id: editing } : {}),
        name: form.name.trim(),
        type: form.type,
        address: form.address.trim() || null,
        postal_code: form.postal_code.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || "NL",
        phone: form.phone.trim() || null,
        wait_time_notes: form.wait_time_notes.trim() || null,
        facilities: form.facilities
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
      });
      toast.success(editing ? "Locatie bijgewerkt." : "Locatie toegevoegd.");
      setForm({ ...empty });
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminGuard title="Locaties" require="staff">
      <Card className="mb-4">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">{editing ? "Locatie bewerken" : "Nieuwe locatie"}</p>
          <div>
            <Label className="mb-1 block text-xs">Naam</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TerminalType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(terminalTypes).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Adres</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={160} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="mb-1 block text-xs">Postcode</Label>
              <Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} maxLength={12} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Plaats</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Land</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} maxLength={4} />
            </div>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Telefoon</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={40} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Faciliteiten (komma-gescheiden)</Label>
            <Input
              value={form.facilities}
              onChange={(e) => setForm({ ...form, facilities: e.target.value })}
              placeholder="Douche, Parkeren, Kantine"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Wachttijden / opmerkingen</Label>
            <Textarea
              value={form.wait_time_notes}
              onChange={(e) => setForm({ ...form, wait_time_notes: e.target.value })}
              className="min-h-16 text-xs"
              maxLength={500}
            />
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

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Building2 className="mx-auto mb-2 h-5 w-5" />
          Nog geen locaties.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {terminalTypes[t.type]} · {[t.city, t.country].filter(Boolean).join(", ")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(t.id);
                    setForm({
                      name: t.name,
                      type: t.type,
                      address: t.address ?? "",
                      postal_code: t.postal_code ?? "",
                      city: t.city ?? "",
                      country: t.country,
                      phone: t.phone ?? "",
                      facilities: t.facilities.join(", "),
                      wait_time_notes: t.wait_time_notes ?? "",
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Bewerk
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  aria-label="Verwijderen"
                  onClick={async () => {
                    try {
                      await deleteTerminal(t.id);
                      toast.success("Locatie verwijderd.");
                      await load();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Verwijderen mislukt.");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}
