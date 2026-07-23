import { type ReactNode } from "react";
import { Truck } from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { NotificationCenter } from "./notification-center";

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
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          ) : (
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 text-primary">
                <Truck className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight">TruckMate</span>
            </div>
          )}
          <div className="flex items-center gap-1">
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