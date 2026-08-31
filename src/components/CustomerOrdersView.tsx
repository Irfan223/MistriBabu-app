import { useState, useEffect, useCallback } from "react";
import {
  LogOut,
  RefreshCw,
  ClipboardList,
  Loader2,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  IndianRupee,
  UserCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useConfig } from "@/context/AppConfigContext";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";

interface CustomerOrdersViewProps {
  phone: string;
  onLogout: () => void;
}

interface Booking {
  id: number;
  booking_number: string;
  customer_name: string;
  locality: string;
  service_category: string;
  sub_service: string;
  preferred_slot: string;
  status: string;
  assigned_technician_id: string | null;
  visiting_charge: number;
  final_service_charge: number | null;
  visiting_charge_paid: boolean;
  service_charge_paid: boolean;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function buildWhatsAppReceipt(
  b: Booking,
  displayName: string,
  whatsappNumber: string,
): string {
  const remaining =
    b.final_service_charge != null
      ? Math.max(0, b.final_service_charge - b.visiting_charge)
      : null;
  const lines = [
    `Hi ${b.customer_name}! 🔧`,
    `Booking: ${b.booking_number}`,
    `Service: ${b.service_category} — ${b.sub_service}`,
    `✅ Work completed`,
    ``,
    `Visiting charge: ₹${b.visiting_charge}${b.visiting_charge_paid ? " ✓ Paid" : ""}`,
    b.final_service_charge != null
      ? `Service charge: ₹${b.final_service_charge}${b.service_charge_paid ? " ✓ Paid" : ""}`
      : null,
    remaining != null ? `Balance paid: ₹${remaining}` : null,
    ``,
    `Thank you for choosing ${displayName}! 🙏`,
  ]
    .filter((l) => l !== null)
    .join("\n");
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines)}`;
}

export default function CustomerOrdersView({
  phone,
  onLogout,
}: CustomerOrdersViewProps) {
  const { config } = useConfig();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const { toasts, showToast, dismiss } = useToast();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("bookings")
        .select(
          "id,booking_number,customer_name,locality,service_category,sub_service,preferred_slot,status,assigned_technician_id,visiting_charge,final_service_charge,visiting_charge_paid,service_charge_paid,created_at",
        )
        .order("created_at", { ascending: false });
      if (err) throw new Error(err.message);
      setBookings((data as Booking[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const cancelBooking = async (id: number) => {
    setCancellingId(id);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "CANCELLED" })
        .eq("id", id);
      if (error) throw new Error(error.message);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)),
      );
      const bn = bookings.find((b) => b.id === id)?.booking_number ?? `#${id}`;
      showToast("success", `Booking ${bn} cancelled`);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to cancel booking",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
        <button
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-slate-700 underline"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast toasts={toasts} onDismiss={dismiss} />

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-12 items-center justify-center rounded-lg bg-white ring-1 ring-orange-200">
              <img
                src="/quick-mistri-logo.svg"
                alt="Quick Mistri"
                className="h-6 w-10"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {config.brand_display_name}
              </p>
              <p className="text-[10px] text-slate-400">
                My Orders · +91 {phone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBookings}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 p-4">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700">
            Your Bookings ({bookings.length})
          </h3>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No bookings found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Book a service to get started
            </p>
          </div>
        ) : (
          bookings.map((b) => {
            const canCancel = b.status === "PENDING" || b.status === "ASSIGNED";
            const isCompleted = b.status === "COMPLETED";
            const amountDue =
              b.final_service_charge != null
                ? Math.max(0, b.final_service_charge - b.visiting_charge)
                : null;

            return (
              <div
                key={b.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">
                        {b.booking_number}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[b.status] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-orange-700">
                      {b.service_category} — {b.sub_service}
                    </p>
                  </div>
                  {isCompleted && (
                    <a
                      href={buildWhatsAppReceipt(
                        b,
                        config.brand_display_name,
                        config.whatsapp_number,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-green-500"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Receipt
                    </a>
                  )}
                </div>

                {/* Details */}
                <div className="mt-3 grid grid-cols-1 gap-1.5 border-t border-slate-100 pt-3 sm:grid-cols-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="line-clamp-1">{b.locality}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{b.preferred_slot}</span>
                  </div>
                </div>

                {/* Payment section */}
                <div className="mt-3 rounded-xl bg-slate-50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-600">
                      <IndianRupee className="h-3 w-3" />
                      Visiting charge
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        ₹{b.visiting_charge}
                      </span>
                      {b.visiting_charge_paid ? (
                        <span className="flex items-center gap-0.5 text-green-600 font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Paid
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                          <Clock className="h-3 w-3" /> On arrival
                        </span>
                      )}
                    </div>
                  </div>

                  {b.final_service_charge != null ? (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-slate-600">
                          <IndianRupee className="h-3 w-3" />
                          Service charge
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            ₹{b.final_service_charge}
                          </span>
                          {b.service_charge_paid ? (
                            <span className="flex items-center gap-0.5 text-green-600 font-semibold">
                              <CheckCircle2 className="h-3 w-3" /> Paid
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                        </div>
                      </div>
                      {amountDue != null && (
                        <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-1.5 mt-1">
                          <span className="font-semibold text-slate-700">
                            Balance due
                          </span>
                          <span className="font-bold text-orange-700">
                            ₹{amountDue}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      Final service charge will be shared by technician on
                      completion
                    </p>
                  )}
                </div>

                {/* Technician assigned */}
                {b.assigned_technician_id && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700">
                    <UserCircle className="h-3.5 w-3.5" />
                    Technician assigned
                  </div>
                )}

                {/* Cancel */}
                {canCancel && (
                  <button
                    onClick={() => cancelBooking(b.id)}
                    disabled={cancellingId === b.id}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {cancellingId === b.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Cancel Booking
                  </button>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
