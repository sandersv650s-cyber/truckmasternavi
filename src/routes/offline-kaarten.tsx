import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Trash2, HardDrive, CheckCircle2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Region = { code: string; flag: string; name: string; sizeMb: number };
type Status = "none" | "downloading" | "done";

const regions: Region[] = [
  { code: "nl", flag: "🇳🇱", name: "Nederland", sizeMb: 420 },
  { code: "be", flag: "🇧🇪", name: "België", sizeMb: 310 },
  { code: "de", flag: "🇩🇪", name: "Duitsland", sizeMb: 1240 },
  { code: "fr", flag: "🇫🇷", name: "Frankrijk", sizeMb: 1120 },
  { code: "es", flag: "🇪🇸", name: "Spanje", sizeMb: 980 },
  { code: "it", flag: "🇮🇹", name: "Italië", sizeMb: 820 },
  { code: "pl", flag: "🇵🇱", name: "Polen", sizeMb: 760 },
  { code: "at-ch", flag: "🇦🇹", name: "Oostenrijk + Zwitserland", sizeMb: 540 },
];

export const Route = createFileRoute("/offline-kaarten")({
  head: () => ({
    meta: [
      { title: "Offline kaarten — TruckMate" },
      { name: "description", content: "Download landen voor navigatie zonder internet." },
      { property: "og:title", content: "Offline kaarten — TruckMate" },
      { property: "og:description", content: "Beheer offline kaartpakketten." },
    ],
  }),
  component: OfflinePage,
});

function OfflinePage() {
  const [status, setStatus] = useState<Record<string, Status>>({ nl: "done", be: "done" });

  const startDownload = (code: string) => {
    setStatus((s) => ({ ...s, [code]: "downloading" }));
    setTimeout(() => setStatus((s) => ({ ...s, [code]: "done" })), 1200);
  };
  const remove = (code: string) => setStatus((s) => ({ ...s, [code]: "none" }));

  const totalMb = regions.filter((r) => status[r.code] === "done").reduce((sum, r) => sum + r.sizeMb, 0);

  return (
    <AppShell title="Offline kaarten">
      <Alert className="mb-4">
        <AlertDescription className="text-[11px]">
          <Badge className="mr-2 bg-primary/30 text-primary">Demo</Badge>
          Echte kaartdownloads komen zodra de HERE- of TomTom-integratie live is. Deze pagina simuleert opslag en download.
        </AlertDescription>
      </Alert>

      <Card className="mb-4">
        <CardContent className="flex items-center gap-3 p-3">
          <HardDrive className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Opslag gebruikt</p>
            <p className="text-sm font-semibold tabular-nums">{(totalMb / 1024).toFixed(2)} GB</p>
          </div>
          <p className="text-[10px] text-muted-foreground">Ruimte over: 24 GB</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {regions.map((r) => {
          const s = status[r.code] ?? "none";
          return (
            <Card key={r.code}>
              <CardContent className="flex items-center gap-3 p-3">
                <span className="text-2xl">{r.flag}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.sizeMb} MB · truck-POI's inbegrepen</p>
                </div>
                {s === "done" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Kaart verwijderen?</AlertDialogTitle>
                        <AlertDialogDescription>{r.name} ({r.sizeMb} MB) wordt uit lokale opslag verwijderd.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(r.code)}>Verwijderen</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {s === "downloading" && (
                  <Badge variant="outline" className="text-[10px]"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Downloaden</Badge>
                )}
                {s === "done" && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]"><CheckCircle2 className="mr-1 h-3 w-3" />Beschikbaar</Badge>
                )}
                {s === "none" && (
                  <Button size="sm" variant="secondary" onClick={() => startDownload(r.code)}>
                    <Download className="mr-1 h-3.5 w-3.5" /> Download
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}