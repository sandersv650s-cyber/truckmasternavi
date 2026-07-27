import { supabase } from "@/integrations/supabase/client";

export type Convoy = {
  id: string;
  leader_id: string;
  name: string;
  status: "planned" | "active" | "ended";
  from_location: string | null;
  to_location: string | null;
  planned_route: unknown;
  invite_code: string;
  starts_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export type ConvoyMember = {
  id: string;
  convoy_id: string;
  user_id: string;
  role: "leader" | "member";
  sharing_location: boolean;
  sharing_until: string | null;
  joined_at: string;
};

export type ConvoyLocation = {
  convoy_id: string;
  user_id: string;
  lat: number;
  lng: number;
  speed_kmh: number | null;
  heading: number | null;
  expires_at: string;
  created_at: string;
};

export async function fetchMyConvoys(userId: string) {
  const { data: mem, error: e1 } = await supabase
    .from("convoy_members")
    .select("convoy_id")
    .eq("user_id", userId);
  if (e1) throw e1;
  const ids = (mem ?? []).map((m) => m.convoy_id);
  if (!ids.length) return [] as Convoy[];
  const { data, error } = await supabase
    .from("convoys")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Convoy[];
}

export async function fetchConvoy(id: string) {
  const { data, error } = await supabase.from("convoys").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Convoy | null;
}

export async function fetchConvoyMembers(convoyId: string) {
  const { data, error } = await supabase
    .from("convoy_members")
    .select("*")
    .eq("convoy_id", convoyId)
    .order("joined_at");
  if (error) throw error;
  return (data ?? []) as ConvoyMember[];
}

export async function createConvoy(input: {
  leader_id: string;
  name: string;
  from_location?: string | null;
  to_location?: string | null;
  starts_at?: string | null;
  planned_route?: unknown;
}) {
  const { data, error } = await supabase
    .from("convoys")
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as Convoy;
}

export async function joinConvoyByCode(code: string, userId: string) {
  const { data: convoy, error } = await supabase
    .from("convoys")
    .select("*")
    .eq("invite_code", code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!convoy) throw new Error("Geen konvooi gevonden met deze code.");
  if (convoy.status === "ended") throw new Error("Dit konvooi is al beëindigd.");
  const { error: e2 } = await supabase
    .from("convoy_members")
    .insert({ convoy_id: convoy.id, user_id: userId });
  if (e2 && !e2.message.includes("duplicate")) throw e2;
  return convoy as Convoy;
}

export async function leaveConvoy(convoyId: string, userId: string) {
  await supabase.from("convoy_locations").delete().eq("convoy_id", convoyId).eq("user_id", userId);
  const { error } = await supabase
    .from("convoy_members")
    .delete()
    .eq("convoy_id", convoyId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function setConvoyStatus(convoyId: string, status: Convoy["status"]) {
  const { error } = await supabase
    .from("convoys")
    .update({ status, ended_at: status === "ended" ? new Date().toISOString() : null })
    .eq("id", convoyId);
  if (error) throw error;
}

export async function setSharing(convoyId: string, userId: string, on: boolean, minutes = 60) {
  const until = on ? new Date(Date.now() + minutes * 60_000).toISOString() : null;
  const { error } = await supabase
    .from("convoy_members")
    .update({ sharing_location: on, sharing_until: until })
    .eq("convoy_id", convoyId)
    .eq("user_id", userId);
  if (error) throw error;
  if (!on) {
    await supabase.from("convoy_locations").delete().eq("convoy_id", convoyId).eq("user_id", userId);
  }
  return until;
}

export async function pushLocation(row: {
  convoy_id: string;
  user_id: string;
  lat: number;
  lng: number;
  speed_kmh?: number | null;
  heading?: number | null;
  expires_at: string;
}) {
  const { error } = await supabase
    .from("convoy_locations")
    .upsert(row, { onConflict: "convoy_id,user_id" });
  if (error) throw error;
}

export async function fetchConvoyLocations(convoyId: string) {
  const { data, error } = await supabase
    .from("convoy_locations")
    .select("*")
    .eq("convoy_id", convoyId)
    .gt("expires_at", new Date().toISOString());
  if (error) throw error;
  return (data ?? []) as ConvoyLocation[];
}
