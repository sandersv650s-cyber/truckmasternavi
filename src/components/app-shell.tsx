import { useEffect, type ReactNode } from "react";
import { Truck, LogIn } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { BottomNav } from "./bottom-nav";
import { QuickNav } from "./quick-nav";
import { NotificationCenter } from "./notification-center";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui/button";
import { DemoBanner } from "./demo-banner";

export function AppShell({
  title,
  action,
  children,
  requireAuth = true,
  demoBanner,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  requireAuth?: boolean;
  demoBanner?: string;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (requireAuth && !loading && !user) {
      navigate({ to: "/login" });
    }
  }, [requireAuth, loading, user, navigate]);

  if (requireAuth && loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-muted-foreground">Laden…</div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-lg bg-primary/20 text-primary">
            <Truck className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">Log in om verder te gaan.</p>
          <Button className="mt-3" onClick={() => navigate({ to: "/login" })}>
            <LogIn className="mr-1 h-4 w-4" /> Naar inloggen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          {title ? (
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary">
                <Truck className="h-4 w-4" />
              </div>
              <span className="truncate text-base font-bold tracking-tight">TruckMate</span>
            </div>
          )}
          <div className="flex shrink-0 items-center gap-1">
            {action}
            <NotificationCenter />
          </div>
        </div>
        {user ? <QuickNav /> : null}
      </header>
      <main className="mx-auto max-w-2xl px-4 py-4">
        {demoBanner ? <DemoBanner text={demoBanner} /> : null}
        {children}
      </main>
      {user ? <BottomNav /> : null}
    </div>
  );
}
