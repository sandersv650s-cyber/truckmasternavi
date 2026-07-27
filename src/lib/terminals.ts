import { supabase } from "@/integrations/supabase/client";

export const terminalTypes = {
  dc: "Distributiecentrum",
  terminal: "Terminal",
  warehouse: "Magazijn",
  port: "Haven",
  crossdock: "Cross-dock",
} as const;
export type TerminalType = keyof typeof terminalTypes;

export type Terminal = {
  id: string;
  name: string;
  type: TerminalType;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facilities: string[];
  wait_time_notes: string | null;
  notes: string | null;
};

export type TerminalHour = {
  id: string;
  terminal_id: string;
  weekday: number;
  opens: string | null;
  closes: string | null;
  closed: boolean;
};

export const weekdayLabels = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

export async function fetchTerminals() {
  const { data, error } = await supabase.from("terminals").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Terminal[];
}

export async function fetchTerminal(id: string) {
  const { data, error } = await supabase.from("terminals").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Terminal | null;
}

export async function fetchHours(terminalIds: string[]) {
  if (!terminalIds.length) return [] as TerminalHour[];
  const { data, error } = await supabase
    .from("terminal_hours")
    .select("*")
    .in("terminal_id", terminalIds)
    .order("weekday");
  if (error) throw error;
  return (data ?? []) as TerminalHour[];
}

export function isOpenNow(hours: TerminalHour[], now = new Date()) {
  const h = hours.find((x) => x.weekday === now.getDay());
  if (!h || h.closed || !h.opens || !h.closes) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const o = toMin(h.opens);
  const c = toMin(h.closes);
  return c > o ? mins >= o && mins < c : mins >= o || mins < c;
}

export async function upsertTerminal(t: Partial<Terminal> & { name: string }) {
  const { data, error } = await supabase.from("terminals").upsert(t).select("*").single();
  if (error) throw error;
  return data as Terminal;
}

export async function deleteTerminal(id: string) {
  const { error } = await supabase.from("terminals").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertHours(terminalId: string, rows: Omit<TerminalHour, "id" | "terminal_id">[]) {
  const payload = rows.map((r) => ({ ...r, terminal_id: terminalId }));
  const { error } = await supabase
    .from("terminal_hours")
    .upsert(payload, { onConflict: "terminal_id,weekday" });
  if (error) throw error;
}
