import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StorageAvatarImage, StorageImg } from "@/lib/storage-image";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, ImageIcon, Send, Loader2, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, initials, type PostRow, type Profile, type CommentRow } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — TruckMate" },
      { name: "description", content: "Deel foto's, tips en berichten met andere chauffeurs." },
      { property: "og:title", content: "Community — TruckMate" },
      { property: "og:description", content: "De feed voor Nederlandse vrachtwagenchauffeurs." },
    ],
  }),
  component: CommunityPage,
});

type FeedItem = PostRow & {
  author: Profile | null;
  liked_by_me: boolean;
  comment_count: number;
};

function CommunityPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const feedQ = useQuery({
    queryKey: ["feed", user?.id ?? "anon"],
    queryFn: async (): Promise<FeedItem[]> => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (posts ?? []) as PostRow[];
      if (rows.length === 0) return [];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const postIds = rows.map((r) => r.id);
      const [profilesRes, likesRes, commentsRes] = await Promise.all([
        supabase.from("profiles").select("*").in("id", userIds),
        user
          ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
          : Promise.resolve({ data: [], error: null } as const),
        supabase.from("post_comments").select("post_id").in("post_id", postIds),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (likesRes.error) throw likesRes.error;
      if (commentsRes.error) throw commentsRes.error;
      const profByID = new Map((profilesRes.data as Profile[]).map((p) => [p.id, p]));
      const likedSet = new Set(((likesRes.data ?? []) as { post_id: string }[]).map((l) => l.post_id));
      const commentCount = new Map<string, number>();
      for (const c of ((commentsRes.data ?? []) as { post_id: string }[])) {
        commentCount.set(c.post_id, (commentCount.get(c.post_id) ?? 0) + 1);
      }
      return rows.map((r) => ({
        ...r,
        author: profByID.get(r.user_id) ?? null,
        liked_by_me: likedSet.has(r.id),
        comment_count: commentCount.get(r.id) ?? 0,
      }));
    },
  });

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const submit = async () => {
    if (!user || (!text.trim() && !file)) return;
    setPosting(true);
    try {
      let imageUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("post-images").upload(path, file, { contentType: file.type });
        if (up.error) throw up.error;
        imageUrl = path;
      }
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        text: text.trim() || "(zonder tekst)",
        image_url: imageUrl,
      });
      if (error) throw error;
      setText("");
      pickFile(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Bericht geplaatst");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setPosting(false);
    }
  };

  const likeMut = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (!user) throw new Error("Niet ingelogd");
      if (liked) {
        const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Bericht verwijderd");
    },
  });

  return (
    <AppShell title="Community">
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback>{initials(user?.email ?? "", "?")}</AvatarFallback>
            </Avatar>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Deel iets met de community…"
              className="min-h-20 resize-none"
              maxLength={2000}
            />
          </div>
          {previewUrl && (
            <div className="relative mt-2 overflow-hidden rounded-lg">
              <img src={previewUrl} alt="" className="max-h-64 w-full object-cover" />
              <button
                onClick={() => { pickFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                aria-label="Foto verwijderen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => fileRef.current?.click()}>
              <ImageIcon className="mr-1 h-4 w-4" /> Foto
            </Button>
            <Input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <Button size="sm" onClick={submit} disabled={posting || (!text.trim() && !file)}>
              {posting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />} Plaatsen
            </Button>
          </div>
        </CardContent>
      </Card>

      {feedQ.isLoading ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Laden…</div>
      ) : feedQ.error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">Kon feed niet laden.</div>
      ) : (feedQ.data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nog geen berichten. Wees de eerste!
        </div>
      ) : (
        <div className="space-y-3">
          {feedQ.data!.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              currentUserId={user?.id ?? null}
              onLike={() => likeMut.mutate({ postId: p.id, liked: p.liked_by_me })}
              onDelete={() => { if (confirm("Bericht verwijderen?")) deletePost.mutate(p.id); }}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function PostCard({
  post,
  currentUserId,
  onLike,
  onDelete,
}: {
  post: FeedItem;
  currentUserId: string | null;
  onLike: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const mine = currentUserId === post.user_id;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Link to="/profiel/$userId" params={{ userId: post.user_id }}>
            <Avatar className="h-10 w-10">
              <StorageAvatarImage bucket="avatars" path={post.author?.avatar_url} />
              <AvatarFallback>{initials(post.author?.full_name)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to="/profiel/$userId"
              params={{ userId: post.user_id }}
              className="text-sm font-semibold hover:underline"
            >
              {post.author?.full_name ?? "Chauffeur"}
            </Link>
            <p className="text-[11px] text-muted-foreground">
              {post.author?.truck ? `${post.author.truck} · ` : ""}{formatDate(post.created_at)}
            </p>
          </div>
          {mine && (
            <button onClick={onDelete} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Verwijderen">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.text}</p>
        {post.image_url && (
          <StorageImg
            bucket="post-images"
            path={post.image_url}
            className="mt-3 max-h-96 w-full rounded-lg object-cover"
          />
        )}
        <div className="mt-3 flex items-center gap-4 text-sm">
          <button
            onClick={onLike}
            disabled={!currentUserId}
            className={`flex items-center gap-1 transition ${post.liked_by_me ? "text-destructive" : "text-muted-foreground hover:text-foreground"} disabled:opacity-50`}
          >
            <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`} />
            {post.likes_count}
          </button>
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <MessageCircle className="h-4 w-4" />
            {post.comment_count}
          </button>
        </div>
        {open && <Comments postId={post.id} currentUserId={currentUserId} />}
      </CardContent>
    </Card>
  );
}

function Comments({ postId, currentUserId }: { postId: string; currentUserId: string | null }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as CommentRow[];
      if (rows.length === 0) return { rows: [] as CommentRow[], authors: new Map<string, Profile>() };
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profs, error: pe } = await supabase.from("profiles").select("*").in("id", ids);
      if (pe) throw pe;
      return { rows, authors: new Map((profs as Profile[]).map((p) => [p.id, p])) };
    },
  });
  const [text, setText] = useState("");
  const add = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Niet ingelogd");
      const t = text.trim();
      if (!t) return;
      const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: currentUserId, text: t });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      {q.isLoading ? (
        <p className="text-xs text-muted-foreground">Laden…</p>
      ) : (q.data?.rows ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground">Nog geen reacties.</p>
      ) : (
        q.data!.rows.map((c) => {
          const a = q.data!.authors.get(c.user_id);
          return (
            <div key={c.id} className="flex gap-2">
              <Avatar className="h-7 w-7 shrink-0">
                <StorageAvatarImage bucket="avatars" path={a?.avatar_url} />
                <AvatarFallback>{initials(a?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-lg bg-muted/40 p-2">
                <p className="text-xs font-semibold">{a?.full_name ?? "Chauffeur"}</p>
                <p className="text-sm">{c.text}</p>
              </div>
            </div>
          );
        })
      )}
      {currentUserId && (
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Schrijf een reactie…"
            maxLength={1000}
            onKeyDown={(e) => { if (e.key === "Enter") add.mutate(); }}
          />
          <Button size="sm" onClick={() => add.mutate()} disabled={add.isPending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
