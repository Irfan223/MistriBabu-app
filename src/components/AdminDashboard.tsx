import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Zap,
  Droplets,
  AirVent,
  Paintbrush,
  Hammer,
  Phone,
  MapPin,
  Clock,
  Loader2,
  UserCheck,
  ClipboardList,
  ChevronDown,
  UserCircle,
  Search,
  LogOut,
  ShieldCheck,
  Pencil,
  Calendar,
  CheckCircle2,
  X,
  CalendarClock,
  IndianRupee,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/constants/brand";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import AdminPincodeManager from "@/components/AdminPincodeManager";
const SUPPORTED_DISTRICTS = [
  "Muzaffarpur",
  "Sitamarhi",
  "Sheohar",
  "Motihari",
] as const;

interface AdminDashboardProps {
  email: string;
  onBack: () => void;
}

type BookingStatus = "ALL" | "PENDING" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
type DistrictFilter =
  | "All"
  | "Muzaffarpur"
  | "Sitamarhi"
  | "Sheohar"
  | "Motihari";

const STATUS_OPTIONS = [
  "PENDING",
  "ASSIGNED",
  "COMPLETED",
  "CANCELLED",
] as const;

const TIME_RANGES = [
  "09:00 AM - 12:00 PM (Morning)",
  "12:00 PM - 03:00 PM (Afternoon)",
  "03:00 PM - 06:00 PM (Evening)",
  "06:00 PM - 09:00 PM (Night)",
];

const getTodayDateString = () => new Date().toISOString().split("T")[0];

// Parses a preferred_slot string ("YYYY-MM-DD (Time Range)") back into parts,
// falling back to today's date/first time range for legacy free-text slots.
function parsePreferredSlot(slot: string): { date: string; time: string } {
  const match = slot.match(/^(\d{4}-\d{2}-\d{2})\s*\((.+)\)$/);
  if (match) return { date: match[1], time: match[2] };
  return { date: getTodayDateString(), time: TIME_RANGES[0] };
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
  assigned_technician_id: string | null;
  visiting_charge: number;
  final_service_charge: number | null;
  visiting_charge_paid: boolean;
  service_charge_paid: boolean;
  created_at: string;
}

