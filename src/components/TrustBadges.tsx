import { ShieldCheck, BadgeCheck, Clock, IndianRupee, Wrench, Star } from "lucide-react";
import { BRAND } from "@/constants/brand";

export default function TrustBadges() {
  const badges = [
    {
      icon: <IndianRupee className="h-6 w-6" />,
      title: BRAND.trust.inspection,
      desc: "Low visit charge, adjusted in final bill",
    },
    {
      icon: <BadgeCheck className="h-6 w-6" />,
      title: BRAND.trust.experts,
      desc: "Every expert is background-checked",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: BRAND.trust.warranty,
      desc: "Free rework if the issue comes back",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "60-Minute Response",
      desc: "At your doorstep within an hour",
    },
    {
      icon: <Wrench className="h-6 w-6" />,
      title: "Skilled Professionals",
      desc: "Experienced local electricians and plumbers",
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Trusted Locally",
      desc: "Built for North Bihar homes",
    },
  ];

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Why {BRAND.displayName}?
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Verified experts, transparent pricing, and workmanship you can count on.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b) => (
            <div
              key={b.title}
              className="flex flex-col items-center rounded-2xl bg-slate-50 p-5 text-center ring-1 ring-slate-200 transition hover:ring-brand-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
                {b.icon}
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-900">{b.title}</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
