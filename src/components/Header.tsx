import { Wrench, Phone, MessageCircle, UserPlus } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";

interface HeaderProps {
  onBookClick: () => void;
  onJoinClick: () => void;
}

export default function Header({ onJoinClick }: HeaderProps) {
  const waLink = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    "Hi MistriBabu! I want to know more about your services."
  )}`;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-blue-800/40 shadow-lg">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md ring-1 ring-blue-400/30">
            <Wrench className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white leading-tight tracking-tight">
              {siteConfig.brandName}
            </h1>
            <p className="text-[10px] text-blue-300 leading-none truncate">
              {siteConfig.city} • 60 min service
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${siteConfig.callingNumber}`}
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-95"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">WhatsApp</span>
          </a>
          <button
            onClick={onJoinClick}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/20 active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">Mistri Banein</span>
          </button>
        </div>
      </div>
    </header>
  );
}
