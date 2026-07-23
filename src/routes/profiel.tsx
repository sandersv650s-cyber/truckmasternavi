import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/profile-view";
import { currentUser } from "@/lib/mock-data";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/profiel")({
  head: () => ({
    meta: [
      { title: "Mijn profiel — TruckMate" },
      { name: "description", content: "Bekijk en beheer je chauffeursprofiel." },
      { property: "og:title", content: "Mijn profiel — TruckMate" },
      { property: "og:description", content: "Profielfoto, bio, trucktype, badges en meer." },
    ],
  }),
  component: () => (
    <AppShell title="Profiel">
      <ProfileView user={currentUser} isMe />
    </AppShell>
  ),
});