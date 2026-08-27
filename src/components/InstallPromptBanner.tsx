import { Download, Share, X } from 'lucide-react';
import { usePWAInstallPrompt } from '@/hooks/usePWAInstallPrompt';

export default function InstallPromptBanner() {
  const { canInstall, isIOS, visible, install, dismiss } = usePWAInstallPrompt();

  if (!visible) return null;

  return (
    <aside className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-xl bg-slate-950 p-4 text-white shadow-2xl ring-1 ring-orange-400/40 sm:bottom-6 sm:left-auto sm:right-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="absolute right-2 top-2 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-600">
          <Download className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold">Install Quick Mistri</p>
          {isIOS ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Tap <Share className="mx-0.5 inline h-3.5 w-3.5 align-text-bottom" /> Share, then choose Add to Home Screen.
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-300">Keep Quick Mistri ready on your phone.</p>
          )}
        </div>
      </div>
      {canInstall && (
        <button
          type="button"
          onClick={install}
          className="mt-3 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
        >
          Install app
        </button>
      )}
    </aside>
  );
}
