import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, ImageIcon, MoreVertical, Send, Ban, Flag } from "lucide-react";
import { chatById, userById, currentUser, type ChatMessage } from "@/lib/mock-data";

export const Route = createFileRoute("/chat/$chatId")({
  head: () => ({
    meta: [
      { title: "Gesprek — TruckMate" },
      { name: "description", content: "Chat met een andere chauffeur." },
      { property: "og:title", content: "Gesprek — TruckMate" },
      { property: "og:description", content: "Één-op-één chat." },
    ],
  }),
  loader: ({ params }) => {
    const c = chatById(params.chatId);
    if (!c) throw notFound();
    return c;
  },
  notFoundComponent: () => (
    <AppShell title="Niet gevonden">
      <p className="text-sm text-muted-foreground">Dit gesprek bestaat niet.</p>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell title="Fout">
      <p className="text-sm text-destructive">{error.message}</p>
    </AppShell>
  ),
  component: ChatView,
});

function ChatView() {
  const chat = Route.useLoaderData();
  const other = userById(chat.userId);
  const [messages, setMessages] = useState<ChatMessage[]>(chat.messages);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { id: `m${Date.now()}`, from: currentUser.id, text: text.trim(), at: new Date().toISOString() },
    ]);
    setText("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: `m${Date.now() + 1}`,
          from: other.id,
          text: "Duidelijk, dank!",
          at: new Date().toISOString(),
        },
      ]);
    }, 1200);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-2">
          <Link to="/chat">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-9 w-9">
            <AvatarImage src={other.avatar} alt={other.name} />
            <AvatarFallback>{other.name[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{other.name}</p>
            <p className="text-[11px] text-emerald-400">Online</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Ban className="mr-2 h-4 w-4" /> Blokkeren
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Flag className="mr-2 h-4 w-4" /> Rapporteren
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-2 px-3 py-4">
        {messages.map((m) => {
          const mine = m.from === currentUser.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm border border-border bg-card text-card-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    mine ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {new Date(m.at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl items-center gap-2 p-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Bericht…"
            className="flex-1"
          />
          <Button size="icon" onClick={send} disabled={!text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}