import { supabase } from "@/integrations/supabase/client";

export type BlockRow = { id: string; blocker_id: string; blocked_id: string; created_at: string };

export async function fetchMyBlocks(userId: string) {
  const { data, error } = await supabase
    .from("user_blocks")
    .select("*")
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
  if (error) throw error;
  return (data ?? []) as BlockRow[];
}

/** IDs of users this user may not interact with (both directions). */
export async function fetchBlockedIds(userId: string): Promise<string[]> {
  const rows = await fetchMyBlocks(userId);
  return Array.from(
    new Set(rows.map((r) => (r.blocker_id === userId ? r.blocked_id : r.blocker_id))),
  );
}

export async function blockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from("user_blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}

export type ReportInput = {
  reporter_id: string;
  reported_user_id?: string | null;
  category: string;
  details?: string | null;
  context_type?: "message" | "profile" | "convoy" | "post" | null;
  context_id?: string | null;
};

export async function createReport(input: ReportInput) {
  const { error } = await supabase.from("reports").insert(input);
  if (error) throw error;
}
