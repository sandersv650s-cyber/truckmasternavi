import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users, ChevronRight } from "lucide-react";
import { groups, groupKindMeta, type GroupKind } from "@/lib/more-data";

export const Route = createFileRoute("/groepen")({
  head: () => ({
    meta: [
      { title: "Groepen — TruckMate" },
      { name: "description", content: "Vind en doe mee aan groepen: bedrijf, regio, route en interesses." },
      { property: "og:title", content: "Groepen — TruckMate" },
      { property: "og:description", content: "Community-groepen voor chauffeurs." },
    ],
  }),
  component: GroepenPage,
});

const kinds: (GroupKind | "alle")[] = ["alle", "bedrijf", "regio", "route", "interesse"];

function GroepenPage() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<GroupKind | "alle">("alle");
  const [onlyJoined, setOnlyJoined] = useState(false);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return groups.filter((g) => {
      if (kind !== "alle" && g.kind !== kind) return false;
      if (onlyJoined && !g.joined) return false;
      if (term && !`${g.name} ${g.description}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [q, kind, onlyJoined]);

  return (
    <AppShell demoBanner={"Groepen tonen voorbeelddata — echte groepen vereisen aparte tabellen en moderatie."} title="Groepen">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek in groepen…" className="pl-9" />
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {kinds.map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${
              kind === k ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {k === "alle" ? "Alle" : `${groupKindMeta[k].emoji} ${groupKindMeta[k].label}`}
          </button>
        ))}
        <button
          onClick={() => setOnlyJoined((v) => !v)}
          className={`ml-auto rounded-full border px-2.5 py-1 text-[11px] font-medium ${
            onlyJoined ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          Alleen mijn groepen
        </button>
      </div>
      <div className="space-y-2">
        {list.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Geen groepen gevonden.
          </div>
        )}
        {list.map((g) => (
          <Link key={g.id} to="/groepen/$id" params={{ id: g.id }} className="block">
            <Card className="overflow-hidden transition hover:border-primary/60">
              <div className="relative h-20 w-full">
                <img src={g.cover} alt="" className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                <Badge className={`absolute left-2 top-2 border text-[10px] ${groupKindMeta[g.kind].color}`}>
                  {groupKindMeta[g.kind].emoji} {groupKindMeta[g.kind].label}
                </Badge>
                {g.joined && (
                  <Badge className="absolute right-2 top-2 bg-emerald-500/25 text-emerald-200 text-[10px]">Lid</Badge>
                )}
              </div>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{g.name}</p>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">{g.description}</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="h-3 w-3" /> {g.members} leden
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}