import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@/lib/mock-data";
import { MessageCircle, Truck, UserPlus } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ProfileView({ user, isMe = false }: { user: User; isMe?: boolean }) {
  return (
    <>
      <Card className="mb-4 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/20" />
        <CardContent className="-mt-10 p-4">
          <Avatar className="h-20 w-20 border-4 border-card">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{user.name}</h2>
              <p className="text-xs text-muted-foreground">{user.handle}</p>
            </div>
            {!isMe && (
              <div className="flex shrink-0 gap-2">
                <Link to="/chat">
                  <Button size="sm" variant="secondary">
                    <MessageCircle className="mr-1 h-4 w-4" /> Chat
                  </Button>
                </Link>
                <Button size="sm">
                  <UserPlus className="mr-1 h-4 w-4" /> Volgen
                </Button>
              </div>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed">{user.bio}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Truck className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{user.truck}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Volgers" value={user.followers.toLocaleString("nl-NL")} />
            <Stat label="Volgend" value={user.following.toLocaleString("nl-NL")} />
            <Stat label="Foto's" value={`${user.photos.length}`} />
          </div>
        </CardContent>
      </Card>

      <h3 className="mb-2 text-sm font-semibold">Badges</h3>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {user.badges.map((b) => (
          <Badge key={b} variant="secondary" className="text-[11px]">
            {b}
          </Badge>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-semibold">Foto's</h3>
      <div className="grid grid-cols-3 gap-1.5">
        {user.photos.map((p) => (
          <img
            key={p}
            src={p}
            alt=""
            className="aspect-square w-full rounded-md object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/60 p-2">
      <p className="text-base font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}