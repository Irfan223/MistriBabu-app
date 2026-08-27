import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function usePWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa-install-dismissed') === 'true');
  const [isStandalone, setIsStandalone] = useState(() => getStandaloneState());
  const [isInstalled, setIsInstalled] = useState(() => localStorage.getItem('pwa-installed') === 'true');
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);

  useEffect(() => {
    const updateStandaloneState = () => setIsStandalone(getStandaloneState());

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      localStorage.setItem('pwa-installed', 'true');
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('pageshow', updateStandaloneState);
    document.addEventListener('visibilitychange', updateStandaloneState);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('pageshow', updateStandaloneState);
      document.removeEventListener('visibilitychange', updateStandaloneState);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true');
      setIsInstalled(true);
    }
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
    visible: !isStandalone && !isInstalled && !dismissed && (Boolean(installEvent) || isIOS),
    install,
    dismiss,
  };
}

function getStandaloneState() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
