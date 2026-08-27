import { Phone, MessageCircle, UserPlus } from "lucide-react";
import { BRAND } from "@/constants/brand";

interface HeaderProps {
  onBookClick: () => void;
  onJoinClick: () => void;
}

export default function Header({ onJoinClick }: HeaderProps) {
  const waLink = `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(
    `Hi ${BRAND.displayName}! I want to know more about your services.`
  )}`;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-blue-900/40 shadow-lg">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-orange-400/30">
            <img src="/quick-mistri-logo.svg" alt="Quick Mistri" className="h-8 w-14" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white leading-tight tracking-tight">
              {BRAND.displayName}
            </h1>
            <p className="text-[10px] text-blue-300 leading-none truncate">
              {BRAND.region}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${BRAND.callingNumber}`}
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 active:scale-95"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">WhatsApp</span>
          </a>
          <button
            onClick={onJoinClick}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/20 active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">Join Quick Mistri</span>
          </button>
        </div>
      </div>
    </header>
  );
}
