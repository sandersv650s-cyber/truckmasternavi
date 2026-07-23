import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Save, Loader2, Camera, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchProfile, initials, type Profile } from "@/lib/queries";
import { toast } from "sonner";

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

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: form.full_name ?? null,
        username: form.username ?? null,
        bio: form.bio ?? null,
        truck: form.truck ?? null,
      });
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
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: e2 } = await supabase.from("profiles").upsert({ id: user.id, avatar_url: pub.publicUrl });
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
              {q.data?.avatar_url && <AvatarImage src={q.data.avatar_url} alt="" />}
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
            <Button className="w-full" onClick={save} disabled={saving || q.isLoading}>
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
