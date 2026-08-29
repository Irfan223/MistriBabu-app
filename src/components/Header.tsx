import {
  Menu,
  Phone,
  MessageCircle,
  UserPlus,
  X,
  LogIn,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { BRAND } from "@/constants/brand";

interface HeaderProps {
  onBookClick: () => void;
  onJoinClick: () => void;
  onTechLoginClick: () => void;
}

export default function Header({
  onBookClick,
  onJoinClick,
  onTechLoginClick,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const waLink = `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(
    `Hi ${BRAND.displayName}! I want to know more about your services.`,
  )}`;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-brand-900/40 shadow-lg">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-orange-400/30">
            <img
              src="/quick-mistri-logo.svg"
              alt="Quick Mistri"
              className="h-8 w-14"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white leading-tight tracking-tight">
              {BRAND.displayName}
            </h1>
            <p className="text-[10px] text-brand-300 leading-none truncate">
              {BRAND.region}
            </p>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 sm:flex">
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
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white ring-1 ring-brand-400/40 transition hover:bg-brand-500 active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">
              Join Quick Mistri
            </span>
          </button>
          {/* Subtle login — less prominent than customer CTAs */}
          <button
            onClick={onTechLoginClick}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/20 hover:text-white active:scale-95"
          >
            <LogIn className="h-4 w-4" />
            <span>Login</span>
          </button>
        </div>

        {/* Mobile: Join + hamburger only */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={onJoinClick}
            aria-label="Join Quick Mistri as a technician"
            className="flex h-10 items-center gap-1.5 rounded-lg bg-orange-600 px-2.5 text-xs font-bold text-white transition hover:bg-orange-500"
          >
            <UserPlus className="h-4 w-4" />
            <span>Join</span>
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-brand-900/40 bg-slate-950 px-4 py-3 sm:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onBookClick();
                setMenuOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg bg-orange-600 px-4 py-3 text-left text-sm font-bold text-white transition hover:bg-orange-500"
            >
              <Phone className="h-4 w-4" />
              Book a service
            </button>
            <a
              href={`tel:${BRAND.callingNumber}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10"
            >
              <Phone className="h-4 w-4 text-orange-400" />
              Call {BRAND.supportPhone}
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10"
            >
              <MessageCircle className="h-4 w-4 text-orange-400" />
              WhatsApp
            </a>

            {/* Internal logins — subtle, at the bottom */}
            <div className="mt-1 border-t border-white/10 pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onTechLoginClick();
                  setMenuOpen(false);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
              >
                <LogIn className="h-3.5 w-3.5" />
                Technician Login
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = "#/admin";
                  setMenuOpen(false);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-400 ring-1 ring-white/10 hover:bg-white/10"
              >
                <Lock className="h-3.5 w-3.5" />
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
