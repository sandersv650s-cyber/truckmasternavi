import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminGuard } from "@/components/admin-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminUpdateReport } from "@/lib/admin.functions";
import { reportCategories, reportStatuses, useIsAdmin, type ReportStatus } from "@/lib/admin";

export const Route = createFileRoute("/beheer/meldingen")({
  head: () => ({
    meta: [
      { title: "Meldingen — TruckMate beheer" },
      { name: "description", content: "Bekijk en behandel meldingen van gebruikers." },
      { property: "og:title", content: "Meldingen — TruckMate beheer" },
      { property: "og:description", content: "Rapportages afhandelen." },
    ],
  }),
  component: AdminReports,
});

type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  category: string;
  details: string | null;
  context_type: string | null;
  context_id: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
};

function AdminReports() {
  const { isAdmin, checking } = useIsAdmin();
  const update = useServerFn(adminUpdateReport);
  const [rows, setRows] = useState<Report[] | null>(null);
  const [filter, setFilter] = useState<ReportStatus | "all">("open");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    let q = supabase.from("reports").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error: e } = await q;
    if (e) {
      setError(e.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as Report[]);
    setError(null);
  };

  useEffect(() => {
    if (!checking && isAdmin) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, isAdmin, filter]);

  return (
    <AdminGuard title="Meldingen">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["all", ...reportStatuses] as (ReportStatus | "all")[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === s ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}
          >
            {s === "all" ? "Alle" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Flag className="mx-auto mb-2 h-5 w-5" />
          Geen meldingen in deze categorie.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {reportCategories.find((c) => c.value === r.category)?.label ?? r.category}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("nl-NL")}
                      {r.context_type ? ` · context: ${r.context_type}` : ""}
                    </p>
                  </div>
                  <Badge className="shrink-0 bg-primary/20 text-primary text-[10px]">{r.status}</Badge>
                </div>
                {r.details && <p className="text-xs text-muted-foreground">{r.details}</p>}
                <p className="text-[10px] text-muted-foreground">
                  Melder: <span className="font-mono">{r.reporter_id.slice(0, 8)}</span>
                  {r.reported_user_id && (
                    <>
                      {" · Gemeld: "}
                      <span className="font-mono">{r.reported_user_id.slice(0, 8)}</span>
                    </>
                  )}
                </p>
                <Textarea
                  value={notes[r.id] ?? r.admin_notes ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  placeholder="Interne notitie…"
                  className="min-h-16 text-xs"
                  maxLength={2000}
                />
                <div className="flex flex-wrap gap-1.5">
                  {reportStatuses
                    .filter((s) => s !== r.status)
                    .map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await update({
                              data: { reportId: r.id, status: s, notes: notes[r.id] ?? r.admin_notes ?? undefined },
                            });
                            toast.success("Melding bijgewerkt.");
                            await load();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Bijwerken mislukt.");
                          }
                        }}
                      >
                        {s.replace("_", " ")}
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}
