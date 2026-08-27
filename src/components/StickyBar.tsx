import { Phone, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";

export default function StickyBar() {
  const waLink = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    "Hi MistriBabu! I want to book a service."
  )}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
      <div className="flex border-t border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
        <a
          href={`tel:${siteConfig.callingNumber}`}
          className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-bold text-white active:bg-blue-700"
        >
          <Phone className="h-5 w-5" />
          Call +91 89105 41678
        </a>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 bg-emerald-600 py-3.5 text-sm font-bold text-white active:bg-emerald-700"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp Book
        </a>
      </div>
    </div>
  );
}
