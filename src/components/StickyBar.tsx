import { Phone, MessageCircle } from "lucide-react";
import { BRAND } from "@/constants/brand";

export default function StickyBar() {
  const waLink = `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(
    `Hi ${BRAND.displayName}! I want to book a service.`
  )}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
      <div className="flex border-t border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
        <a
          href={`tel:${BRAND.callingNumber}`}
          className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-bold text-white active:bg-brand-700"
        >
          <Phone className="h-5 w-5" />
          Call {BRAND.supportPhone}
        </a>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 bg-orange-600 py-3.5 text-sm font-bold text-white active:bg-orange-700"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp Book
        </a>
      </div>
    </div>
  );
}
