import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star } from "lucide-react";
import { rewards, leaderboard } from "@/lib/discover-data";
import { userById, currentUser } from "@/lib/mock-data";

export const Route = createFileRoute("/beloningen")({
  head: () => ({
    meta: [
      { title: "Beloningen — TruckMate" },
      { name: "description", content: "Verdien badges en punten voor nuttige bijdragen." },
      { property: "og:title", content: "Beloningen — TruckMate" },
      { property: "og:description", content: "Punten, badges en het leaderboard." },
    ],
  }),
  component: BeloningenPage,
});

function BeloningenPage() {
  const earned = rewards.filter((r) => r.earned);
  const totalPoints = earned.reduce((s, r) => s + r.points, 0);
  const board = leaderboard
    .map((e) => e.userId === currentUser.id ? { ...e, points: totalPoints } : e)
    .sort((a, b) => b.points - a.points);
  return (
    <AppShell title="Beloningen">
      <Card className="mb-4 overflow-hidden border-primary/40 bg-gradient-to-br from-primary/20 via-card to-card">
        <CardContent className="p-5 text-center">
          <Trophy className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Jouw punten</p>
          <p className="text-4xl font-black tabular-nums">{totalPoints}</p>
          <p className="mt-1 text-xs text-muted-foreground">{earned.length} van {rewards.length} badges verdiend</p>
          <p className="mt-3 text-[10px] text-muted-foreground">Punten hebben geen geldwaarde en zijn puur voor erkenning in de community.</p>
        </CardContent>
      </Card>
      <h2 className="mb-2 text-sm font-semibold">Badges</h2>
      <div className="mb-6 grid grid-cols-2 gap-2">
        {rewards.map((r) => (
          <Card key={r.id} className={r.earned ? "" : "opacity-60"}><CardContent className="p-3">
            <div className="flex items-start gap-2">
              <span className="text-2xl">{r.emoji}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.title}</p>
                <p className="line-clamp-2 text-[10px] text-muted-foreground">{r.desc}</p>
                <Badge variant={r.earned ? "default" : "secondary"} className="mt-1 text-[10px]">+{r.points} pt</Badge>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>
      <h2 className="mb-2 text-sm font-semibold">Leaderboard onder vrienden</h2>
      <div className="space-y-2">
        {board.map((e, i) => {
          const u = userById(e.userId);
          const me = e.userId === currentUser.id;
          return (
            <Card key={e.userId} className={me ? "border-primary/60" : ""}><CardContent className="flex items-center gap-3 p-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-background/60 text-sm font-bold">{i + 1}</div>
              <Avatar className="h-9 w-9"><AvatarImage src={u.avatar} alt="" /><AvatarFallback>{u.name[0]}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{u.name} {me && <span className="text-[10px] text-primary">(jij)</span>}</p>
                <p className="text-[11px] text-muted-foreground">{e.reports} meldingen</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums">{e.points}</p>
                <p className="text-[10px] text-muted-foreground"><Star className="mr-0.5 inline h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />punten</p>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </AppShell>
  );
}