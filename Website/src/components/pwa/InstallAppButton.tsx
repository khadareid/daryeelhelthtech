import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || iosStandalone;
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    isIosDevice() ||
    /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.matchMedia("(max-width: 1024px)").matches)
  );
}

type Variant = "header" | "compact" | "banner" | "menu";

interface InstallAppButtonProps {
  variant?: Variant;
  className?: string;
}

export function InstallAppButton({
  variant = "header",
  className,
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneDisplay());

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setGuideOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    setGuideOpen(true);
  }, [deferredPrompt]);

  if (installed || dismissed) {
    if (installed && variant === "banner") {
      return (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700",
            className,
          )}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          App installed — open from your home screen
        </div>
      );
    }
    return null;
  }

  const canNativeInstall = Boolean(deferredPrompt);
  const showManualInstall = !canNativeInstall && isMobileDevice();
  if (!canNativeInstall && !showManualInstall) return null;

  if (variant === "banner") {
    return (
      <>
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-white shadow-md",
            className,
          )}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Install Daryeel Health</p>
            <p className="truncate text-xs text-white/80">
              Add to your home screen for quick access
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-primary shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Install App
            </button>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setDismissed(true)}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {guideOpen ? <InstallGuide onClose={() => setGuideOpen(false)} /> : null}
      </>
    );
  }

  if (variant === "menu") {
    return (
      <>
        <button
          type="button"
          onClick={handleInstall}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand-dark hover:bg-brand-light",
            className,
          )}
        >
          <Download className="h-4 w-4 text-primary" />
          Install App
        </button>
        {guideOpen ? <InstallGuide onClose={() => setGuideOpen(false)} /> : null}
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant={variant === "compact" ? "default" : "outline"}
        size={variant === "compact" ? "sm" : "default"}
        onClick={handleInstall}
        aria-label="Install application"
        className={cn(
          variant === "compact"
            ? "h-9 gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            : "gap-2 border-primary/20 text-primary hover:bg-primary/5",
          className,
        )}
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>
      {guideOpen ? <InstallGuide onClose={() => setGuideOpen(false)} /> : null}
    </>
  );
}

function InstallGuide({ onClose }: { onClose: () => void }) {
  const ios = isIosDevice();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-guide-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="install-guide-title"
              className="text-lg font-bold text-slate-900"
            >
              {ios ? "Install on iPhone / iPad" : "Install on Android"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {ios
                ? "Use Safari to add Daryeel Health to your Home Screen."
                : "Add Daryeel Health to your Home Screen for a native app experience."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {ios ? (
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                1
              </span>
              <span className="pt-1">
                Tap the <Share className="inline h-4 w-4 text-primary" />{" "}
                <strong>Share</strong> button in Safari
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                2
              </span>
              <span className="pt-1">
                Scroll and tap <strong>Add to Home Screen</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                3
              </span>
              <span className="pt-1">
                Tap <strong>Add</strong> — launch Daryeel like a native app
              </span>
            </li>
          </ol>
        ) : (
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                1
              </span>
              <span className="pt-1">
                Open the browser <strong>menu</strong> (⋮)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                2
              </span>
              <span className="pt-1">
                Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                3
              </span>
              <span className="pt-1">
                Confirm — then open Daryeel from your home screen
              </span>
            </li>
          </ol>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default InstallAppButton;
