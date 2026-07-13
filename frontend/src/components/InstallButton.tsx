import { useEffect, useState } from "react";

// The beforeinstallprompt event isn't in the default TS DOM lib.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Shows an "Install app" button when the browser signals the PWA is installable.
 * Hidden once installed or if the browser never fires the event (e.g. iOS Safari,
 * where users install via the Share sheet instead).
 */
export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault(); // stop the default mini-infobar; we show our own button
      setPromptEvent(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!promptEvent) return null;

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  return (
    <button className="install-btn" onClick={install}>
      ⬇️ Install app
    </button>
  );
}
