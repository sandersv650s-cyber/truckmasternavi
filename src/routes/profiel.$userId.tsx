import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StorageAvatarImage, StorageImg } from "@/lib/storage-image";
import { Truck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, initials, formatDate, type PostRow } from "@/lib/queries";

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
  const profQ = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId) });
  const postsQ = useQuery({
    queryKey: ["profile-posts", userId],
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

          <h3 className="mb-2 text-sm font-semibold">Recente berichten</h3>
          {postsQ.isLoading ? (
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
