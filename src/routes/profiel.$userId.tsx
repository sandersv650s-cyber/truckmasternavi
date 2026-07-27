import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StorageAvatarImage, StorageImg } from "@/lib/storage-image";
import { Truck, ArrowLeft, MessageSquare, ShieldOff, ShieldCheck, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, initials, formatDate, type PostRow } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { blockUser, fetchBlockedIds, unblockUser } from "@/lib/blocks";
import { getOrCreateDirectConversation } from "@/lib/chat";
import { ReportDialog } from "@/components/report-dialog";

export const Route = createFileRoute("/profiel/$userId")({
  head: () => ({
    meta: [
      { title: "Profiel — TruckMate" },
      { name: "description", content: "Chauffeursprofiel in TruckMate." },
      { property: "og:title", content: "Profiel — TruckMate" },
      { property: "og:description", content: "Bekijk chauffeursprofielen op TruckMate." },
    ],
  }),
  notFoundComponent: () => (
    <AppShell title="Niet gevonden"><p className="text-sm text-muted-foreground">Profiel niet gevonden.</p></AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell title="Fout"><p className="text-sm text-destructive">{error.message}</p></AppShell>
  ),
  component: UserProfile,
});

function UserProfile() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isSelf = user?.id === userId;
  const profQ = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId) });
  const blockedQ = useQuery({
    queryKey: ["blocked-ids", user?.id],
    queryFn: () => fetchBlockedIds(user!.id),
    enabled: !!user,
  });
  const isBlocked = (blockedQ.data ?? []).includes(userId);
  const postsQ = useQuery({
    queryKey: ["profile-posts", userId],
    enabled: !isBlocked,
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as PostRow[];
    },
  });

  return (
    <AppShell
      title={profQ.data?.full_name ?? "Profiel"}
      action={<Link to="/community"><Button size="sm" variant="ghost"><ArrowLeft className="mr-1 h-4 w-4" /> Terug</Button></Link>}
    >
      {profQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : !profQ.data ? (
        <p className="text-sm text-muted-foreground">Profiel niet gevonden.</p>
      ) : (
        <>
          <Card className="mb-4 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/20" />
            <CardContent className="-mt-10 p-4">
              <Avatar className="h-20 w-20 border-4 border-card">
                <StorageAvatarImage bucket="avatars" path={profQ.data.avatar_url} />
                <AvatarFallback>{initials(profQ.data.full_name)}</AvatarFallback>
              </Avatar>
              <h2 className="mt-2 text-lg font-bold">{profQ.data.full_name ?? "Chauffeur"}</h2>
              {profQ.data.username && <p className="text-xs text-muted-foreground">@{profQ.data.username}</p>}
              {profQ.data.bio && <p className="mt-3 text-sm leading-relaxed">{profQ.data.bio}</p>}
              {profQ.data.truck && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <Truck className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{profQ.data.truck}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {user && !isSelf && (
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={isBlocked}
                onClick={async () => {
                  try {
                    const conv = await getOrCreateDirectConversation(user.id, userId);
                    void navigate({ to: "/chat/$chatId", params: { chatId: conv.id } });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Chat starten mislukt.");
                  }
                }}
              >
                <MessageSquare className="mr-1 h-4 w-4" /> Bericht sturen
              </Button>
              <Button
                size="sm"
                variant={isBlocked ? "secondary" : "outline"}
                onClick={async () => {
                  try {
                    if (isBlocked) {
                      await unblockUser(user.id, userId);
                      toast.success("Blokkade opgeheven.");
                    } else {
                      await blockUser(user.id, userId);
                      toast.success("Gebruiker geblokkeerd. Jullie kunnen elkaar niet meer berichten.");
                    }
                    await qc.invalidateQueries({ queryKey: ["blocked-ids", user.id] });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Actie mislukt.");
                  }
                }}
              >
                {isBlocked ? (
                  <>
                    <ShieldCheck className="mr-1 h-4 w-4" /> Deblokkeren
                  </>
                ) : (
                  <>
                    <ShieldOff className="mr-1 h-4 w-4" /> Blokkeren
                  </>
                )}
              </Button>
              <ReportDialog
                reportedUserId={userId}
                contextType="profile"
                contextId={userId}
                trigger={
                  <Button size="sm" variant="ghost">
                    <Flag className="mr-1 h-4 w-4" /> Melden
                  </Button>
                }
              />
            </div>
          )}

          <h3 className="mb-2 text-sm font-semibold">Recente berichten</h3>
          {isBlocked ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Er is een blokkade actief tussen jullie. Berichten van deze gebruiker worden verborgen.
            </p>
          ) : postsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : (postsQ.data ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nog geen berichten.</p>
          ) : (
            <div className="space-y-2">
              {postsQ.data!.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-3">
                    <p className="text-sm">{p.text}</p>
                    {p.image_url && <StorageImg bucket="post-images" path={p.image_url} className="mt-2 max-h-64 w-full rounded-lg object-cover" />}
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(p.created_at)} · ♥ {p.likes_count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
