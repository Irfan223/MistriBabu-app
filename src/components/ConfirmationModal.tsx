import { CheckCircle2, X, Phone, MessageCircle } from "lucide-react";
import { BRAND } from "@/constants/brand";

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
  if (!open) return null;

  const waLink = `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(
    `Hi ${BRAND.displayName}! I just booked a service. My Booking ID is ${bookingId}.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
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

        <div className="mt-4 rounded-xl bg-blue-50 p-4 text-center ring-1 ring-blue-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Your Booking ID
          </p>
          <p className="mt-1 text-2xl font-extrabold text-blue-700">
            {bookingId}
          </p>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {BRAND.inspectionFee} visit charge applies. Final amount after inspection.
        </p>

        <div className="mt-5 flex gap-3">
          <a
            href={`tel:${BRAND.callingNumber}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Phone className="h-4 w-4" />
            Call Us
          </a>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
