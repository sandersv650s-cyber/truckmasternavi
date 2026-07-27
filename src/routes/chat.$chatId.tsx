import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, MoreVertical, Send, Ban, Flag, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchMessages,
  markRead,
  sendMessage,
  type Conversation,
  type Message,
  type Participant,
} from "@/lib/chat";
import { blockUser, fetchBlockedIds } from "@/lib/blocks";
import { ReportDialog } from "@/components/report-dialog";
import { initials } from "@/lib/queries";

export const Route = createFileRoute("/chat/$chatId")({
  head: () => ({
    meta: [
      { title: "Gesprek — TruckMate" },
      { name: "description", content: "Realtime chat met een chauffeur of konvooigroep." },
      { property: "og:title", content: "Gesprek — TruckMate" },
      { property: "og:description", content: "Chat in TruckMate Connect." },
    ],
  }),
  component: ChatView,
});

type MiniProfile = { id: string; full_name: string | null; username: string | null; avatar_url: string | null };

function ChatView() {
  const { chatId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [profiles, setProfiles] = useState<Record<string, MiniProfile>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data: conv, error: e1 } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", chatId)
        .maybeSingle();
      if (e1) throw e1;
      if (!conv) {
        setError("Dit gesprek bestaat niet of je hebt er geen toegang toe.");
        return;
      }
      setConversation(conv as Conversation);
      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("*")
        .eq("conversation_id", chatId);
      const ps = (parts ?? []) as Participant[];
      setParticipants(ps);
      const ids = ps.map((p) => p.user_id);
      if (ids.length) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", ids);
        setProfiles(Object.fromEntries((data ?? []).map((p) => [p.id, p as MiniProfile])));
      }
      setMessages(await fetchMessages(chatId));
      setBlockedIds(await fetchBlockedIds(user.id));
      await markRead(chatId, user.id);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gesprek laden mislukt.");
    } finally {
      setLoading(false);
    }
  }, [chatId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${chatId}` },
        (payload) => {
          setMessages((m) => {
            const msg = payload.new as Message;
            return m.some((x) => x.id === msg.id) ? m : [...m, msg];
          });
          if (user) void markRead(chatId, user.id);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const other = participants.find((p) => p.user_id !== user?.id);
  const otherProfile = other ? profiles[other.user_id] : undefined;
  const isGroup = conversation?.kind === "convoy";
  const title = isGroup
    ? (conversation?.title ?? "Konvooichat")
    : (otherProfile?.full_name ?? otherProfile?.username ?? "Chauffeur");
  const blocked = Boolean(other && blockedIds.includes(other.user_id));

  const send = async () => {
    if (!user || !text.trim()) return;
    const body = text.trim().slice(0, 2000);
    setText("");
    try {
      await sendMessage(chatId, user.id, body);
    } catch (e) {
      setText(body);
      toast.error(e instanceof Error ? e.message : "Versturen mislukt.");
    }
  };

  const doBlock = async () => {
    if (!user || !other) return;
    try {
      await blockUser(user.id, other.user_id);
      toast.success("Gebruiker geblokkeerd. Jullie kunnen elkaar geen berichten meer sturen.");
      setBlockedIds((b) => [...b, other.user_id]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Blokkeren mislukt.");
    }
  };

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <p className="text-sm text-destructive">{error}</p>
          <Button className="mt-3" variant="secondary" onClick={() => navigate({ to: "/chat" })}>
            Terug naar berichten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-2">
          <Link to="/chat">
            <Button variant="ghost" size="icon" aria-label="Terug naar chats">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-9 w-9">
            <AvatarImage src={otherProfile?.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{isGroup ? <Users className="h-4 w-4" /> : initials(title)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="text-[11px] text-muted-foreground">
              {isGroup ? `${participants.length} deelnemers` : blocked ? "Geblokkeerd" : "Realtime"}
            </p>
          </div>
          {!isGroup && other && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Meer opties">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={doBlock} disabled={blocked}>
                  <Ban className="mr-2 h-4 w-4" /> Blokkeren
                </DropdownMenuItem>
                <ReportDialog
                  reportedUserId={other.user_id}
                  contextType="message"
                  contextId={chatId}
                  trigger={
                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                      <Flag className="mr-2 h-4 w-4" /> Rapporteren
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-2 px-3 py-4">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Laden…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nog geen berichten. Stuur het eerste bericht.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            const sender = profiles[m.sender_id];
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm border border-border bg-card text-card-foreground"
                  }`}
                >
                  {isGroup && !mine && (
                    <p className="mb-0.5 text-[10px] font-semibold text-primary">
                      {sender?.full_name ?? sender?.username ?? "Chauffeur"}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl items-center gap-2 p-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={blocked ? "Blokkade actief — berichten uitgeschakeld" : "Bericht…"}
            disabled={blocked}
            maxLength={2000}
            className="flex-1"
          />
          <Button size="icon" onClick={send} disabled={!text.trim() || blocked} aria-label="Verstuur bericht">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
