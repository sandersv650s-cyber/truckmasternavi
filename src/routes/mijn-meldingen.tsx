import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/queries";

export const Route = createFileRoute("/mijn-meldingen")({
  head: () => ({
    meta: [
      { title: "Mijn meldingen — TruckMate" },
      { name: "description", content: "Bekijk de status van meldingen die je hebt ingediend bij de moderatie." },
      { property: "og:title", content: "Mijn meldingen — TruckMate" },
      { property: "og:description", content: "Volg de afhandeling van je meldingen in TruckMate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <AppShell title="Fout"><p className="text-sm text-destructive">{error.message}</p></AppShell>
  ),
  component: MyReports,
});

type Row = {
  id: string;
  category: string;
  details: string | null;
  context_type: string | null;
  status: string;
  action_taken: string | null;
  handled_at: string | null;
  created_at: string;
};

const statusLabel: Record<string, string> = {
  open: "Open",
  in_behandeling: "In behandeling",
  afgehandeld: "Afgehandeld",
  afgewezen: "Afgewezen",
};

function MyReports() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my-reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, category, details, context_type, status, action_taken, handled_at, created_at")
        .eq("reporter_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  return (
    <AppShell
      title="Mijn meldingen"
      action={
        <Link to="/meer">
          <Button size="sm" variant="ghost"><ArrowLeft className="mr-1 h-4 w-4" /> Terug</Button>
        </Link>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Hier zie je de meldingen die je hebt ingediend en hoe ver de moderatie ermee is. Interne
        moderatienotities zijn niet zichtbaar.
      </p>
      {!user ? (
        <p className="text-sm text-muted-foreground">Log in om je meldingen te bekijken.</p>
      ) : q.isLoading ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : (q.data ?? []).length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Je hebt nog geen meldingen ingediend.
        </p>
      ) : (
        <div className="space-y-2">
          {q.data!.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{r.category}</span>
                  <Badge variant={r.status === "afgehandeld" ? "default" : "secondary"}>
                    {statusLabel[r.status] ?? r.status}
                  </Badge>
                </div>
                {r.details && <p className="mt-1 text-sm text-muted-foreground">{r.details}</p>}
                {r.action_taken && (
                  <p className="mt-2 text-xs">
                    <span className="font-medium">Actie:</span> {r.action_taken}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Ingediend {formatDate(r.created_at)}
                  {r.handled_at ? ` · afgehandeld ${formatDate(r.handled_at)}` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
