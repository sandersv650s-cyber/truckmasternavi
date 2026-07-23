import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Truck, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Inloggen — TruckMate Connect" },
      { name: "description", content: "Log in of maak een gratis TruckMate-account aan." },
      { property: "og:title", content: "Inloggen — TruckMate Connect" },
      { property: "og:description", content: "Log in of registreer voor TruckMate Connect." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

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
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black">Welkom</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in of maak in 30 seconden een account.
          </p>
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin">Inloggen</TabsTrigger>
            <TabsTrigger value="signup">Registreren</TabsTrigger>
            <TabsTrigger value="reset">Reset</TabsTrigger>
          </TabsList>
          <TabsContent value="signin"><SignInForm /></TabsContent>
          <TabsContent value="signup"><SignUpForm /></TabsContent>
          <TabsContent value="reset"><ResetForm /></TabsContent>
        </Tabs>

        <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
          <Link to="/over" className="hover:text-foreground">Over</Link>
          <span>·</span>
          <Link to="/privacybeleid" className="hover:text-foreground">Privacy</Link>
          <span>·</span>
          <Link to="/voorwaarden" className="hover:text-foreground">Voorwaarden</Link>
        </div>
      </main>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Onjuiste e-mail of wachtwoord." : error.message);
      return;
    }
    toast.success("Ingelogd");
    navigate({ to: "/" });
  };

  return (
    <Card className="mt-3">
      <CardContent className="p-5">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="si-email" className="text-xs">E-mail</Label>
            <Input id="si-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="si-pass" className="text-xs">Wachtwoord</Label>
            <Input id="si-pass" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="h-12 w-full font-bold" disabled={busy}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Inloggen <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Wachtwoord moet minimaal 6 tekens zijn.");
      return;
    }
    setBusy(true);
    const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirect,
        data: { full_name: name.trim() || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account aangemaakt");
      navigate({ to: "/" });
    } else {
      toast.success("Bevestig je e-mail om in te loggen.");
    }
  };

  return (
    <Card className="mt-3">
      <CardContent className="p-5">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="su-name" className="text-xs">Naam</Label>
            <Input id="su-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jan de Vries" />
          </div>
          <div>
            <Label htmlFor="su-email" className="text-xs">E-mail</Label>
            <Input id="su-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="su-pass" className="text-xs">Wachtwoord (min. 6 tekens)</Label>
            <Input id="su-pass" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
          </div>
          <Button type="submit" className="h-12 w-full font-bold" disabled={busy}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Account aanmaken
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ResetForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const redirect = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset-link verstuurd (check je inbox).");
  };

  return (
    <Card className="mt-3">
      <CardContent className="p-5">
        {sent ? (
          <p className="text-sm">We hebben een link gestuurd naar <span className="font-medium">{email}</span>. Klik daarop om je wachtwoord opnieuw in te stellen.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="re-email" className="text-xs">E-mail</Label>
              <Input id="re-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="h-12 w-full font-bold" disabled={busy}>
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Stuur reset-link
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
