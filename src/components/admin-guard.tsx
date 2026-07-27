import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "./app-shell";
import { Button } from "./ui/button";
import { useMyRoles } from "@/lib/admin";

export function AdminGuard({
  title,
  children,
  require: requirement = "admin",
}: {
  title: string;
  children: ReactNode;
  /** "staff" = beheerder óf moderator, "admin" = alleen beheerder */
  require?: "admin" | "staff";
}) {
  const { isAdmin, isStaff, checking } = useMyRoles();
  const allowed = requirement === "admin" ? isAdmin : isStaff;

  if (checking) {
    return (
      <AppShell title={title}>
        <p className="py-10 text-center text-sm text-muted-foreground">Rechten controleren…</p>
      </AppShell>
    );
  }
  if (!allowed) {
    return (
      <AppShell title={title}>
        <div className="py-10 text-center">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <p className="text-sm font-semibold">Geen toegang</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Deze pagina is alleen voor{" "}
            {requirement === "admin" ? "beheerders" : "moderators en beheerders"}. Alle
            beheeracties worden bovendien server-side gecontroleerd.
          </p>
          <Button asChild className="mt-4" variant="secondary">
            <Link to="/">Terug naar dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }
  return <AppShell title={title}>{children}</AppShell>;
}
