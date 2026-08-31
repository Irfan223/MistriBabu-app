import { CheckCircle2, X, Phone, MessageCircle } from "lucide-react";
import { useConfig } from "@/context/AppConfigContext";

interface ConfirmationModalProps {
  open: boolean;
  bookingId: string | null;
  onClose: () => void;
}

export default function ConfirmationModal({
  open,
  bookingId,
  onClose,
}: ConfirmationModalProps) {
  const { config } = useConfig();
  if (!open) return null;

  const waLink = `https://wa.me/${config.whatsapp_number}?text=${encodeURIComponent(
    `Hi ${config.brand_display_name}! I just booked a service. My Booking ID is ${bookingId}.`,
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <CheckCircle2 className="h-7 w-7 text-orange-600" />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="mt-4 text-xl font-extrabold text-slate-900">
          Booking Confirmed!
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          We've received your request. Our team will call you shortly.
        </p>

        <div className="mt-4 rounded-xl bg-brand-50 p-4 text-center ring-1 ring-brand-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
            Your Booking ID
          </p>
          <p className="mt-1 text-2xl font-extrabold text-brand-700">
            {bookingId}
          </p>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          ₹{config.inspection_fee} visit charge applies. Final amount after
          inspection.
        </p>

        <div className="mt-5 flex gap-3">
          <a
            href={`tel:${config.calling_number}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-500"
          >
            <Phone className="h-4 w-4" />
            Call Us
          </a>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
