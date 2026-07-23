import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Truck, Play, ArrowRight, LogIn } from "lucide-react";

const DEMO_EMAIL = "demo@truckmate.nl";
const DEMO_PASS = "demo1234";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Demo-login — TruckMate" },
      { name: "description", content: "Log in met een vooraf ingevuld demo-account en verken TruckMate." },
      { property: "og:title", content: "Demo-login — TruckMate" },
      { property: "og:description", content: "Start de TruckMate demo in enkele seconden." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [pass, setPass] = useState(DEMO_PASS);
  const [error, setError] = useState<string | null>(null);

  const enter = () => {
    if (typeof window !== "undefined") window.localStorage.setItem("truckmate.login.v1", "1");
    navigate({ to: "/" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === DEMO_EMAIL && pass === DEMO_PASS) {
      setError(null);
      enter();
    } else {
      setError("Onjuiste gegevens. Gebruik de demo-knop hieronder.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 text-primary">
            <Truck className="h-4 w-4" />
          </div>
          <span className="text-base font-bold">TruckMate</span>
          <Badge variant="outline" className="ml-auto border-amber-500/50 bg-amber-500/10 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
            Demo
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black">Welkom bij TruckMate</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Investeerdersdemo · alle gegevens en koppelingen zijn gesimuleerd.
          </p>
        </div>

        <Card className="mb-4 overflow-hidden border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-primary">Snelste weg naar binnen</p>
            <h2 className="mt-1 text-lg font-bold">Start direct de demo</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Zonder account, zonder wachtwoord. Meteen alle schermen bekijken als Jan de Vries.
            </p>
            <Button size="lg" className="mt-4 h-14 w-full text-base font-bold" onClick={enter}>
              <Play className="mr-2 h-5 w-5 fill-current" /> Start demo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <LogIn className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Of log in met het demo-account</p>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label htmlFor="email" className="text-xs">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pass" className="text-xs">Wachtwoord</Label>
                <Input id="pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" variant="secondary" className="w-full">
                Inloggen <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Vooringevuld: <span className="font-medium">{DEMO_EMAIL}</span> / <span className="font-medium">{DEMO_PASS}</span>
              </p>
            </form>
          </CardContent>
        </Card>

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