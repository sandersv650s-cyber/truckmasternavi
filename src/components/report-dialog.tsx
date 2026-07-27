import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createReport } from "@/lib/blocks";
import { reportCategories } from "@/lib/admin";
import { useAuth } from "@/lib/auth";

export function ReportDialog({
  reportedUserId,
  contextType,
  contextId,
  trigger,
}: {
  reportedUserId?: string | null;
  contextType?: "message" | "profile" | "convoy" | "post";
  contextId?: string;
  trigger: ReactNode;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!category) {
      toast.error("Kies eerst een categorie.");
      return;
    }
    setBusy(true);
    try {
      await createReport({
        reporter_id: user.id,
        reported_user_id: reportedUserId ?? null,
        category,
        details: details.trim().slice(0, 2000) || null,
        context_type: contextType ?? null,
        context_id: contextId ?? null,
      });
      toast.success("Bedankt — je melding is ontvangen en wordt door een beheerder bekeken.");
      setOpen(false);
      setCategory("");
      setDetails("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Melden mislukt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ongewenst gedrag melden</DialogTitle>
          <DialogDescription>
            Je melding is alleen zichtbaar voor beheerders. Misbruik van meldingen kan gevolgen hebben.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block text-xs">Categorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kies een categorie" />
              </SelectTrigger>
              <SelectContent>
                {reportCategories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Toelichting (optioneel)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
              placeholder="Wat is er gebeurd?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Versturen…" : "Melding versturen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
