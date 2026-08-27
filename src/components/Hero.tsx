import { Zap, ShieldCheck, BadgeCheck, Clock } from "lucide-react";
import { BRAND } from "@/constants/brand";

interface HeroProps {
  onBookClick: () => void;
}

export default function Hero({ onBookClick }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-orange-500 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-blue-600 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
            <span aria-hidden="true">📍</span>
            {BRAND.hero.regionLabel}
          </span>

          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            {BRAND.hero.title}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-300 md:text-base">
            {BRAND.hero.subtitle}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge icon={<Zap className="h-4 w-4" />} text={BRAND.trust.inspection} />
            <Badge icon={<BadgeCheck className="h-4 w-4" />} text={BRAND.trust.experts} />
            <Badge icon={<ShieldCheck className="h-4 w-4" />} text={BRAND.trust.warranty} />
          </div>

          <button
            onClick={onBookClick}
            className="mt-6 flex items-center gap-2 rounded-xl bg-orange-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-500 active:scale-95"
          >
            {BRAND.serviceCopy.bookingButton}
          </button>

          <div className="mt-5 flex items-center gap-2 text-xs text-blue-300">
            <Clock className="h-4 w-4" />
            <span>{BRAND.hero.responseTime}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm">
      {icon}
      {text}
    </span>
  );
}
