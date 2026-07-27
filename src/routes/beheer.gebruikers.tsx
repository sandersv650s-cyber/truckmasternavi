import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminGuard } from "@/components/admin-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";
import { adminDeleteUser, adminListUsers, adminSetSuspended } from "@/lib/admin.functions";
import { useIsAdmin } from "@/lib/admin";

export const Route = createFileRoute("/beheer/gebruikers")({
  head: () => ({
    meta: [
      { title: "Gebruikersbeheer — TruckMate" },
      { name: "description", content: "Zoek gebruikers, schors accounts of verwijder ze definitief." },
      { property: "og:title", content: "Gebruikersbeheer — TruckMate" },
      { property: "og:description", content: "Beheer van TruckMate-accounts." },
    ],
  }),
  component: AdminUsers,
});

type Row = Awaited<ReturnType<typeof adminListUsers>>[number];

function AdminUsers() {
  const { isAdmin, checking } = useIsAdmin();
  const list = useServerFn(adminListUsers);
  const setSuspended = useServerFn(adminSetSuspended);
  const removeUser = useServerFn(adminDeleteUser);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [search, setSearch] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async (term = "") => {
    try {
      setRows(await list({ data: { search: term } }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden mislukt.");
      setRows([]);
    }
  };

  useEffect(() => {
    if (!checking && isAdmin) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, isAdmin]);

  return (
    <AdminGuard title="Gebruikers">
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(search)}
            placeholder="Zoek op e-mail of naam…"
            className="pl-9"
          />
        </div>
        <Button variant="secondary" onClick={() => load(search)}>
          Zoek
        </Button>
      </div>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen gebruikers gevonden.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((u) => {
            const suspended = Boolean(u.suspended_at);
            return (
              <Card key={u.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{u.full_name ?? u.username ?? "Zonder naam"}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Laatste login:{" "}
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleString("nl-NL")
                          : "nooit"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} className="bg-primary/20 text-primary text-[10px]">
                          {r}
                        </Badge>
                      ))}
                      {suspended && <Badge className="bg-destructive/20 text-destructive text-[10px]">geschorst</Badge>}
                    </div>
                  </div>
                  {suspended && u.suspended_reason && (
                    <p className="mt-1 text-[11px] text-muted-foreground">Reden: {u.suspended_reason}</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant={suspended ? "secondary" : "outline"}
                      className="flex-1"
                      onClick={async () => {
                        try {
                          await setSuspended({
                            data: {
                              userId: u.id,
                              suspended: !suspended,
                              reason: suspended ? undefined : "Geschorst door beheerder",
                            },
                          });
                          toast.success(suspended ? "Account weer actief." : "Account geschorst.");
                          await load(search);
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Actie mislukt.");
                        }
                      }}
                    >
                      {suspended ? (
                        <>
                          <ShieldCheck className="mr-1 h-4 w-4" /> Heractiveren
                        </>
                      ) : (
                        <>
                          <ShieldOff className="mr-1 h-4 w-4" /> Schorsen
                        </>
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" onClick={() => setConfirmEmail("")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Account definitief verwijderen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Dit verwijdert het account en alle gekoppelde gegevens. Typ ter bevestiging het
                            e-mailadres <span className="font-mono">{u.email}</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Input
                          value={confirmEmail}
                          onChange={(e) => setConfirmEmail(e.target.value)}
                          placeholder="E-mailadres ter bevestiging"
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              try {
                                await removeUser({ data: { userId: u.id, confirmEmail } });
                                toast.success("Account verwijderd.");
                                await load(search);
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "Verwijderen mislukt.");
                              }
                            }}
                          >
                            Verwijderen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminGuard>
  );
}
