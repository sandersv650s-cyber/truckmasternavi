import { AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LZV_MAX_LENGTH_CM, LZV_MAX_WEIGHT_KG, type Issue } from "@/lib/lzv";

/** Uitlegkaart met de harde LZV-grenzen en de verplichte DWO-controle. */
export function LzvInfoCard() {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-1.5 p-3 text-xs">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Info className="h-4 w-4" /> Wat is een LZV?
        </p>
        <p className="text-muted-foreground">
          Een Lange Zware Voertuigcombinatie mag maximaal{" "}
          <strong>{(LZV_MAX_LENGTH_CM / 100).toFixed(2).replace(".", ",")} m</strong> lang zijn en
          maximaal <strong>{LZV_MAX_WEIGHT_KG.toLocaleString("nl-NL")} kg</strong> wegen.
        </p>
        <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
          <li>Rijden met een LZV mag alleen met een geldige RDW-ontheffing.</li>
          <li>
            Alleen de groene wegen van de Digitale Wegenkaart Ontheffingen (DWO) en goedgekeurde
            aansluitroutes mogen worden gebruikt.
          </li>
          <li>
            TruckMate controleert dit niet automatisch: routes zijn nooit juridisch LZV-goedgekeurd.
            Controleer route én aansluitroute altijd zelf op de actuele RDW/DWO-kaart.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

/** Lijst met validatiefouten en -waarschuwingen. */
export function IssueList({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;
  return (
    <ul className="space-y-1 text-xs">
      {issues.map((i, idx) => (
        <li
          key={idx}
          className={`flex items-start gap-1.5 rounded-md border p-2 ${
            i.level === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
          }`}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{i.message}</span>
        </li>
      ))}
    </ul>
  );
}
