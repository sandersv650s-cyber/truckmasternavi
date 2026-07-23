import { type ReactNode } from "react";
import { Truck } from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { NotificationCenter } from "./notification-center";
import { Badge } from "./ui/badge";

export function AppShell({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          {title ? (
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
              <Badge variant="outline" className="shrink-0 border-amber-500/50 bg-amber-500/10 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                Demo
              </Badge>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary">
                <Truck className="h-4 w-4" />
              </div>
              <span className="truncate text-base font-bold tracking-tight">TruckMate</span>
              <Badge variant="outline" className="shrink-0 border-amber-500/50 bg-amber-500/10 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                Demo
              </Badge>
            </div>
          )}
          <div className="flex shrink-0 items-center gap-1">
            {action}
            <NotificationCenter />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}