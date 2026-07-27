import { supabase } from "@/integrations/supabase/client";
import { fetchBlockedIds } from "./blocks";

export type Conversation = {
  id: string;
  kind: "direct" | "convoy";
  title: string | null;
  convoy_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Participant = {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

export type ConversationSummary = {
  conversation: Conversation;
  participants: Participant[];
  lastMessage: Message | null;
  unread: number;
};

export async function fetchMyConversationIds(userId: string) {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.conversation_id);
}

export async function fetchConversationSummaries(userId: string): Promise<ConversationSummary[]> {
  const ids = await fetchMyConversationIds(userId);
  if (!ids.length) return [];
  const [{ data: convs, error: e1 }, { data: parts, error: e2 }, { data: msgs, error: e3 }] =
    await Promise.all([
      supabase.from("conversations").select("*").in("id", ids).order("updated_at", { ascending: false }),
      supabase.from("conversation_participants").select("*").in("conversation_id", ids),
      supabase
        .from("messages")
        .select("*")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;
  const participants = (parts ?? []) as Participant[];
  const messages = (msgs ?? []) as Message[];
  return ((convs ?? []) as Conversation[]).map((c) => {
    const mine = participants.find((p) => p.conversation_id === c.id && p.user_id === userId);
    const cMsgs = messages.filter((m) => m.conversation_id === c.id);
    return {
      conversation: c,
      participants: participants.filter((p) => p.conversation_id === c.id),
      lastMessage: cMsgs[0] ?? null,
      unread: mine
        ? cMsgs.filter((m) => m.sender_id !== userId && m.created_at > mine.last_read_at).length
        : 0,
    };
  });
}

export async function fetchUnreadTotal(userId: string) {
  const list = await fetchConversationSummaries(userId);
  return list.reduce((n, c) => n + c.unread, 0);
}

export async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(conversationId: string, senderId: string, text: string) {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, text });
  if (error) {
    if (error.code === "42501") throw new Error("Bericht kan niet verstuurd worden (blokkade actief).");
    throw error;
  }
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function markRead(conversationId: string, userId: string) {
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}

export async function getOrCreateDirectConversation(userId: string, otherId: string) {
  const blocked = await fetchBlockedIds(userId);
  if (blocked.includes(otherId)) throw new Error("Chat niet mogelijk: er is een blokkade actief.");
  const mine = await fetchMyConversationIds(userId);
  if (mine.length) {
    const { data, error } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherId)
      .in("conversation_id", mine);
    if (error) throw error;
    const candidateIds = (data ?? []).map((r) => r.conversation_id);
    if (candidateIds.length) {
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .in("id", candidateIds)
        .eq("kind", "direct")
        .limit(1);
      if (convs?.length) return convs[0] as Conversation;
    }
  }
  const { data: conv, error: e1 } = await supabase
    .from("conversations")
    .insert({ kind: "direct", created_by: userId })
    .select("*")
    .single();
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: userId },
    { conversation_id: conv.id, user_id: otherId },
  ]);
  if (e2) throw e2;
  return conv as Conversation;
}

export async function getOrCreateConvoyConversation(
  convoyId: string,
  convoyName: string,
  userId: string,
  memberIds: string[],
) {
  const { data: existing, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("convoy_id", convoyId)
    .maybeSingle();
  if (error) throw error;
  let conv = existing as Conversation | null;
  if (!conv) {
    const { data, error: e1 } = await supabase
      .from("conversations")
      .insert({ kind: "convoy", convoy_id: convoyId, title: convoyName, created_by: userId })
      .select("*")
      .single();
    if (e1) throw e1;
    conv = data as Conversation;
  }
  const { data: parts } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conv.id);
  const have = new Set((parts ?? []).map((p) => p.user_id));
  const missing = memberIds.filter((id) => !have.has(id));
  if (missing.includes(userId)) {
    await supabase.from("conversation_participants").insert({ conversation_id: conv.id, user_id: userId });
  }
  return conv;
}
