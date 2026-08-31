import { useState, useEffect, useCallback } from "react";
import {
  LogOut,
  RefreshCw,
  Phone,
  MapPin,
  Briefcase,
  Zap,
  Droplets,
  AirVent,
  Paintbrush,
  Hammer,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  UserCircle,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useConfig } from "@/context/AppConfigContext";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";

interface TechnicianDashboardProps {
  onLogout: () => void;
}

interface Technician {
  id: string;
  name: string;
  phone: string;
  trades: string[];
  experience_years: number;
  service_pincode: string | null;
  service_locality: string | null;
  service_district: string;
  is_active: boolean;
  is_online: boolean;
  is_verified: boolean;
  created_at: string;
}

interface Booking {
  id: number;
  booking_number: string;
  customer_name: string;
  customer_phone: string;
  locality: string;
  service_category: string;
  sub_service: string;
  problem_description: string | null;
  preferred_slot: string;
  status: string;
  created_at: string;
}

const TRADE_ICON: Record<string, React.ReactNode> = {
  Electrician: <Zap className="h-3.5 w-3.5" />,
  Plumber: <Droplets className="h-3.5 w-3.5" />,
  "AC Technician": <AirVent className="h-3.5 w-3.5" />,
  Painter: <Paintbrush className="h-3.5 w-3.5" />,
  Carpenter: <Hammer className="h-3.5 w-3.5" />,
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

// Technician can only move a booking to COMPLETED or CANCELLED
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["COMPLETED", "CANCELLED"],
  ASSIGNED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

function maskPhone(phone: string): string {
  return phone.slice(0, 2) + "XXXXXX" + phone.slice(-2);
}

export default function TechnicianDashboard({
  onLogout,
}: TechnicianDashboardProps) {
  const { config } = useConfig();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [openStatusId, setOpenStatusId] = useState<number | null>(null);
  const { toasts, showToast, dismiss } = useToast();
  const [hindi, setHindi] = useState(true);

  const t = {
    portal: hindi ? "टेक्नीशियन पोर्टल" : "Technician Portal",
    logout: hindi ? "लॉगआउट" : "Logout",
    retry: hindi ? "दोबारा कोशिश करें" : "Retry",
    verified: hindi ? "सत्यापित" : "Verified",
    pending: hindi ? "सत्यापन बाकी" : "Pending Verification",
    exp: hindi ? "वर्ष अनुभव" : "yr exp.",
    bookings: (n: number) =>
      hindi ? `आपकी बुकिंग (${n})` : `Assigned Bookings (${n})`,
    noBookings: hindi ? "अभी कोई बुकिंग नहीं" : "No bookings assigned yet",
    noBookingsSub: hindi
      ? "नई बुकिंग यहाँ दिखेगी"
      : "New assignments will appear here",
    update: hindi ? "अपडेट" : "Update",
    markCompleted: hindi ? "पूरा हुआ बताएं" : "Mark COMPLETED",
    markCancelled: hindi ? "रद्द करें" : "Mark CANCELLED",
    labelName: hindi ? "ग्राहक" : "Customer",
    labelAddress: hindi ? "पता" : "Address",
    labelSlot: hindi ? "समय" : "Slot",
    labelIssue: hindi ? "समस्या" : "Issue",
    statusMap: {
      PENDING: hindi ? "प्रतीक्षारत" : "PENDING",
      ASSIGNED: hindi ? "असाइन्ड" : "ASSIGNED",
      COMPLETED: hindi ? "पूर्ण" : "COMPLETED",
      CANCELLED: hindi ? "रद्द" : "CANCELLED",
    } as Record<string, string>,
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      const { data: tech, error: techErr } = await supabase
        .from("technicians")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (techErr) throw new Error(techErr.message);
      if (!tech)
        throw new Error(
          "Technician profile not found. Contact admin if you registered recently.",
        );
      setTechnician(tech as Technician);

      const { data: bkgs, error: bkgErr } = await supabase
        .from("bookings")
        .select(
          "id,booking_number,customer_name,customer_phone,locality,service_category,sub_service,problem_description,preferred_slot,status,created_at",
        )
        .eq("assigned_technician_id", tech.id)
        .order("created_at", { ascending: false });
      if (bkgErr) throw bkgErr;
      setBookings((bkgs as Booking[]) ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : ((err as { message?: string })?.message ?? "Failed to load data"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateBookingStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    setOpenStatusId(null);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b)),
      );
      const bn = bookings.find((b) => b.id === id)?.booking_number ?? `#${id}`;
      showToast("success", `Booking ${bn} marked as ${status}`);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to update booking",
      );
    } finally {
      setUpdatingId(null);
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
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
        >
          <RefreshCw className="h-4 w-4" /> {t.retry}
        </button>
        <button
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-slate-700 underline"
        >
          {t.logout}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast toasts={toasts} onDismiss={dismiss} />

      {/* Top bar */}
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
              <p className="text-[10px] text-slate-400">{t.portal}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHindi((h) => !h)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
            >
              {hindi ? "English" : "हिंदी"}
            </button>
            <button
              onClick={fetchData}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        {/* Profile card */}
        {technician && (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <UserCircle className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900">
                    {technician.name}
                  </h2>
                  {technician.is_verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      <CheckCircle2 className="h-3 w-3" /> {t.verified}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
                      <Clock className="h-3 w-3" /> {t.pending}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> +91{" "}
                    {maskPhone(technician.phone)}
                  </span>
                  {technician.service_locality && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{" "}
                      {technician.service_locality},{" "}
                      {technician.service_district}
                    </span>
                  )}
                  {technician.experience_years != null && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />{" "}
                      {technician.experience_years} yr
                      {technician.experience_years !== 1 ? "s" : ""} exp.
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {technician.trades.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 ring-1 ring-orange-200"
                    >
                      {TRADE_ICON[t] ?? <Zap className="h-3 w-3" />} {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-700">
              {t.bookings(bookings.length)}
            </h3>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
              <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">
                {t.noBookings}
              </p>
              <p className="mt-1 text-xs text-slate-400">{t.noBookingsSub}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const transitions = ALLOWED_TRANSITIONS[b.status] ?? [];
                const isUpdating = updatingId === b.id;
                return (
                  <div
                    key={b.id}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {b.booking_number}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[b.status] ?? "bg-slate-100 text-slate-600"}`}
                          >
                            {t.statusMap[b.status] ?? b.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-orange-700">
                          {b.service_category} — {b.sub_service}
                        </p>
                        {b.problem_description && (
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                            {b.problem_description}
                          </p>
                        )}
                      </div>

                      {/* Status update dropdown */}
                      {transitions.length > 0 && (
                        <div className="relative shrink-0">
                          <button
                            onClick={() =>
                              setOpenStatusId(
                                openStatusId === b.id ? null : b.id,
                              )
                            }
                            disabled={isUpdating}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                            {t.update}
                          </button>
                          {openStatusId === b.id && (
                            <div className="absolute right-0 top-full z-10 mt-1 min-w-[130px] rounded-xl border border-slate-200 bg-white shadow-lg">
                              {transitions.map((status) => (
                                <button
                                  key={status}
                                  onClick={() =>
                                    updateBookingStatus(b.id, status)
                                  }
                                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl ${
                                    status === "COMPLETED"
                                      ? "text-green-700"
                                      : "text-red-600"
                                  }`}
                                >
                                  {status === "COMPLETED" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5" />
                                  )}
                                  {status === "COMPLETED"
                                    ? t.markCompleted
                                    : t.markCancelled}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-1.5 border-t border-slate-100 pt-3 sm:grid-cols-2">
                      <div className="flex items-start gap-1.5 text-xs">
                        <UserCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                        <span>
                          <span className="font-semibold text-slate-500">
                            {t.labelName}:{" "}
                          </span>
                          <span className="text-slate-800">
                            {b.customer_name}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                        <span>
                          <span className="font-semibold text-slate-500">
                            {t.labelAddress}:{" "}
                          </span>
                          <span className="text-slate-700 line-clamp-1">
                            {b.locality}
                          </span>
                        </span>
                      </div>
                      {b.problem_description && (
                        <div className="flex items-start gap-1.5 text-xs sm:col-span-2">
                          <span className="text-slate-400 mt-0.5">📝</span>
                          <span>
                            <span className="font-semibold text-slate-500">
                              {t.labelIssue}:{" "}
                            </span>
                            <span className="text-slate-700">
                              {b.problem_description}
                            </span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-1.5 text-xs sm:col-span-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                        <span>
                          <span className="font-semibold text-slate-500">
                            {t.labelSlot}:{" "}
                          </span>
                          <span className="text-slate-700">
                            {b.preferred_slot}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