interface Technician {
  id: string;
  name: string;
  phone: string;
  trades: string[];
  experience_years: number;
  aadhaar_number: string | null;
  is_verified: boolean;
  status: string;
  created_at: string;
  service_district: string;
  service_pincode: string | null;
  service_locality: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function AdminDashboard({ email, onBack }: AdminDashboardProps) {
  const [tab, setTab] = useState<"bookings" | "technicians" | "pincodes">(
    "bookings",
  );
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("ALL");
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState<DistrictFilter>("All");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);
  const { toasts, showToast, dismiss } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingsRes, techRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.rpc("get_admin_technicians"),
      ]);
      if (bookingsRes.error) throw bookingsRes.error;
      if (techRes.error) throw techRes.error;
      setBookings((bookingsRes.data as Booking[]) ?? []);
      setTechnicians((techRes.data as Technician[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeTechnicians = technicians.filter(
    (t) => t.status === "ACTIVE" && t.is_verified,
  );

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b)),
      );
      const bookingNumber =
        bookings.find((b) => b.id === id)?.booking_number ?? `MB-${id}`;
      showToast("success", `Booking ${bookingNumber} marked as ${status}`);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const updateSlot = async (id: number, preferredSlot: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ preferred_slot: preferredSlot })
        .eq("id", id);
      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, preferred_slot: preferredSlot } : b,
        ),
      );
      const bookingNumber =
        bookings.find((b) => b.id === id)?.booking_number ?? `MB-${id}`;
      showToast("success", `Booking ${bookingNumber} slot updated`);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to update slot",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const assignTechnician = async (
    bookingId: number,
    technicianId: string | null,
  ) => {
    setUpdatingId(bookingId);
    try {
      const updates: Record<string, unknown> = {
        assigned_technician_id: technicianId,
      };
      if (technicianId !== null) {
        updates.status = "ASSIGNED";
      }
      const { error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", bookingId);
      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? ({ ...b, ...updates } as Booking) : b,
        ),
      );
      const tech = technicians.find((t) => t.id === technicianId);
      const bookingNumber =
        bookings.find((b) => b.id === bookingId)?.booking_number ??
        `MB-${bookingId}`;
      showToast(
        "success",
        technicianId !== null
          ? `Assigned ${tech?.name ?? "technician"} to ${bookingNumber}`
          : `Unassigned technician from ${bookingNumber}`,
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to assign technician",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const updateTechnician = async (
    id: string,
    updates: Partial<Pick<Technician, "is_verified" | "status">>,
  ) => {
    setUpdatingId(id);
    try {
      const { data, error } = await supabase
        .from("technicians")
        .update(updates)
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error(
          "Technician update was not applied. Check admin permissions.",
        );
      setTechnicians((prev) =>
        prev.map((tech) => (tech.id === id ? { ...tech, ...updates } : tech)),
      );
      showToast("success", "Technician profile updated.");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to update technician",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const updateCharge = async (
    id: number,
    field: "visiting_charge" | "final_service_charge",
    value: number,
  ) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to update charge",
      );
    }
  };

  const togglePaid = async (
    id: number,
    field: "visiting_charge_paid" | "service_charge_paid",
    value: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to update payment status",
      );
    }
  };

  const verifyTechnician = (tech: Technician) =>
    updateTechnician(tech.id, {
      is_verified: !tech.is_verified,
      status: tech.is_verified ? "PENDING_VERIFICATION" : "ACTIVE",
    });

  const filteredBookings =
    statusFilter === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);
  const districtBookings = filteredBookings.filter(
    (booking) =>
      districtFilter === "All" || booking.locality.includes(districtFilter),
  );
  const visibleBookings = districtBookings.filter((booking) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      [
        booking.customer_name,
        booking.customer_phone,
        booking.locality,
        booking.booking_number,
      ].some((value) => value.toLowerCase().includes(query))
    );
  });

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const assignedCount = bookings.filter((b) => b.status === "ASSIGNED").length;
  const completedCount = bookings.filter(
    (b) => b.status === "COMPLETED",
  ).length;
  const cancelledCount = bookings.filter(
    (b) => b.status === "CANCELLED",
  ).length;
  const visibleTechnicians = technicians.filter(
    (tech) =>
      districtFilter === "All" ||
      getTechnicianDistrict(tech) === districtFilter,
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <Toast toasts={toasts} onDismiss={dismiss} />
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              aria-label="Back to Site"
              onClick={onBack}
              className="flex shrink-0 items-center gap-1.5 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />{" "}
              <span className="hidden text-xs font-semibold sm:inline">
                Back to Site
              </span>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold leading-tight text-slate-900 sm:text-lg">
                {BRAND.displayName} Lead &amp; Partner Management
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Secure operations console
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 md:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
              {email}
            </span>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />{" "}
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                onBack();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Leads" value={bookings.length} color="slate" />
          <StatCard label="Pending" value={pendingCount} color="amber" />
          <StatCard label="Assigned" value={assignedCount} color="blue" />
          <StatCard
            label="Completed / Cancelled"
            value={completedCount + cancelledCount}
            color="orange"
          />
        </div>

        <div className="flex gap-2 mb-5">
          <TabBtn
            active={tab === "bookings"}
            onClick={() => setTab("bookings")}
            icon={<ClipboardList className="h-4 w-4" />}
            label={`Bookings (${bookings.length})`}
          />
          <TabBtn
            active={tab === "technicians"}
            onClick={() => setTab("technicians")}
            icon={<UserCheck className="h-4 w-4" />}
            label={`Technicians (${technicians.length})`}
          />
          <TabBtn
            active={tab === "pincodes"}
            onClick={() => setTab("pincodes")}
            icon={<MapPin className="h-4 w-4" />}
            label="Add Pincodes"
          />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {(["All", ...SUPPORTED_DISTRICTS] as DistrictFilter[]).map(
            (district) => (
              <button
                key={district}
                onClick={() => setDistrictFilter(district)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${districtFilter === district ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
              >
                {district}
              </button>
            ),
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : tab === "pincodes" ? (
          <AdminPincodeManager />
        ) : tab === "bookings" ? (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(["ALL", ...STATUS_OPTIONS] as BookingStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      statusFilter === s
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="relative sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, phone, locality, order no."
                  className="form-input pl-9"
                />
              </div>
            </div>

            {visibleBookings.length === 0 ? (
              <EmptyState message="No bookings found for this filter." />
            ) : (
              <div className="space-y-3">
                {visibleBookings.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    technicians={activeTechnicians}
                    updating={updatingId === b.id}
                    onStatusChange={updateStatus}
                    onAssignTechnician={assignTechnician}
                    onSlotChange={updateSlot}
                    onChargeUpdate={updateCharge}
                    onPaidToggle={togglePaid}
                  />
                ))}
              </div>
            )}
          </>
        ) : visibleTechnicians.length === 0 ? (
          <EmptyState message="No technician registrations yet." />
        ) : (
          <div className="space-y-3">
            {visibleTechnicians.map((t) => (
              <TechCard
                key={t.id}
                tech={t}
                updating={updatingId === t.id}
                onUpdate={updateTechnician}
                onVerify={verifyTechnician}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    blue: "bg-brand-50 text-brand-700 ring-brand-200",
    orange: "bg-orange-50 text-orange-700 ring-orange-200",
    red: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <div className={`rounded-xl p-4 ring-1 ${colorMap[color]}`}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {label}
      </p>
    </div>
  );
}

function extractPincode(value: string): string {
  return value.match(/\b\d{6}\b/)?.[0] ?? "";
}

function buildAdminWhatsAppReceipt(b: Booking): string {
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
    `Thank you for choosing Quick Mistri! 🙏`,
  ]
    .filter(Boolean)
    .join("\n");
  return `https://wa.me/${b.customer_phone}?text=${encodeURIComponent(lines)}`;
}

// Builds readable per-year order numbers (MB2026001, MB2026002, ...) keyed by booking id.
function getTechnicianDistrict(technician: Technician): string | null {
  return technician.service_district ?? null;
}

function getDispatchGroup(
  booking: Booking,
  technician: Technician,
):
  | "Direct PIN Match (Local - Fastest)"
  | "District Match (Extended Travel)"
  | "Cross-District (Scheduled Only)" {
  const bookingPincode = extractPincode(booking.locality);
  if (bookingPincode && technician.service_pincode === bookingPincode)
    return "Direct PIN Match (Local - Fastest)";
  if (getTechnicianDistrict(technician) === booking.locality)
    return "District Match (Extended Travel)";
  return "Cross-District (Scheduled Only)";
}

function TabBtn({
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
      className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-slate-900 text-white"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function BookingCard({
  booking,
  technicians,
  updating,
  onStatusChange,
  onAssignTechnician,
  onSlotChange,
  onChargeUpdate,
  onPaidToggle,
}: {
  booking: Booking;
  technicians: Technician[];
  updating: boolean;
  onStatusChange: (id: number, status: string) => void;
  onAssignTechnician: (bookingId: number, technicianId: string | null) => void;
  onSlotChange: (id: number, preferredSlot: string) => void;
  onChargeUpdate: (
    id: number,
    field: "visiting_charge" | "final_service_charge",
    value: number,
  ) => void;
  onPaidToggle: (
    id: number,
    field: "visiting_charge_paid" | "service_charge_paid",
    value: boolean,
  ) => void;
}) {
  const [editingSlot, setEditingSlot] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const statusColor: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    ASSIGNED: "bg-brand-100 text-brand-700",
    COMPLETED: "bg-orange-100 text-orange-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  const assignedTech = technicians.find(
    (t) => t.id === booking.assigned_technician_id,
  );

  const startEditSlot = () => {
    const parsed = parsePreferredSlot(booking.preferred_slot);
    setEditDate(parsed.date);
    setEditTime(parsed.time);
    setEditingSlot(true);
  };

  const saveSlot = () => {
    if (!editDate || !editTime) return;
    onSlotChange(booking.id, `${editDate} (${editTime})`);
    setEditingSlot(false);
  };

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {booking.booking_number}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[booking.status] ?? "bg-slate-100 text-slate-600"}`}
            >
              {booking.status}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {booking.customer_name}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Phone: {booking.customer_phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Address: {booking.locality}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Slot: {booking.preferred_slot}
            </span>
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              Booked:{" "}
              {new Date(booking.created_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="flex items-center gap-1 font-semibold text-brand-600">
              {booking.service_category === "Electrician" ? (
                <Zap className="h-3.5 w-3.5" />
              ) : booking.service_category === "Plumber" ? (
                <Droplets className="h-3.5 w-3.5" />
              ) : booking.service_category === "AC Technician" ? (
                <AirVent className="h-3.5 w-3.5" />
              ) : (
                <Hammer className="h-3.5 w-3.5" />
              )}
              Service: {booking.service_category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Issue: {booking.sub_service}</span>
          </div>
          {booking.problem_description && (
            <p className="mt-1.5 text-xs text-slate-500 italic">
              Description: "{booking.problem_description}"
            </p>
          )}
          {assignedTech && (
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-600">
              <UserCircle className="h-3.5 w-3.5" />
              Assigned to: {assignedTech.name}
            </p>
          )}
        </div>
        <button
          onClick={startEditSlot}
          disabled={updating}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
        >
          <Pencil className="h-3 w-3" />
          Edit Slot
        </button>
      </div>

      {editingSlot && (
        <div className="mt-3 space-y-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-brand-600" />
              Select Date
            </label>
            <input
              type="date"
              min={getTodayDateString()}
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="form-input bg-white"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <Clock className="h-3.5 w-3.5 text-brand-600" />
              Select Time Range
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TIME_RANGES.map((slot) => {
                const isSelected = editTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setEditTime(slot)}
                    className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-semibold transition ${
                      isSelected
                        ? "border-2 border-brand-600 bg-brand-600 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                    }`}
                  >
                    <span>{slot}</span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditingSlot(false)}
              className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              onClick={saveSlot}
              disabled={updating || !editDate || !editTime}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Save Slot
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Status
          </label>
          <div className="relative">
            <select
              value={booking.status}
              onChange={(e) => onStatusChange(booking.id, e.target.value)}
              disabled={updating}
              className="w-full appearance-none rounded-lg border-0 bg-slate-50 py-2 pl-3 pr-9 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div className="relative flex-1">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Assign Expert
          </label>
          <div className="relative">
            <select
              value={booking.assigned_technician_id ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onAssignTechnician(booking.id, val === "" ? null : val);
              }}
              disabled={updating}
              className="w-full appearance-none rounded-lg border-0 bg-slate-50 py-2 pl-3 pr-9 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            >
              <option value="">— Unassigned —</option>
              {[
                "Direct PIN Match (Local - Fastest)",
                "District Match (Extended Travel)",
                "Cross-District (Scheduled Only)",
              ].map((group) => {
                const matches = technicians.filter(
                  (technician) =>
                    getDispatchGroup(booking, technician) === group,
                );
                if (matches.length === 0) return null;
                return (
                  <optgroup
                    key={group}
                    label={`${group} • ${matches.length} available`}
                  >
                    {matches.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.name} &bull;{" "}
                        {technician.service_district ?? "District pending"}{" "}
                        &bull;{" "}
                        {technician.service_locality ??
                          technician.service_pincode ??
                          "Area pending"}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Payment tracking section */}
      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
          <IndianRupee className="h-3 w-3" /> Payment
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 font-semibold">
              Visiting charge (₹)
            </label>
            <input
              type="number"
              min={0}
              value={booking.visiting_charge}
              onChange={(e) =>
                onChargeUpdate(
                  booking.id,
                  "visiting_charge",
                  Number(e.target.value),
                )
              }
              disabled={updating}
              className="form-input mt-0.5 py-1.5 text-xs"
            />
            <label className="mt-1 flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={booking.visiting_charge_paid}
                onChange={(e) =>
                  onPaidToggle(
                    booking.id,
                    "visiting_charge_paid",
                    e.target.checked,
                  )
                }
                disabled={updating}
                className="rounded"
              />
              <span
                className={
                  booking.visiting_charge_paid
                    ? "text-green-700 font-semibold"
                    : "text-slate-500"
                }
              >
                {booking.visiting_charge_paid ? "✓ Paid" : "Mark paid"}
              </span>
            </label>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-semibold">
              Service charge (₹)
            </label>
            <input
              type="number"
              min={0}
              value={booking.final_service_charge ?? ""}
              placeholder="Set on completion"
              onChange={(e) =>
                onChargeUpdate(
                  booking.id,
                  "final_service_charge",
                  Number(e.target.value),
                )
              }
              disabled={updating}
              className="form-input mt-0.5 py-1.5 text-xs"
            />
            <label className="mt-1 flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={booking.service_charge_paid}
                onChange={(e) =>
                  onPaidToggle(
                    booking.id,
                    "service_charge_paid",
                    e.target.checked,
                  )
                }
                disabled={updating || booking.final_service_charge == null}
                className="rounded"
              />
              <span
                className={
                  booking.service_charge_paid
                    ? "text-green-700 font-semibold"
                    : "text-slate-500"
                }
              >
                {booking.service_charge_paid ? "✓ Paid" : "Mark paid"}
              </span>
            </label>
          </div>
        </div>
        {booking.status === "COMPLETED" && (
          <a
            href={buildAdminWhatsAppReceipt(booking)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2 text-xs font-bold text-white hover:bg-green-500"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Send WhatsApp Receipt to Customer
          </a>
        )}
      </div>
    </div>
  );
}

function TechCard({
  tech,
  updating,
  onUpdate,
  onVerify,
}: {
  tech: Technician;
  updating: boolean;
  onUpdate: (
    id: string,
    updates: Partial<Pick<Technician, "is_verified" | "status">>,
  ) => void;
  onVerify: (tech: Technician) => void;
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900">{tech.name}</p>
            {tech.is_verified ? (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                <UserCheck className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                Unverified / Pending Action
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <a
              href={`tel:${tech.phone}`}
              className="flex items-center gap-1 text-brand-600 hover:text-brand-800"
            >
              <Phone className="h-3 w-3" />
              Call {tech.phone}
            </a>
            <span className="flex items-center gap-1 font-semibold text-brand-600">
              {(tech.trades ?? []).includes("Electrician") ? (
                <Zap className="h-3.5 w-3.5" />
              ) : (tech.trades ?? []).includes("Plumber") ? (
                <Droplets className="h-3.5 w-3.5" />
              ) : (tech.trades ?? []).includes("AC Technician") ? (
                <AirVent className="h-3.5 w-3.5" />
              ) : (
                <Paintbrush className="h-3.5 w-3.5" />
              )}
              {(tech.trades ?? []).join(", ") || "No trade set"}
            </span>
            <span>{tech.experience_years} yrs exp</span>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3" />
            {tech.service_locality ? `${tech.service_locality}, ` : ""}
            {tech.service_district}
            {tech.service_pincode ? ` (${tech.service_pincode})` : ""}
          </p>
          {tech.aadhaar_number && (
            <p className="mt-1 text-xs text-slate-400">
              Aadhaar: ••••••{tech.aadhaar_number.slice(-4)}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <button
          disabled={updating}
          onClick={() => onVerify(tech)}
          className={`rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${tech.is_verified ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-orange-600 text-white hover:bg-orange-700"}`}
        >
          {tech.is_verified ? "Revoke Verification" : "Verify Expert"}
        </button>
        <button
          disabled={updating}
          onClick={() =>
            onUpdate(tech.id, {
              status: tech.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            })
          }
          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
        >
          {tech.status === "ACTIVE" ? "Set Inactive" : "Set Active"}
        </button>
        <span
          className={`ml-auto self-center text-[10px] font-bold uppercase tracking-wide ${tech.status === "ACTIVE" ? "text-orange-600" : "text-slate-400"}`}
        >
          {tech.status}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ClipboardList className="h-12 w-12 text-slate-300" />
      <p className="mt-3 text-sm text-slate-500">{message}</p>
    </div>
  );
}
