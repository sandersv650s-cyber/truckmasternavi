import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Users, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchConversationSummaries, getOrCreateDirectConversation, type ConversationSummary } from "@/lib/chat";
import { fetchBlockedIds } from "@/lib/blocks";
import { initials, formatDate } from "@/lib/queries";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Berichten — TruckMate" },
      { name: "description", content: "Realtime 1-op-1 chat en groepschat voor je konvooi." },
      { property: "og:title", content: "Berichten — TruckMate" },
      { property: "og:description", content: "Chat met collega-chauffeurs." },
    ],
  }),
  component: ChatList,
});

type MiniProfile = { id: string; full_name: string | null; username: string | null; avatar_url: string | null };

function ChatList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ConversationSummary[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, MiniProfile>>({});
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MiniProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const list = await fetchConversationSummaries(user.id);
        setItems(list);
        const ids = Array.from(new Set(list.flatMap((c) => c.participants.map((p) => p.user_id))));
        if (ids.length) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", ids);
          setProfiles(Object.fromEntries((data ?? []).map((p) => [p.id, p as MiniProfile])));
        }
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gesprekken laden mislukt.");
        setItems([]);
      }
    };
    void load();
    const channel = supabase
      .channel("chat-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!user || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      const blocked = await fetchBlockedIds(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .or(`full_name.ilike.%${query.trim()}%,username.ilike.%${query.trim()}%`)
        .limit(10);
      if (cancelled) return;
      setResults(
        ((data ?? []) as MiniProfile[]).filter((p) => p.id !== user.id && !blocked.includes(p.id)),
      );
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [query, user]);

  const startChat = async (otherId: string) => {
    if (!user) return;
    try {
      const conv = await getOrCreateDirectConversation(user.id, otherId);
      navigate({ to: "/chat/$chatId", params: { chatId: conv.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chat openen mislukt.");
    }
  };

  return (
    <AppShell title="Berichten">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek chauffeur op naam…"
          className="pl-9"
        />
      </div>

      {results.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Zoekresultaten</p>
          {results.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={p.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>{initials(p.full_name ?? p.username)}</AvatarFallback>
                </Avatar>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {p.full_name ?? p.username ?? "Chauffeur"}
                </p>
                <Button size="sm" variant="secondary" onClick={() => startChat(p.id)}>
                  Chat
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      {items === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <MessageSquare className="mx-auto mb-2 h-5 w-5" />
          Nog geen gesprekken. Zoek hierboven een chauffeur of open de groepschat van je konvooi.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const other = c.participants.find((p) => p.user_id !== user?.id);
            const p = other ? profiles[other.user_id] : undefined;
            const title =
              c.conversation.kind === "convoy"
                ? (c.conversation.title ?? "Konvooichat")
                : (p?.full_name ?? p?.username ?? "Chauffeur");
            return (
              <Link key={c.conversation.id} to="/chat/$chatId" params={{ chatId: c.conversation.id }}>
                <Card className="transition hover:border-primary/60">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarImage src={p?.avatar_url ?? undefined} alt="" />
                      <AvatarFallback>
                        {c.conversation.kind === "convoy" ? <Users className="h-4 w-4" /> : initials(title)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{title}</p>
                        {c.lastMessage && (
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatDate(c.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {c.lastMessage?.text ?? "Nog geen berichten"}
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <Badge className="shrink-0 bg-primary text-primary-foreground">{c.unread}</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Button asChild variant="ghost" className="mt-4 w-full text-xs text-muted-foreground">
        <Link to="/geblokkeerd">
          <ShieldOff className="mr-1 h-4 w-4" /> Geblokkeerde gebruikers beheren
        </Link>
      </Button>
    </AppShell>
  );
}
