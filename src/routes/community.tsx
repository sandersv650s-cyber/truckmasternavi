import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, ImageIcon, Send } from "lucide-react";
import { posts as seedPosts, userById, currentUser, formatDate, type Post } from "@/lib/mock-data";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — TruckMate" },
      { name: "description", content: "Deel foto's en berichten met andere chauffeurs." },
      { property: "og:title", content: "Community — TruckMate" },
      { property: "og:description", content: "De feed voor Nederlandse vrachtwagenchauffeurs." },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(seedPosts);
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    setPosts((p) => [
      {
        id: `p${Date.now()}`,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
        text: text.trim(),
        likes: 0,
        comments: [],
      },
      ...p,
    ]);
    setText("");
  };

  const toggleLike = (id: string) =>
    setPosts((p) =>
      p.map((x) => (x.id === id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)),
    );

  return (
    <AppShell title="Community">
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={currentUser.avatar} alt="" />
              <AvatarFallback>JV</AvatarFallback>
            </Avatar>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Deel iets met de community…"
              className="min-h-20 resize-none"
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ImageIcon className="mr-1 h-4 w-4" /> Foto
            </Button>
            <Button size="sm" onClick={submit} disabled={!text.trim()}>
              <Send className="mr-1 h-4 w-4" /> Plaatsen
            </Button>
          </div>
        </CardContent>
      </Card>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nog geen berichten. Wees de eerste!
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const u = userById(p.userId);
            return (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Link to="/profiel/$userId" params={{ userId: u.id }}>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={u.avatar} alt={u.name} />
                        <AvatarFallback>{u.name[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/profiel/$userId"
                        params={{ userId: u.id }}
                        className="text-sm font-semibold hover:underline"
                      >
                        {u.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        {u.truck} · {formatDate(p.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{p.text}</p>
                  {p.image && (
                    <img
                      src={p.image}
                      alt=""
                      className="mt-3 aspect-[4/3] w-full rounded-lg object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <button
                      onClick={() => toggleLike(p.id)}
                      className={`flex items-center gap-1 transition ${
                        p.liked ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${p.liked ? "fill-current" : ""}`} />
                      {p.likes}
                    </button>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      {p.comments.length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}