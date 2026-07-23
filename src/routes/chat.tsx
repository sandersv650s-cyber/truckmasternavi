import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { chats, userById, formatDate } from "@/lib/mock-data";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Berichten — TruckMate" },
      { name: "description", content: "Chat één-op-één met andere chauffeurs." },
      { property: "og:title", content: "Berichten — TruckMate" },
      { property: "og:description", content: "Realtime chat voor chauffeurs." },
    ],
  }),
  component: ChatList,
});

function ChatList() {
  return (
    <AppShell title="Berichten">
      {chats.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Nog geen gesprekken.</p>
      ) : (
        <div className="space-y-2">
          {chats.map((c) => {
            const u = userById(c.userId);
            const last = c.messages[c.messages.length - 1];
            return (
              <Link key={c.id} to="/chat/$chatId" params={{ chatId: c.id }}>
                <Card className="transition hover:border-primary/60">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback>{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{u.name}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatDate(last.at)}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{last.text}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}