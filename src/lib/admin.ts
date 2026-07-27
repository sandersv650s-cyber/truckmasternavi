import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (loading) return;
    if (!user) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    setChecking(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setIsAdmin(Boolean(data));
        setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return { isAdmin, checking: checking || loading };
}

export const reportCategories = [
  { value: "spam", label: "Spam of reclame" },
  { value: "harassment", label: "Intimidatie of pesten" },
  { value: "hate", label: "Haatdragende taal" },
  { value: "fake", label: "Nepprofiel of oplichting" },
  { value: "unsafe", label: "Onveilig gedrag" },
  { value: "other", label: "Anders" },
] as const;

export const reportStatuses = ["open", "in_behandeling", "afgehandeld", "afgewezen"] as const;
export type ReportStatus = (typeof reportStatuses)[number];
