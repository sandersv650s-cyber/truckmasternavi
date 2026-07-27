import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminGuard } from "@/components/admin-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MessageSquarePlus } from "lucide-react";
import { adminReviewSuggestion } from "@/lib/admin.functions";
import { suggestionStatusLabels, suggestionStatuses, useMyRoles, type SuggestionStatus } from "@/lib/admin";
import { fetchSuggestions, suggestionFields, type TerminalSuggestion } from "@/lib/terminals";

export const Route = createFileRoute("/beheer/suggesties")({
  head: () => ({
    meta: [
      { title: "Correctievoorstellen — TruckMate beheer" },
      { name: "description", content: "Beoordeel door gebruikers voorgestelde correcties op locaties en openingstijden." },
      { property: "og:title", content: "Correctievoorstellen — TruckMate beheer" },
      { property: "og:description", content: "Moderatie van locatiecorrecties." },
    ],
  }),
  component: AdminSuggestions,
});

function AdminSuggestions() {
  const { isStaff, checking } = useMyRoles();
  const review = useServerFn(adminReviewSuggestion);
  const [rows, setRows] = useState<TerminalSuggestion[] | null>(null);
  const [filter, setFilter] = useState<SuggestionStatus | "all">("new");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setRows(await fetchSuggestions(filter));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden mislukt.");
      setRows([]);
    }
  };

  useEffect(() => {
    if (!checking && isStaff) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, isStaff, filter]);

  return (
    <AdminGuard title="Correctievoorstellen" require="staff">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["all", ...suggestionStatuses] as (SuggestionStatus | "all")[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === s ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}
          >
            {s === "all" ? "Alle" : suggestionStatusLabels[s]}
          </button>
        ))}
      </div>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <MessageSquarePlus className="mx-auto mb-2 h-5 w-5" />
          Geen voorstellen in deze categorie.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {suggestionFields.find((f) => f.value === r.field)?.label ?? r.field}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("nl-NL")} · door{" "}
                      <span className="font-mono">{r.user_id.slice(0, 8)}</span>
                    </p>
                  </div>
                  <Badge className="shrink-0 bg-primary/20 text-primary text-[10px]">
                    {suggestionStatusLabels[r.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{r.suggestion}</p>
                <Input
                  value={notes[r.id] ?? r.review_note ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  placeholder="Interne beoordelingsnotitie"
                  className="text-xs"
                  maxLength={1000}
                />
                <div className="flex flex-wrap gap-1.5">
                  {suggestionStatuses
                    .filter((s) => s !== r.status)
                    .map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await review({
                              data: { suggestionId: r.id, status: s, note: notes[r.id] || undefined },
                            });
                            toast.success("Voorstel bijgewerkt.");
                            await load();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Bijwerken mislukt.");
                          }
                        }}
                      >
                        {suggestionStatusLabels[s]}
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
