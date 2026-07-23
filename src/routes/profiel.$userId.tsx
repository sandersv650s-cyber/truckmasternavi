import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ProfileView } from "@/components/profile-view";
import { users } from "@/lib/mock-data";

export const Route = createFileRoute("/profiel/$userId")({
  head: () => ({
    meta: [
      { title: `Profiel — TruckMate` },
      { name: "description", content: `Bekijk het profiel van deze chauffeur.` },
      { property: "og:title", content: `Profiel — TruckMate` },
      { property: "og:description", content: "Chauffeursprofiel in TruckMate." },
    ],
  }),
  loader: ({ params }) => {
    const user = users.find((u) => u.id === params.userId);
    if (!user) throw notFound();
    return user;
  },
  notFoundComponent: () => (
    <AppShell title="Niet gevonden">
      <p className="text-sm text-muted-foreground">Deze chauffeur bestaat niet.</p>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell title="Fout">
      <p className="text-sm text-destructive">{error.message}</p>
    </AppShell>
  ),
  component: UserProfile,
});

function UserProfile() {
  const user = Route.useLoaderData();
  return (
    <AppShell title={user.name}>
      <ProfileView user={user} />
    </AppShell>
  );
}