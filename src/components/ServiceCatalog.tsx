import { useState } from "react";
import { Zap, Droplets, AirVent, Paintbrush, ArrowRight } from "lucide-react";
import { SERVICE_CATALOG, BRAND } from "@/constants/brand";

interface ServiceCatalogProps {
  onBookService: (category: string, subService: string) => void;
}

export default function ServiceCatalog({ onBookService }: ServiceCatalogProps) {
  const [activeTab, setActiveTab] = useState<
    "Electrician" | "Plumber" | "AC Technician" | "Painter"
  >("Electrician");

  const services = SERVICE_CATALOG[activeTab];

  return (
    <section id="services" className="bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {BRAND.serviceCopy.heading}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {BRAND.serviceCopy.description}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-2xl bg-[#E7ECF3] p-1.5 overflow-x-auto no-scrollbar shadow-inner">
            <TabButton
              active={activeTab === "Electrician"}
              onClick={() => setActiveTab("Electrician")}
              icon={<Zap className="h-4 w-4" />}
              label="Electrician"
            />
            <TabButton
              active={activeTab === "Plumber"}
              onClick={() => setActiveTab("Plumber")}
              icon={<Droplets className="h-4 w-4" />}
              label="Plumber"
            />
            <TabButton
              active={activeTab === "AC Technician"}
              onClick={() => setActiveTab("AC Technician")}
              icon={<AirVent className="h-4 w-4" />}
              label="AC"
            />
            <TabButton
              active={activeTab === "Painter"}
              onClick={() => setActiveTab("Painter")}
              icon={<Paintbrush className="h-4 w-4" />}
              label="Painter"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="group flex flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition hover:ring-brand-400 hover:shadow-lg"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                {activeTab === "Electrician" ? (
                  <Zap className="h-5 w-5" />
                ) : activeTab === "Plumber" ? (
                  <Droplets className="h-5 w-5" />
                ) : activeTab === "AC Technician" ? (
                  <AirVent className="h-5 w-5" />
                ) : (
                  <Paintbrush className="h-5 w-5" />
                )}
              </div>
              <h4 className="text-base font-bold text-slate-900 leading-snug">
                {svc.name}
              </h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed flex-1">
                {svc.desc}
              </p>
              <p className="mt-3 text-sm font-bold text-orange-600">
                {svc.price}
              </p>
              <button
                onClick={() => onBookService(activeTab, svc.name)}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 active:scale-95"
              >
                Book Now
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 ${
        active
          ? "bg-white text-brand-600 shadow-sm"
          : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
      }`}
    >
      <span className={active ? "text-brand-600" : "text-slate-500"}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
