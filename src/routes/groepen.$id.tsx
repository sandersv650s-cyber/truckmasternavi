import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Users, Send, UserPlus, LogOut, Heart, MessageCircle } from "lucide-react";
import { groupById, groupKindMeta, type Group } from "@/lib/more-data";
import { userById, currentUser } from "@/lib/mock-data";
import { minAgoLabel } from "@/lib/discover-data";

export const Route = createFileRoute("/groepen/$id")({
  loader: ({ params }) => {
    const group = groupById(params.id);
    if (!group) throw notFound();
    return { group };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.group?.name ?? "Groep"} — TruckMate` },
      { name: "description", content: loaderData?.group?.description ?? "Groepsdetail." },
      { property: "og:title", content: `${loaderData?.group?.name ?? "Groep"} — TruckMate` },
    ],
  }),
  notFoundComponent: () => (
    <AppShell title="Niet gevonden">
      <p className="text-sm text-muted-foreground">Deze groep bestaat niet.</p>
      <Link to="/groepen" className="mt-3 inline-block text-sm text-primary underline">
        Terug naar overzicht
      </Link>
    </AppShell>
  ),
  component: GroupDetail,
});

function GroupDetail() {
  const { group } = Route.useLoaderData() as { group: Group };
  const [joined, setJoined] = useState(group.joined);
  const [posts, setPosts] = useState(group.posts);
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim() || !joined) return;
    setPosts((p) => [
      { id: `p${Date.now()}`, userId: currentUser.id, text: text.trim(), minAgo: 0, likes: 0 },
      ...p,
    ]);
    setText("");
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative">
        <img src={group.cover} alt="" className="h-40 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <Link to="/groepen" className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur" aria-label="Terug">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
      <main className="mx-auto -mt-8 max-w-2xl px-4 pb-8">
        <Card>
          <CardContent className="p-4">
            <Badge className={`mb-2 border text-[10px] ${groupKindMeta[group.kind].color}`}>
              {groupKindMeta[group.kind].emoji} {groupKindMeta[group.kind].label}
            </Badge>
            <h1 className="text-lg font-bold">{group.name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{group.description}</p>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" /> {group.members + (joined && !group.joined ? 1 : 0)} leden
            </p>
            <div className="mt-3 flex gap-2">
              {joined ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="secondary" className="flex-1">
                      <LogOut className="mr-1 h-4 w-4" /> Verlaten
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Groep verlaten?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Je ziet nieuwe berichten van "{group.name}" niet meer in je feed. Je kunt later weer lid worden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction onClick={() => setJoined(false)}>Verlaten</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button className="flex-1" onClick={() => setJoined(true)}>
                  <UserPlus className="mr-1 h-4 w-4" /> Word lid
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => alert("Uitnodiging (demo) verstuurd via chat.")}>
                Uitnodigen
              </Button>
            </div>
          </CardContent>
        </Card>

        <h2 className="mb-2 mt-6 text-sm font-semibold">Leden</h2>
        <div className="flex flex-wrap gap-2">
          {group.memberIds.map((id) => {
            const u = userById(id);
            return (
              <div key={id} className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-2 py-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={u.avatar} alt="" />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs">{u.name}</span>
              </div>
            );
          })}
          <div className="grid h-8 place-items-center rounded-full border border-dashed border-border px-3 text-[10px] text-muted-foreground">
            +{Math.max(0, group.members - group.memberIds.length)} anderen
          </div>
        </div>

        <h2 className="mb-2 mt-6 text-sm font-semibold">Nieuw bericht</h2>
        <Card>
          <CardContent className="space-y-2 p-3">
            {!joined && (
              <p className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                Word lid om berichten te plaatsen.
              </p>
            )}
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={joined ? "Deel iets met de groep…" : "Alleen leden kunnen posten."}
              className="min-h-16"
              disabled={!joined}
            />
            <Button className="w-full" onClick={submit} disabled={!joined || !text.trim()}>
              <Send className="mr-1 h-4 w-4" /> Plaatsen
            </Button>
          </CardContent>
        </Card>

        <h2 className="mb-2 mt-6 text-sm font-semibold">Recente berichten</h2>
        <div className="space-y-2">
          {posts.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nog geen berichten in deze groep.
            </div>
          )}
          {posts.map((p) => {
            const u = userById(p.userId);
            return (
              <Card key={p.id}>
                <CardContent className="flex gap-3 p-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={u.avatar} alt="" />
                    <AvatarFallback>{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <span className="text-[10px] text-muted-foreground">{minAgoLabel(p.minAgo)}</span>
                    </div>
                    <p className="mt-1 text-sm">{p.text}</p>
                    <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Heart className="h-3 w-3" /> {p.likes}
                      <MessageCircle className="h-3 w-3" /> 0
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}