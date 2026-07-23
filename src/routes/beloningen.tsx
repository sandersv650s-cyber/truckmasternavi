import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star, Flame, Target, EyeOff, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { rewards, leaderboard } from "@/lib/discover-data";
import { userById, currentUser } from "@/lib/mock-data";
import { levels, levelFor, weeklyChallenges, useLeaderboardVisible, getXP, getStreakDays } from "@/lib/rewards-plus";
import { useEffect, useState } from "react";

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
  const { visible, set: setVisible } = useLeaderboardVisible();
  const [xp, setXp] = useState(2380);
  const [streak, setStreak] = useState(12);
  useEffect(() => {
    setXp(getXP());
    setStreak(getStreakDays());
  }, []);
  const { current, next, progressPct } = levelFor(xp);
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

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Level {current.level}</p>
              <p className="text-lg font-bold">{current.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black tabular-nums">{xp}<span className="text-xs font-normal text-muted-foreground"> XP</span></p>
              {next && <p className="text-[10px] text-muted-foreground">{next.minXp - xp} XP tot {next.label}</p>}
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-orange-500/40 bg-orange-500/10 p-2 text-xs">
            <span className="flex items-center gap-1 text-orange-300"><Flame className="h-4 w-4" /> {streak}-daagse streak</span>
            <span className="text-[10px] text-muted-foreground">Log een rit voor 24:00 om te behouden</span>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-2 flex items-center gap-1 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> Weekuitdagingen</h2>
      <div className="mb-6 space-y-2">
        {weeklyChallenges.map((c) => {
          const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
          const done = c.progress >= c.target;
          return (
            <Card key={c.id} className={done ? "border-emerald-500/50 bg-emerald-500/5" : ""}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.title}</p>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">{c.desc}</p>
                  </div>
                  <Badge variant={done ? "default" : "secondary"} className="text-[10px]">+{c.xp} XP</Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{c.progress}/{c.target}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-2 text-sm font-semibold">Levels</h2>
      <Card className="mb-6"><CardContent className="p-0">
        <ul className="divide-y divide-border">
          {levels.map((l) => (
            <li key={l.level} className={`flex items-center gap-3 p-3 ${xp >= l.minXp ? "" : "opacity-50"}`}>
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/20 text-sm font-bold text-primary">{l.level}</div>
              <p className="flex-1 text-sm font-medium">{l.label}</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">{l.minXp} XP</p>
            </li>
          ))}
        </ul>
      </CardContent></Card>

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

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Leaderboard onder vrienden</h2>
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          Ik ben zichtbaar
          <Switch checked={visible} onCheckedChange={setVisible} />
        </label>
      </div>
      {!visible && (
        <p className="mb-2 rounded-lg border border-border bg-card p-3 text-[11px] text-muted-foreground">
          Je bent nu <b>verborgen</b> op het leaderboard. Anderen zien jouw naam en punten niet.
        </p>
      )}
      <div className="space-y-2">
        {board.map((e, i) => {
          const u = userById(e.userId);
          const me = e.userId === currentUser.id;
          if (me && !visible) {
            return (
              <Card key={e.userId} className="border-dashed">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold">?</div>
                  <p className="flex-1 text-sm italic text-muted-foreground">Jij (verborgen)</p>
                  <p className="text-sm font-bold tabular-nums text-muted-foreground">{e.points}</p>
                </CardContent>
              </Card>
            );
          }
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