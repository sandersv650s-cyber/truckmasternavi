import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Star, MessageCircle, Trophy, ParkingSquare, BellOff, Check } from "lucide-react";
import { useNotifications, type NotificationIcon } from "@/lib/notifications";

export const Route = createFileRoute("/notificaties")({
  head: () => ({
    meta: [
      { title: "Notificaties — TruckMate" },
      { name: "description", content: "Al je meldingen op één plek." },
      { property: "og:title", content: "Notificaties — TruckMate" },
      { property: "og:description", content: "Meldingen over ritten, parkings, brandstof en community." },
    ],
  }),
  component: NotificatiesPage,
});

const iconMap: Record<NotificationIcon, React.ReactNode> = {
  alert: <AlertTriangle className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  chat: <MessageCircle className="h-4 w-4" />,
  trophy: <Trophy className="h-4 w-4" />,
  parking: <ParkingSquare className="h-4 w-4" />,
};

function NotificatiesPage() {
  const { notifications, isRead, markRead, markAll, unreadCount, hydrated } = useNotifications();

  return (
    <AppShell title="Notificaties">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Bell className="h-4 w-4 shrink-0 text-primary" />
          <p className="truncate text-sm text-muted-foreground">
            {hydrated ? `${unreadCount} ongelezen · ${notifications.length} totaal` : "Laden…"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={markAll} disabled={!hydrated || unreadCount === 0}>
          <Check className="mr-1 h-4 w-4" /> Alles gelezen
        </Button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const read = hydrated && isRead(n.id);
            return (
              <Link
                key={n.id}
                to={n.href}
                onClick={() => markRead(n.id)}
                className="block"
              >
                <Card className={`transition hover:border-primary/60 ${read ? "opacity-60" : "border-primary/40"}`}>
                  <CardContent className="flex gap-3 p-3">
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                      {iconMap[n.icon]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{n.title}</p>
                        {!read && <Badge className="h-4 shrink-0 px-1.5 text-[9px]">nieuw</Badge>}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{n.createdMinAgo} min geleden</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-center text-[10px] text-muted-foreground">
        Push-notificaties buiten de app komen in een volgende versie.
      </p>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <BellOff className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold">Geen meldingen</p>
        <p className="mt-1 text-xs text-muted-foreground">Nieuwe meldingen verschijnen hier automatisch.</p>
      </CardContent>
    </Card>
  );
}
