import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Navigation, ImageIcon, ArrowLeft, MapPin, Clock, Heart } from "lucide-react";
import { truckstopById, amenityLabels, occupancyMeta, flag, countryLabel, minAgoLabel, parkingPrediction, type Truckstop } from "@/lib/discover-data";
import { userById, currentUser, formatDate } from "@/lib/mock-data";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/truckstops/$id")({
  loader: ({ params }) => {
    const stop = truckstopById(params.id);
    if (!stop) throw notFound();
    return { stop };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.stop?.name ?? "Truckstop"} — TruckMate` },
      { name: "description", content: loaderData?.stop ? `${loaderData.stop.name} in ${loaderData.stop.city}: voorzieningen, bezetting en beoordelingen.` : "Truckstop details." },
      { property: "og:title", content: `${loaderData?.stop?.name ?? "Truckstop"} — TruckMate` },
    ],
  }),
  notFoundComponent: () => (
    <AppShell title="Niet gevonden">
      <p className="text-sm text-muted-foreground">Deze truckstop bestaat niet.</p>
      <Link to="/truckstops" className="mt-3 inline-block text-sm text-primary underline">Terug naar overzicht</Link>
    </AppShell>
  ),
  component: TruckstopDetail,
});

function TruckstopDetail() {
  const { stop } = Route.useLoaderData() as { stop: Truckstop };
  const [reviews, setReviews] = useState<Truckstop["reviews"]>(stop.reviews);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [attachPhoto, setAttachPhoto] = useState(false);
  const occ = occupancyMeta[stop.occupancy];
  const pred = parkingPrediction(stop);
  const { isFav, toggle } = useFavorites("truckstops");
  const fav = isFav(stop.id);

  const submit = () => {
    if (!text.trim()) return;
    setReviews((r: Truckstop["reviews"]) => [
      { id: `rv${Date.now()}`, userId: currentUser.id, rating, text: text.trim(), photo: attachPhoto ? `https://picsum.photos/seed/rv${Date.now()}/800/500` : undefined, createdAt: new Date().toISOString() },
      ...r,
    ]);
    setText(""); setAttachPhoto(false); setRating(5);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative">
        <img src={stop.photos[0]} alt="" className="h-52 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <Link to="/truckstops" className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur" aria-label="Terug">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <button
          onClick={() => toggle(stop.id)}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur"
          aria-label={fav ? "Verwijder uit favorieten" : "Toevoegen aan favorieten"}
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>
      <main className="mx-auto -mt-8 max-w-2xl px-4 pb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{flag(stop.country)} {countryLabel(stop.country)} · {stop.road}</p>
                <h1 className="text-lg font-bold">{stop.name}</h1>
                <p className="text-xs text-muted-foreground">{stop.city}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-md bg-background/60 px-2 py-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{stop.rating.toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground">({stop.reviewsCount})</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-white ${occ.color}`}>{occ.label}</span>
              <span className="text-muted-foreground"><span className="font-semibold text-foreground">{stop.freeSpots}</span> / {stop.totalSpots} vrij</span>
              <span className="ml-auto flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {minAgoLabel(stop.occupancyUpdatedMinAgo)}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/60">
              <div className={`h-full ${occ.color}`} style={{ width: `${occ.pct}%` }} />
            </div>
            <div className={`mt-3 rounded-lg border p-3 text-xs ${pred.color}`}>
              <p className="font-semibold">🔮 Slimme voorspelling: {pred.label}</p>
              <p className="mt-1 opacity-90">{pred.explanation}</p>
              <p className="mt-1 text-[10px] opacity-70">Gebaseerd op bezetting van {pred.asOf} + historische drukte (demo).</p>
            </div>
            <Button size="lg" className="mt-4 h-12 w-full font-bold"><Navigation className="mr-2 h-4 w-4" /> Navigeer hierheen</Button>
            <p className="mt-1 text-center text-[10px] text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />Openingstijden: {stop.openHours}</p>
          </CardContent>
        </Card>

        <h2 className="mb-2 mt-6 text-sm font-semibold">Voorzieningen</h2>
        <div className="flex flex-wrap gap-1.5">
          {stop.amenities.map((a) => (<Badge key={a} variant="secondary" className="text-[11px]">{amenityLabels[a]}</Badge>))}
        </div>

        {stop.photos.length > 1 && (<>
          <h2 className="mb-2 mt-6 text-sm font-semibold">Foto's</h2>
          <div className="grid grid-cols-3 gap-2">
            {stop.photos.map((p, i) => (<img key={i} src={p} alt="" className="aspect-square rounded-lg object-cover" loading="lazy" />))}
          </div>
        </>)}

        <h2 className="mb-2 mt-6 text-sm font-semibold">Recente meldingen</h2>
        <div className="space-y-2">
          {stop.reports.map((r) => (
            <Card key={r.id}><CardContent className="flex items-center justify-between gap-3 p-3">
              <p className="text-sm">{r.text}</p>
              <span className="text-[11px] text-muted-foreground">{minAgoLabel(r.minAgo)}</span>
            </CardContent></Card>
          ))}
        </div>

        <h2 className="mb-2 mt-6 text-sm font-semibold">Plaats een beoordeling</h2>
        <Card><CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} sterren`} className="p-1">
                <Star className={`h-6 w-6 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Vertel wat je ervan vond…" className="min-h-20" />
          <div className="flex items-center justify-between">
            <Button variant={attachPhoto ? "secondary" : "ghost"} size="sm" onClick={() => setAttachPhoto((v) => !v)}>
              <ImageIcon className="mr-1 h-4 w-4" />{attachPhoto ? "Foto toegevoegd" : "Foto toevoegen"}
            </Button>
            <Button size="sm" onClick={submit} disabled={!text.trim()}>Plaatsen</Button>
          </div>
        </CardContent></Card>

        <h2 className="mb-2 mt-6 text-sm font-semibold">Beoordelingen</h2>
        <div className="space-y-2">
          {reviews.map((r) => {
            const u = userById(r.userId);
            return (
              <Card key={r.id}><CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8"><AvatarImage src={u.avatar} alt="" /><AvatarFallback>{u.name[0]}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (<Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />))}
                  </div>
                </div>
                <p className="mt-2 text-sm">{r.text}</p>
                {r.photo && (<img src={r.photo} alt="" className="mt-2 aspect-video w-full rounded-md object-cover" loading="lazy" />)}
              </CardContent></Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}