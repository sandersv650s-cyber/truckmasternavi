import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, Search, FileText, AlertTriangle, Trash2 } from "lucide-react";
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
import { initialDocuments, documentCategoryMeta, type DocumentCategory, type StoredDocument } from "@/lib/more-data";

export const Route = createFileRoute("/documenten")({
  head: () => ({
    meta: [
      { title: "Documentenkluis — TruckMate" },
      { name: "description", content: "CMR, vrachtbrief, ADR, voertuigpapieren en bonnetjes in één kluis." },
      { property: "og:title", content: "Documentenkluis — TruckMate" },
      { property: "og:description", content: "Bewaar en vind je documenten snel." },
    ],
  }),
  component: DocumentenPage,
});

const cats: (DocumentCategory | "alle")[] = ["alle", "cmr", "vrachtbrief", "adr", "voertuig", "bonnetjes", "rijbewijs"];

function daysUntil(iso?: string) {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
}

function DocumentenPage() {
  const [docs, setDocs] = useState<StoredDocument[]>(initialDocuments);
  const [cat, setCat] = useState<DocumentCategory | "alle">("alle");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return docs.filter((d) => {
      if (cat !== "alle" && d.category !== cat) return false;
      if (term && !d.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [docs, cat, q]);

  const expiring = docs
    .map((d) => ({ d, days: daysUntil(d.expiresAt) }))
    .filter((r) => r.days !== null && r.days <= 90);

  const remove = (id: string) => setDocs((p) => p.filter((x) => x.id !== id));

  const uploadDemo = () => {
    const id = `d${Date.now()}`;
    setDocs((p) => [
      {
        id,
        category: cat === "alle" ? "bonnetjes" : cat,
        name: `Nieuw_document_${id}.pdf`,
        addedAt: new Date().toISOString().slice(0, 10),
        sizeKb: 96 + Math.round(Math.random() * 400),
        fileType: "pdf",
      },
      ...p,
    ]);
  };

  return (
    <AppShell demoBanner={"Documentenkluis is een demo — bestanden worden nog niet echt bewaard."} title="Documenten">
      <Card className="mb-3 border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 p-3 text-xs">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-muted-foreground">
            Deze kluis toont <span className="font-semibold text-foreground">mock-bestanden</span>. Officiële documenten en regelgeving (transport, ADR, tacho) blijven altijd leidend.
          </p>
        </CardContent>
      </Card>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {(Object.keys(documentCategoryMeta) as DocumentCategory[]).map((k) => {
          const meta = documentCategoryMeta[k];
          const count = docs.filter((d) => d.category === k).length;
          const active = cat === k;
          return (
            <button
              key={k}
              onClick={() => setCat(active ? "alle" : k)}
              className={`flex flex-col items-center rounded-lg border p-3 text-center transition ${
                active ? "border-primary bg-primary/10" : "border-border bg-card/60 hover:border-primary/60"
              }`}
            >
              <span className="text-2xl">{meta.emoji}</span>
              <span className="mt-1 text-xs font-semibold">{meta.label}</span>
              <span className="text-[10px] text-muted-foreground">{count} items</span>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek documenten…" className="pl-9" />
        </div>
        <Button onClick={uploadDemo} className="shrink-0">
          <UploadCloud className="mr-1 h-4 w-4" /> Upload
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              cat === c ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {c === "alle" ? "Alle" : documentCategoryMeta[c].label}
          </button>
        ))}
      </div>

      {expiring.length > 0 && cat === "alle" && (
        <>
          <h2 className="mb-2 text-sm font-semibold">Vervalt binnenkort</h2>
          <div className="mb-4 space-y-2">
            {expiring.map(({ d, days }) => (
              <Card key={`ex-${d.id}`} className="border-amber-500/40">
                <CardContent className="flex items-center gap-3 p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Vervalt {formatDate(d.expiresAt!)} · nog {days} dagen
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-2 text-sm font-semibold">Documenten ({list.length})</h2>
      <div className="space-y-2">
        {list.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Geen documenten in deze categorie.
          </div>
        )}
        {list.map((d) => {
          const meta = documentCategoryMeta[d.category];
          const days = daysUntil(d.expiresAt);
          return (
            <Card key={d.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-background/60 text-lg">
                  {meta.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {meta.label} · {formatDate(d.addedAt)} · {d.sizeKb} KB · {d.fileType.toUpperCase()}
                  </p>
                  {d.expiresAt && (
                    <p className={`text-[11px] ${days !== null && days <= 30 ? "text-amber-300" : "text-muted-foreground"}`}>
                      Vervalt {formatDate(d.expiresAt)}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="ghost" aria-label="Openen" onClick={() => alert("Document openen (demo).")}>
                  <FileText className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" aria-label="Verwijderen">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Document verwijderen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        "{d.name}" wordt uit je kluis verwijderd. Dit kan niet ongedaan worden gemaakt.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(d.id)}>Verwijder</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}