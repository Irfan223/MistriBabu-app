import { Zap, ShieldCheck, BadgeCheck, Clock, MapPin } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";

interface HeroProps {
  onBookClick: () => void;
}

export default function Hero({ onBookClick }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-emerald-500 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
            <MapPin className="h-3.5 w-3.5" />
            Now serving {siteConfig.city}, Bihar
          </span>

          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            {siteConfig.tagline}
          </h2>
          <p className="mt-3 max-w-xl text-sm sm:text-base text-blue-200 leading-relaxed">
            {siteConfig.subTagline}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <Badge icon={<Zap className="h-4 w-4" />} text={`${siteConfig.inspectionFee} Inspection`} />
            <Badge icon={<BadgeCheck className="h-4 w-4" />} text="Aadhaar Verified" />
            <Badge icon={<ShieldCheck className="h-4 w-4" />} text={siteConfig.guaranteeDays} />
          </div>

          <button
            onClick={onBookClick}
            className="mt-8 flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95"
          >
            Book a Service Now
          </button>

          <div className="mt-5 flex items-center gap-2 text-xs text-blue-300">
            <Clock className="h-4 w-4" />
            <span>Average response time: under 60 minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm">
      {icon}
      {text}
    </span>
  );
}
