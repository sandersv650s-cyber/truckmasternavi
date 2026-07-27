import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StorageAvatarImage } from "@/lib/storage-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Save, Loader2, Camera, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchProfile, initials, type Profile } from "@/lib/queries";
import { toast } from "sonner";
import {
  LZV_DEFAULTS,
  hasErrors,
  validateVehicle,
  vehicleClassHints,
  vehicleClassLabels,
  type VehicleClass,
} from "@/lib/lzv";
import { IssueList, LzvInfoCard } from "@/components/lzv-info-card";

export const Route = createFileRoute("/profiel")({
  head: () => ({
    meta: [
      { title: "Mijn profiel — TruckMate" },
      { name: "description", content: "Beheer je chauffeursprofiel: naam, bio en truck." },
      { property: "og:title", content: "Mijn profiel — TruckMate" },
      { property: "og:description", content: "Profielfoto, bio en trucktype in TruckMate." },
    ],
  }),
  component: MyProfile,
});

function MyProfile() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: () => fetchProfile(user!.id),
  });

  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);

  const f = form as any;
  /**
   * Klasse wordt afgeleid uit twee opgeslagen velden:
   *  - vehicle_is_lzv = true  -> LZV
   *  - anders met ontheffing  -> exceptioneel transport
   */
  const vehicleClass: VehicleClass = f.vehicle_is_lzv
    ? "lzv"
    : f.vehicle_has_exemption
      ? "exceptional"
      : "truck";

  const setClass = (cls: VehicleClass) => {
    if (cls === "lzv") {
      setForm({
        ...f,
        vehicle_is_lzv: true,
        vehicle_type: "truck",
        // Veilige Nederlandse LZV-standaardwaarden invullen waar nog niets staat.
        vehicle_length_cm: f.vehicle_length_cm ?? LZV_DEFAULTS.length_cm,
        vehicle_weight_kg: f.vehicle_weight_kg ?? LZV_DEFAULTS.weight_kg,
        vehicle_height_cm: f.vehicle_height_cm ?? LZV_DEFAULTS.height_cm,
        vehicle_width_cm: f.vehicle_width_cm ?? LZV_DEFAULTS.width_cm,
        vehicle_axle_count: f.vehicle_axle_count ?? LZV_DEFAULTS.axle_count,
        vehicle_trailer_count: f.vehicle_trailer_count ?? LZV_DEFAULTS.trailer_count,
      });
      return;
    }
    setForm({
      ...f,
      vehicle_is_lzv: false,
      vehicle_has_exemption: cls === "exceptional" ? true : f.vehicle_has_exemption ?? false,
    });
  };

  const issues = validateVehicle({
    vehicleClass,
    length_cm: f.vehicle_length_cm,
    width_cm: f.vehicle_width_cm,
    height_cm: f.vehicle_height_cm,
    weight_kg: f.vehicle_weight_kg,
    current_weight_kg: f.vehicle_current_weight_kg,
    axle_weight_kg: f.vehicle_axle_weight_kg,
    axle_count: f.vehicle_axle_count,
    trailer_count: f.vehicle_trailer_count,
    has_exemption: f.vehicle_has_exemption,
    exemption_ref: f.vehicle_exemption_ref,
    exemption_expires: f.vehicle_exemption_expires,
  });
  const blocking = hasErrors(issues);

  const save = async () => {
    if (!user) return;
    if (blocking) {
      toast.error("Corrigeer eerst de rode fouten in de voertuiggegevens.");
      return;
    }
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {
        id: user.id,
        full_name: form.full_name ?? null,
        username: form.username ?? null,
        bio: form.bio ?? null,
        truck: form.truck ?? null,
        vehicle_type: (form as any).vehicle_type ?? null,
        vehicle_height_cm: (form as any).vehicle_height_cm ?? null,
        vehicle_width_cm: (form as any).vehicle_width_cm ?? null,
        vehicle_length_cm: (form as any).vehicle_length_cm ?? null,
        vehicle_weight_kg: (form as any).vehicle_weight_kg ?? null,
        vehicle_current_weight_kg: (form as any).vehicle_current_weight_kg ?? null,
        vehicle_max_permitted_weight_kg:
          (form as any).vehicle_max_permitted_weight_kg ?? (form as any).vehicle_weight_kg ?? null,
        vehicle_is_lzv: Boolean((form as any).vehicle_is_lzv),
        vehicle_has_exemption: Boolean((form as any).vehicle_has_exemption),
        vehicle_exemption_ref: (form as any).vehicle_exemption_ref?.trim() || null,
        vehicle_exemption_expires: (form as any).vehicle_exemption_expires || null,
        vehicle_axle_count: (form as any).vehicle_axle_count ?? null,
        vehicle_axle_weight_kg: (form as any).vehicle_axle_weight_kg ?? null,
        vehicle_trailer_count: (form as any).vehicle_trailer_count ?? null,
        vehicle_hazardous: Boolean((form as any).vehicle_hazardous),
      };
      const { error } = await supabase.from("profiles").upsert(patch as any);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Profiel opgeslagen");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout bij opslaan");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { error: e2 } = await supabase.from("profiles").upsert({ id: user.id, avatar_url: path });
      if (e2) throw e2;
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Foto bijgewerkt");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload mislukt");
    } finally {
      setUploading(false);
    }
  };

  const logout = async () => {
    await signOut();
    nav({ to: "/login" });
  };

  return (
    <AppShell title="Mijn profiel">
      <Card className="mb-4 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/20" />
        <CardContent className="-mt-10 p-4">
          <div className="relative inline-block">
            <Avatar className="h-20 w-20 border-4 border-card">
              <StorageAvatarImage bucket="avatars" path={q.data?.avatar_url} />
              <AvatarFallback>{initials(q.data?.full_name ?? user?.email)}</AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                disabled={uploading}
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{user?.email}</p>

          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="fn">Volledige naam</Label>
              <Input id="fn" value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={80} />
            </div>
            <div>
              <Label htmlFor="un">Gebruikersnaam</Label>
              <Input id="un" value={form.username ?? ""} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="chauffeur123" maxLength={40} />
            </div>
            <div>
              <Label htmlFor="tr" className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Truck</Label>
              <Input id="tr" value={form.truck ?? ""} onChange={(e) => setForm({ ...form, truck: e.target.value })} placeholder="Volvo FH16 750" maxLength={80} />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} maxLength={500} />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Voertuiggegevens (voor routeplanner)
              </p>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="vcls">Combinatie</Label>
                  <select
                    id="vcls"
                    className="mt-1 block h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={vehicleClass}
                    onChange={(e) => setClass(e.target.value as VehicleClass)}
                  >
                    {(Object.keys(vehicleClassLabels) as VehicleClass[]).map((c) => (
                      <option key={c} value={c}>
                        {vehicleClassLabels[c]}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {vehicleClassHints[vehicleClass]}
                  </p>
                </div>
                {vehicleClass === "lzv" && <LzvInfoCard />}
                <div>
                  <Label htmlFor="vt">Type</Label>
                  <select
                    id="vt"
                    className="mt-1 block h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={(form as any).vehicle_type ?? ""}
                    onChange={(e) => setForm({ ...(form as any), vehicle_type: e.target.value || null })}
                  >
                    <option value="">— Kies —</option>
                    <option value="truck">Vrachtwagen</option>
                    <option value="van">Bestelwagen</option>
                    <option value="car">Auto</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="vh">Hoogte (cm)</Label>
                    <Input id="vh" type="number" inputMode="numeric" value={(form as any).vehicle_height_cm ?? ""} onChange={(e) => setForm({ ...(form as any), vehicle_height_cm: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label htmlFor="vw">Breedte (cm)</Label>
                    <Input id="vw" type="number" inputMode="numeric" value={(form as any).vehicle_width_cm ?? ""} onChange={(e) => setForm({ ...(form as any), vehicle_width_cm: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label htmlFor="vl">Lengte (cm)</Label>
                    <Input id="vl" type="number" inputMode="numeric" value={(form as any).vehicle_length_cm ?? ""} onChange={(e) => setForm({ ...(form as any), vehicle_length_cm: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label htmlFor="vwt">Gewicht (kg)</Label>
                    <Label htmlFor="vwt" className="sr-only">Toegestane maximummassa (kg)</Label>
                    <Input id="vwt" type="number" min={1} max={120000} step={100} inputMode="numeric" placeholder="bijv. 50000" value={f.vehicle_weight_kg ?? ""} onChange={(e) => setForm({ ...f, vehicle_weight_kg: e.target.value ? Number(e.target.value) : null })} />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">Toegestane maximummassa</p>
                  </div>
                  <div>
                    <Label htmlFor="vcw">Actueel gewicht (kg)</Label>
                    <Input id="vcw" type="number" min={1} max={120000} step={100} inputMode="numeric" placeholder="beladen gewicht" value={f.vehicle_current_weight_kg ?? ""} onChange={(e) => setForm({ ...f, vehicle_current_weight_kg: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label htmlFor="vac">Aantal assen</Label>
                    <Input id="vac" type="number" inputMode="numeric" value={(form as any).vehicle_axle_count ?? ""} onChange={(e) => setForm({ ...(form as any), vehicle_axle_count: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label htmlFor="vawt">Aslast (kg)</Label>
                    <Input id="vawt" type="number" inputMode="numeric" value={(form as any).vehicle_axle_weight_kg ?? ""} onChange={(e) => setForm({ ...(form as any), vehicle_axle_weight_kg: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label htmlFor="vtc">Aanhangers</Label>
                    <Input id="vtc" type="number" inputMode="numeric" value={(form as any).vehicle_trailer_count ?? ""} onChange={(e) => setForm({ ...(form as any), vehicle_trailer_count: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean((form as any).vehicle_hazardous)}
                    onChange={(e) => setForm({ ...(form as any), vehicle_hazardous: e.target.checked })}
                  />
                  Gevaarlijke lading (ADR)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(f.vehicle_has_exemption)}
                    onChange={(e) => setForm({ ...f, vehicle_has_exemption: e.target.checked })}
                  />
                  Ik heb een (incidentele) RDW-ontheffing
                </label>
                {f.vehicle_has_exemption && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="vex">Ontheffingsnummer</Label>
                      <Input id="vex" maxLength={60} value={f.vehicle_exemption_ref ?? ""} onChange={(e) => setForm({ ...f, vehicle_exemption_ref: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="vexd">Geldig tot</Label>
                      <Input id="vexd" type="date" value={f.vehicle_exemption_expires ?? ""} onChange={(e) => setForm({ ...f, vehicle_exemption_expires: e.target.value || null })} />
                    </div>
                  </div>
                )}
                <IssueList issues={issues} />
                <p className="text-[11px] text-muted-foreground">
                  Wordt door de HERE-routeplanner toegepast voor truck-veilige routes en waarschuwingen.
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={save} disabled={saving || q.isLoading || blocking}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Opslaan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full" onClick={logout}>
        <LogOut className="mr-2 h-4 w-4" /> Uitloggen
      </Button>
    </AppShell>
  );
}
