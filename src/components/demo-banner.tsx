import { Info } from "lucide-react";

export function DemoBanner({ text }: { text: string }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
      <p>{text}</p>
    </div>
  );
}
