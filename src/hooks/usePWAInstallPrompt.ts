import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function usePWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa-install-dismissed') === 'true');
  const [isStandalone, setIsStandalone] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const dismiss = () => {
    sessionStorage.setItem('pwa-install-dismissed', 'true');
    setDismissed(true);
  };

  return {
    canInstall: Boolean(installEvent),
    isIOS,
    isStandalone,
    visible: !isStandalone && !dismissed && (Boolean(installEvent) || isIOS),
    install,
    dismiss,
  };
}
