import { Link, useRouterState } from "@tanstack/react-router";
import { Radio, MessageSquare, Fuel, Building2 } from "lucide-react";

const items = [
  { to: "/konvooi" as const, label: "Konvooi", icon: Radio },
  { to: "/chat" as const, label: "Chat", icon: MessageSquare },
  { to: "/brandstof" as const, label: "Brandstof", icon: Fuel },
  { to: "/terminals" as const, label: "Locaties", icon: Building2 },
];

/** Snelkoppelingen naar de sociale en onderweg-modules. */
export function QuickNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Snelnavigatie" className="border-t border-border/60">
      <ul className="mx-auto flex max-w-2xl gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
        {items.map((it) => {
          const active = pathname === it.to || pathname.startsWith(`${it.to}/`);
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
