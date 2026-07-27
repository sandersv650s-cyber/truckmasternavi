import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/admin";

export const Route = createFileRoute("/beheer/auditlog")({
  head: () => ({
    meta: [
      { title: "Auditlog — TruckMate beheer" },
      { name: "description", content: "Volledig logboek van alle uitgevoerde beheeracties." },
      { property: "og:title", content: "Auditlog — TruckMate beheer" },
      { property: "og:description", content: "Transparant logboek van beheeracties." },
    ],
  }),
  component: AuditLog,
});

type Entry = {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

function AuditLog() {
  const { isAdmin, checking } = useIsAdmin();
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checking || !isAdmin) return;
    supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error: e }) => {
        if (e) {
          setError(e.message);
          setRows([]);
          return;
        }
        setRows((data ?? []) as Entry[]);
      });
  }, [checking, isAdmin]);

  return (
    <AdminGuard title="Auditlog">
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <ScrollText className="mx-auto mb-2 h-5 w-5" />
          Nog geen beheeracties gelogd.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-3">
                <p className="text-sm font-semibold">{e.action}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("nl-NL")} · {e.target_type}{" "}
                  <span className="font-mono">{e.target_id.slice(0, 8)}</span>
                </p>
                {e.details && Object.keys(e.details).length > 0 && (
                  <pre className="mt-1 overflow-x-auto rounded bg-muted/40 p-2 text-[10px] text-muted-foreground">
                    {JSON.stringify(e.details, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}
