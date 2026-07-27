import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type AppRole = "admin" | "moderator" | "user";

export const appRoleLabels: Record<AppRole, string> = {
  admin: "Beheerder",
  moderator: "Moderator",
  user: "Gebruiker",
};

/**
 * Leest de rollen van de ingelogde gebruiker uit `user_roles`.
 * Dit stuurt alleen de UI aan — elke beheeractie wordt daarnaast
 * server-side (server function + RLS) opnieuw gecontroleerd.
 */
export function useMyRoles() {
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (loading) return;
    if (!user) {
      setRoles([]);
      setChecking(false);
      return;
    }
    setChecking(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (cancelled) return;
        setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
        setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const isAdmin = roles.includes("admin");
  const isModerator = roles.includes("moderator");
  return {
    roles,
    isAdmin,
    isModerator,
    isStaff: isAdmin || isModerator,
    checking: checking || loading,
  };
}

export function useIsAdmin() {
  const { isAdmin, checking } = useMyRoles();
  return { isAdmin, checking };
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

export const suggestionStatuses = ["new", "approved", "rejected"] as const;
export type SuggestionStatus = (typeof suggestionStatuses)[number];
export const suggestionStatusLabels: Record<SuggestionStatus, string> = {
  new: "Nieuw",
  approved: "Goedgekeurd",
  rejected: "Afgewezen",
};
