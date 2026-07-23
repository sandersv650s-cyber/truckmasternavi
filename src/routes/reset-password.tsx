import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Wachtwoord instellen — TruckMate" },
      { name: "description", content: "Stel je nieuwe wachtwoord in." },
      { property: "og:title", content: "Wachtwoord instellen — TruckMate" },
      { property: "og:description", content: "Herstel toegang tot je account." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Wachtwoord moet minimaal 6 tekens zijn.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Wachtwoord bijgewerkt");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 text-primary">
            <Truck className="h-4 w-4" />
          </div>
          <span className="text-base font-bold">TruckMate Connect</span>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Nieuw wachtwoord instellen</h1>
        <Card>
          <CardContent className="p-5">
            {!ready ? (
              <p className="text-sm text-muted-foreground">Bezig met controleren van je reset-link…</p>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <Label htmlFor="np" className="text-xs">Nieuw wachtwoord</Label>
                  <Input id="np" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="h-12 w-full font-bold" disabled={busy}>
                  {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                  Wachtwoord opslaan
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
