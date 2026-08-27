import { ShieldCheck, BadgeCheck, Clock, IndianRupee, Wrench, Star } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";

export default function TrustBadges() {
  const badges = [
    {
      icon: <IndianRupee className="h-6 w-6" />,
      title: `${siteConfig.inspectionFee} Inspection`,
      desc: "Low visit charge, adjusted in final bill",
    },
    {
      icon: <BadgeCheck className="h-6 w-6" />,
      title: "Verified Technicians",
      desc: "Every technician is background-checked",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: siteConfig.guaranteeDays,
      desc: "Free rework if the issue comes back",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "60-Minute Response",
      desc: "At your doorstep within an hour",
    },
    {
      icon: <Wrench className="h-6 w-6" />,
      title: "Skilled Mistris",
      desc: "Experienced local plumbers & electricians",
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
            Why {siteConfig.brandName}?
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            We're not just a service — we're your neighbour's recommendation.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b) => (
            <div
              key={b.title}
              className="flex flex-col items-center rounded-2xl bg-slate-50 p-5 text-center ring-1 ring-slate-200 transition hover:ring-blue-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
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
