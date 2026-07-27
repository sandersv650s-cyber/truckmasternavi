import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyBlocks, unblockUser, type BlockRow } from "@/lib/blocks";
import { initials } from "@/lib/queries";

export const Route = createFileRoute("/geblokkeerd")({
  head: () => ({
    meta: [
      { title: "Geblokkeerde gebruikers — TruckMate" },
      { name: "description", content: "Beheer wie je hebt geblokkeerd in TruckMate Connect." },
      { property: "og:title", content: "Geblokkeerde gebruikers — TruckMate" },
      { property: "og:description", content: "Blokkeringen bekijken en opheffen." },
    ],
  }),
  component: BlockedPage,
});

type MiniProfile = { id: string; full_name: string | null; username: string | null; avatar_url: string | null };

function BlockedPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BlockRow[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, MiniProfile>>({});

  const load = async (uid: string) => {
    const all = await fetchMyBlocks(uid);
    const mine = all.filter((r) => r.blocker_id === uid);
    setRows(mine);
    if (mine.length) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", mine.map((r) => r.blocked_id));
      setProfiles(Object.fromEntries((data ?? []).map((p) => [p.id, p as MiniProfile])));
    }
  };

  useEffect(() => {
    if (user) void load(user.id).catch(() => setRows([]));
  }, [user]);

  return (
    <AppShell title="Geblokkeerd">
      {rows === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <ShieldOff className="mx-auto mb-2 h-5 w-5" />
          Je hebt niemand geblokkeerd.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const p = profiles[r.blocked_id];
            const name = p?.full_name ?? p?.username ?? "Chauffeur";
            return (
              <Card key={r.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p?.avatar_url ?? undefined} alt="" />
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                  </Avatar>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      if (!user) return;
                      try {
                        await unblockUser(user.id, r.blocked_id);
                        toast.success("Blokkade opgeheven.");
                        await load(user.id);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Deblokkeren mislukt.");
                      }
                    }}
                  >
                    Deblokkeren
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
