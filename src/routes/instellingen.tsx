import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Shield, Languages, UserCog, LogOut } from "lucide-react";
import { useI18n, languages, type Lang } from "@/lib/i18n";
import { useRole, roleMeta, type Role } from "@/lib/role";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Info, Mail, ScrollText, ShieldCheck, BookOpen, Bell } from "lucide-react";
import { APP_VERSION } from "@/lib/app-info";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/instellingen")({
  head: () => ({
    meta: [
      { title: "Instellingen — TruckMate" },
      { name: "description", content: "Privacy, voertuigdata en accountinstellingen." },
      { property: "og:title", content: "Instellingen — TruckMate" },
      { property: "og:description", content: "Beheer je privacy en account." },
    ],
  }),
  component: Instellingen,
});

function Instellingen() {
  const [liveLocation, setLiveLocation] = useState(false);
  const [vehicleData, setVehicleData] = useState(true);
  const [visibility, setVisibility] = useState("friends");
  const { lang, setLang, t } = useI18n();
  const { role, setRole } = useRole();
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  const logout = async () => {
    await signOut();
    nav({ to: "/login" });
  };

  return (
    <AppShell title={t("common.settings")}>
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Languages className="h-4 w-4 text-primary" /> {t("common.language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {languages.map((l) => {
              const active = l.code === lang;
              return (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as Lang)}
                  className={`flex items-center gap-2 rounded-lg border p-2 text-left transition ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"}`}
                >
                  <span className="text-lg">{l.flag}</span>
                  <span className="text-sm">{l.label}</span>
                  {active && <Badge className="ml-auto text-[10px]">✓</Badge>}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Navigatielabels en kernonderdelen wisselen direct. Volledige vertaling voor alle schermen volgt.</p>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="h-4 w-4 text-primary" /> {t("common.role")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(Object.keys(roleMeta) as Role[]).map((r) => {
            const m = roleMeta[r];
            const active = role === r;
            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"}`}
              >
                <span className="text-xl">{m.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{m.label}</p>
                  <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                </div>
                {active && <Badge className="text-[10px]">Actief</Badge>}
              </button>
            );
          })}
          {role === "fleet" && (
            <Link to="/fleet"><Button variant="secondary" className="w-full">Open Fleet dashboard</Button></Link>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" /> Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row title="Live locatie delen" desc="Standaard uit. Anderen kunnen je niet realtime volgen.">
            <Switch checked={liveLocation} onCheckedChange={setLiveLocation} />
          </Row>
          <Row title="Voertuigdata toestaan" desc="Sta OBD/J1939-adapters toe data met de app te delen.">
            <Switch checked={vehicleData} onCheckedChange={setVehicleData} />
          </Row>
          <div>
            <Label className="mb-2 block text-sm font-medium">Zichtbaarheid ritten</Label>
            <RadioGroup value={visibility} onValueChange={setVisibility} className="space-y-2">
              {[
                ["private", "Privé — alleen ik"],
                ["friends", "Vrienden — mensen die ik volg"],
                ["public", "Openbaar — iedereen in de community"],
              ].map(([v, l]) => (
                <Label
                  key={v}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/60"
                >
                  <RadioGroupItem value={v} />
                  <span className="text-sm">{l}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
          <Link to="/privacy"><Button variant="ghost" size="sm" className="w-full">Open volledig privacycentrum →</Button></Link>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="secondary" className="w-full justify-start" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Uitloggen
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => toast.info("Neem contact op via de contactpagina om je account te laten verwijderen.")}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Verwijder account
          </Button>
        </CardContent>
      </Card>

      {user && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Ingelogd als {user.email}</p>
      )}

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" /> Info & juridisch
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <InfoLink to="/over" icon={<Info className="h-4 w-4" />} label="Over TruckMate" />
          <InfoLink to="/release-notes" icon={<BookOpen className="h-4 w-4" />} label="Release notes" />
          <InfoLink to="/notificaties" icon={<Bell className="h-4 w-4" />} label="Notificaties" />
          <InfoLink to="/contact" icon={<Mail className="h-4 w-4" />} label="Contact" />
          <InfoLink to="/privacybeleid" icon={<ShieldCheck className="h-4 w-4" />} label="Privacybeleid" />
          <InfoLink to="/voorwaarden" icon={<ScrollText className="h-4 w-4" />} label="Voorwaarden" />
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-[10px] text-muted-foreground">
        TruckMate <span className="font-medium text-foreground">v{APP_VERSION}</span>
      </p>
    </AppShell>
  );
}

function InfoLink({
  to,
  icon,
  label,
}: {
  to: "/over" | "/release-notes" | "/contact" | "/privacybeleid" | "/voorwaarden" | "/notificaties";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link to={to}>
      <Button variant="secondary" size="sm" className="w-full justify-start">
        <span className="mr-2 text-primary">{icon}</span>
        <span className="truncate">{label}</span>
      </Button>
    </Link>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}