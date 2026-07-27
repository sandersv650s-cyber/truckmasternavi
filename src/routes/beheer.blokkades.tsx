import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminGuard } from "@/components/admin-guard";
import { Card, CardContent } from "@/components/ui/card";
import { UserX } from "lucide-react";
import { adminListBlocks } from "@/lib/admin.functions";
import { useMyRoles } from "@/lib/admin";

export const Route = createFileRoute("/beheer/blokkades")({
  head: () => ({
    meta: [
      { title: "Blokkades — TruckMate" },
      { name: "description", content: "Overzicht van blokkaderelaties tussen gebruikers." },
      { property: "og:title", content: "Blokkades — TruckMate" },
      { property: "og:description", content: "Moderatie-inzicht in blokkades." },
    ],
  }),
  component: AdminBlocks,
});

type Row = Awaited<ReturnType<typeof adminListBlocks>>[number];

function AdminBlocks() {
  const { isStaff, checking } = useMyRoles();
  const list = useServerFn(adminListBlocks);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checking || !isStaff) return;
    list({ data: {} })
      .then(setRows)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Laden mislukt.");
        setRows([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, isStaff]);

  return (
    <AdminGuard title="Blokkades" require="staff">
      <p className="mb-3 text-[11px] text-muted-foreground">
        Wie heeft wie geblokkeerd. Geblokkeerde gebruikers kunnen elkaar niet chatten en zien elkaars
        berichten niet in de community.
      </p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Er zijn nog geen blokkades.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-start gap-3 p-3">
                <UserX className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    <span className="font-semibold">{r.blocker_name}</span> blokkeerde{" "}
                    <span className="font-semibold">{r.blocked_name}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("nl-NL")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}