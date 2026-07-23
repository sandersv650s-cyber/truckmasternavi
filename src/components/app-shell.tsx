import { type ReactNode } from "react";
import { BottomNav } from "./bottom-nav";

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
      {title && (
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            {action}
          </div>
        </header>
      )}
      <main className="mx-auto max-w-2xl px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}