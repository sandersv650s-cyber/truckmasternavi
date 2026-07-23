import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Map, Compass, Users, User } from "lucide-react";

type NavItem = {
  to: "/" | "/kaart" | "/ontdekken" | "/community" | "/profiel";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  matches?: string[];
};

const items: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/kaart", label: "Kaart", icon: Map, matches: ["/kaart", "/navigatie"] },
  {
    to: "/ontdekken",
    label: "Ontdekken",
    icon: Compass,
    matches: ["/ontdekken", "/truckstops", "/brandstof", "/meldingen", "/voorzieningen", "/beloningen", "/zoeken"],
  },
  { to: "/community", label: "Community", icon: Users },
  { to: "/profiel", label: "Profiel", icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Hoofdnavigatie"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {items.map((it) => {
          const active = it.exact
            ? pathname === it.to
            : it.matches
              ? it.matches.some((m) => pathname === m || pathname.startsWith(`${m}/`))
              : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}