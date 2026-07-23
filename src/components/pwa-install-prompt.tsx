import { useEffect, useState } from "react";
import { X, Share, Plus, Download } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const DISMISS_KEY = "truckmate.pwa.install.dismissed.v1";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

function detectPlatform(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;
    const p = detectPlatform();
    setPlatform(p);
    if (p === "other") return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS never fires beforeinstallprompt — show the tip after a brief delay.
    let t: ReturnType<typeof setTimeout> | undefined;
    if (p === "ios") {
      t = setTimeout(() => setVisible(true), 1500);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      if (t) clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-[90] px-3 sm:bottom-6">
      <Card className="mx-auto max-w-md border-primary/40 bg-card/95 shadow-xl backdrop-blur">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">TruckMate installeren</p>
              {platform === "ios" ? (
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Tik op <Share className="mx-0.5 inline h-3 w-3" /> <span className="font-medium">Delen</span> onderin Safari en kies
                  <span className="mx-1 font-medium">"Zet op beginscherm"</span>
                  <Plus className="ml-0.5 inline h-3 w-3" />.
                </p>
              ) : (
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Zet TruckMate op je beginscherm voor volledig scherm en snellere toegang.
                </p>
              )}
              {platform === "android" && deferred && (
                <Button size="sm" className="mt-2 h-8" onClick={install}>
                  <Download className="mr-1 h-3.5 w-3.5" /> Installeren
                </Button>
              )}
            </div>
            <button
              onClick={dismiss}
              aria-label="Sluiten"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}