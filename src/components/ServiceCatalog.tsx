import { useState } from "react";
import { Zap, Droplets, AirVent, Paintbrush, ArrowRight } from "lucide-react";
import { SERVICE_CATALOG, BRAND } from "@/constants/brand";

interface ServiceCatalogProps {
  onBookService: (category: string, subService: string) => void;
}

export default function ServiceCatalog({ onBookService }: ServiceCatalogProps) {
  const [activeTab, setActiveTab] = useState<"Electrician" | "Plumber" | "AC" | "Painter">("Electrician");

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
          <div className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-xl bg-slate-200 p-1 sm:flex sm:max-w-none">
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
              active={activeTab === "AC"}
              onClick={() => setActiveTab("AC")}
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
              className="group flex flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition hover:ring-blue-400 hover:shadow-lg"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                {activeTab === "Electrician" ? (
                  <Zap className="h-5 w-5" />
                ) : activeTab === "Plumber" ? (
                  <Droplets className="h-5 w-5" />
                ) : activeTab === "AC" ? (
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
                className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-95"
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
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition sm:px-5 ${
        active
          ? "bg-white text-blue-700 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
