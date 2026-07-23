import { Link } from "@tanstack/react-router";
import {
  Bell,
  BellRing,
  AlertTriangle,
  Star,
  MessageCircle,
  Trophy,
  ParkingSquare,
  CheckCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useNotifications, type NotificationIcon } from "@/lib/notifications";
import { minAgoLabel } from "@/lib/discover-data";

const iconMap = {
  alert: AlertTriangle,
  star: Star,
  chat: MessageCircle,
  trophy: Trophy,
  parking: ParkingSquare,
} as const;

const iconTone: Record<NotificationIcon, string> = {
  alert: "text-orange-300 bg-orange-500/20",
  star: "text-yellow-300 bg-yellow-500/20",
  chat: "text-primary bg-primary/20",
  trophy: "text-emerald-300 bg-emerald-500/20",
  parking: "text-sky-300 bg-sky-500/20",
};

export function NotificationCenter() {
  const { notifications, unreadCount, isRead, markRead, markAll } = useNotifications();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificaties" className="relative">
          {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between space-y-0 pr-6">
          <SheetTitle>Notificaties</SheetTitle>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" onClick={markAll}>
              <CheckCheck className="mr-1 h-4 w-4" /> Alles gelezen
            </Button>
          )}
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {notifications.map((n) => {
            const Icon = iconMap[n.icon];
            const read = isRead(n.id);
            return (
              <Link
                key={n.id}
                to={n.href}
                onClick={() => markRead(n.id)}
                className={`block rounded-lg border p-3 transition ${
                  read
                    ? "border-border/50 opacity-70"
                    : "border-primary/40 bg-primary/5"
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${iconTone[n.icon]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {minAgoLabel(n.createdMinAgo)}
                    </p>
                  </div>
                  {!read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}