import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  truck: string | null;
  avatar_url: string | null;
};

export type Ride = {
  id: string;
  user_id: string;
  from_location: string;
  to_location: string;
  status: "active" | "paused" | "completed";
  started_at: string;
  ended_at: string | null;
  duration_min: number;
  km: number;
  avg_speed: number | null;
  max_speed: number | null;
  liters: number | null;
  l100: number | null;
  notes: string | null;
  created_at: string;
};

export type PostRow = {
  id: string;
  user_id: string;
  text: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
};

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
};

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function upsertProfile(patch: Partial<Profile> & { id: string }) {
  const { error } = await supabase.from("profiles").upsert(patch, { onConflict: "id" });
  if (error) throw error;
}

export function initials(name?: string | null, fallback = "?") {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}u ${m}m` : `${m}m`;
}
