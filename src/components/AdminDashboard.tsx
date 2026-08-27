import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RefreshCw, Zap, Droplets, AirVent, Paintbrush, Phone, MapPin, Clock, Loader2, UserCheck, ClipboardList, ChevronDown, UserCircle, Search, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/constants/brand";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import { getPincodeMeta, TRI_DISTRICT_DATA } from "@/data/triDistrictZones";

interface AdminDashboardProps {
  email: string;
  onBack: () => void;
}

type BookingStatus = "ALL" | "PENDING" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
type DistrictFilter = "All" | "Muzaffarpur" | "Sitamarhi" | "Sheohar";

const STATUS_OPTIONS = ["PENDING", "ASSIGNED", "COMPLETED", "CANCELLED"] as const;

interface Booking {
  id: number;
  customer_name: string;
  customer_phone: string;
  locality: string;
  service_category: string;
  sub_service: string;
  problem_description: string | null;
  preferred_slot: string;
  status: string;
  assigned_technician_id: number | null;
  created_at: string;
}

interface Technician {
  id: number;
  full_name: string;
  phone: string;
  trade: string;
  experience_years: number;
  operating_areas: string;
  aadhaar_number: string | null;
  is_verified: boolean;
  status: string;
  created_at: string;
}

export default function AdminDashboard({ email, onBack }: AdminDashboardProps) {
  const [tab, setTab] = useState<"bookings" | "technicians">("bookings");
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("ALL");
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState<DistrictFilter>("All");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { toasts, showToast, dismiss } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingsRes, techRes] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("technicians").select("*").order("created_at", { ascending: false }),
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

  const activeTechnicians = technicians.filter((t) => t.status === "ACTIVE" && t.is_verified);

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
      showToast("success", `Booking MB-${id} marked as ${status}`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const assignTechnician = async (bookingId: number, technicianId: number | null) => {
    setUpdatingId(bookingId);
    try {
      const updates: Record<string, unknown> = { assigned_technician_id: technicianId };
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
          b.id === bookingId
            ? { ...b, ...updates } as Booking
            : b
        )
      );
      const tech = technicians.find((t) => t.id === technicianId);
      showToast(
        "success",
        technicianId !== null
          ? `Assigned ${tech?.full_name ?? "technician"} to MB-${bookingId}`
          : `Unassigned technician from MB-${bookingId}`
      );
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to assign technician");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateTechnician = async (id: number, updates: Partial<Pick<Technician, "is_verified" | "status">>) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase.from("technicians").update(updates).eq("id", id);
      if (error) throw error;
      setTechnicians((prev) => prev.map((tech) => tech.id === id ? { ...tech, ...updates } : tech));
      showToast("success", "Technician profile updated.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to update technician");
    } finally {
      setUpdatingId(null);
    }
  };

  const verifyTechnician = (tech: Technician) => updateTechnician(tech.id, {
    is_verified: !tech.is_verified,
    status: tech.is_verified ? "PENDING_VERIFICATION" : "ACTIVE",
  });

  const filteredBookings =
    statusFilter === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);
  const districtBookings = filteredBookings.filter((booking) => districtFilter === "All" || getPincodeMeta(extractPincode(booking.locality))?.district === districtFilter);
  const visibleBookings = districtBookings.filter((booking) => {
    const query = search.trim().toLowerCase();
    return !query || [booking.customer_name, booking.customer_phone, booking.locality].some((value) => value.toLowerCase().includes(query));
  });

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const assignedCount = bookings.filter((b) => b.status === "ASSIGNED").length;
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;
  const visibleTechnicians = technicians.filter((tech) => districtFilter === "All" || getTechnicianDistrict(tech) === districtFilter);

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
              <ArrowLeft className="h-5 w-5" /> <span className="hidden text-xs font-semibold sm:inline">Back to Site</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold leading-tight text-slate-900 sm:text-lg">{BRAND.displayName} Lead &amp; Partner Management</h1>
              <p className="hidden text-xs text-slate-500 sm:block">Secure operations console</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 md:flex"><ShieldCheck className="h-3.5 w-3.5 text-orange-600" />{email}</span>
            <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); onBack(); }} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Leads" value={bookings.length} color="slate" />
          <StatCard label="Pending" value={pendingCount} color="amber" />
          <StatCard label="Assigned" value={assignedCount} color="blue" />
          <StatCard label="Completed / Cancelled" value={completedCount + cancelledCount} color="orange" />
        </div>

        <div className="flex gap-2 mb-5">
          <TabBtn active={tab === "bookings"} onClick={() => setTab("bookings")} icon={<ClipboardList className="h-4 w-4" />} label={`Bookings (${bookings.length})`} />
          <TabBtn active={tab === "technicians"} onClick={() => setTab("technicians")} icon={<UserCheck className="h-4 w-4" />} label={`Technicians (${technicians.length})`} />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {(["All", ...Object.keys(TRI_DISTRICT_DATA)] as DistrictFilter[]).map((district) => (
            <button key={district} onClick={() => setDistrictFilter(district)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${districtFilter === district ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
              {district}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
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
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, locality" className="form-input pl-9" />
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
              <TechCard key={t.id} tech={t} updating={updatingId === t.id} onUpdate={updateTechnician} onVerify={verifyTechnician} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    orange: "bg-orange-50 text-orange-700 ring-orange-200",
    red: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <div className={`rounded-xl p-4 ring-1 ${colorMap[color]}`}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}

function extractPincode(value: string): string {
  return value.match(/\b\d{6}\b/)?.[0] ?? "";
}

function getTechnicianDistrict(technician: Technician): string | null {
  return technician.operating_areas.match(/District:\s*([^;]+)/i)?.[1]?.trim() ?? null;
}

function getDispatchGroup(booking: Booking, technician: Technician): "Direct PIN Match (Local - Fastest)" | "District Match (Extended Travel)" | "Cross-District (Scheduled Only)" {
  const bookingPincode = extractPincode(booking.locality);
  if (bookingPincode && technician.operating_areas.includes(bookingPincode)) return "Direct PIN Match (Local - Fastest)";
  const bookingDistrict = getPincodeMeta(bookingPincode)?.district;
  if (bookingDistrict && getTechnicianDistrict(technician) === bookingDistrict) return "District Match (Extended Travel)";
  return "Cross-District (Scheduled Only)";
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
        active ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
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
}: {
  booking: Booking;
  technicians: Technician[];
  updating: boolean;
  onStatusChange: (id: number, status: string) => void;
  onAssignTechnician: (bookingId: number, technicianId: number | null) => void;
}) {
  const statusColor: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    ASSIGNED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-orange-100 text-orange-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  const assignedTech = technicians.find((t) => t.id === booking.assigned_technician_id);

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">MB-{booking.id}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[booking.status] ?? "bg-slate-100 text-slate-600"}`}>
              {booking.status}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-800">{booking.customer_name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{booking.customer_phone}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{booking.locality}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.preferred_slot}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="flex items-center gap-1 font-semibold text-blue-600">
              {booking.service_category === "Electrician" ? <Zap className="h-3.5 w-3.5" /> : booking.service_category === "Plumber" ? <Droplets className="h-3.5 w-3.5" /> : booking.service_category === "AC" ? <AirVent className="h-3.5 w-3.5" /> : <Paintbrush className="h-3.5 w-3.5" />}
              {booking.service_category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">{booking.sub_service}</span>
          </div>
          {booking.problem_description && (
            <p className="mt-1.5 text-xs text-slate-500 italic">"{booking.problem_description}"</p>
          )}
          {assignedTech && (
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600">
              <UserCircle className="h-3.5 w-3.5" />
              Assigned to: {assignedTech.full_name}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</label>
          <div className="relative">
            <select
              value={booking.status}
              onChange={(e) => onStatusChange(booking.id, e.target.value)}
              disabled={updating}
              className="w-full appearance-none rounded-lg border-0 bg-slate-50 py-2 pl-3 pr-9 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div className="relative flex-1">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Assign Expert</label>
          <div className="relative">
            <select
              value={booking.assigned_technician_id ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onAssignTechnician(booking.id, val === "" ? null : Number(val));
              }}
              disabled={updating}
              className="w-full appearance-none rounded-lg border-0 bg-slate-50 py-2 pl-3 pr-9 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">— Unassigned —</option>
              {["Direct PIN Match (Local - Fastest)", "District Match (Extended Travel)", "Cross-District (Scheduled Only)"].map((group) => {
                const matches = technicians.filter((technician) => getDispatchGroup(booking, technician) === group);
                if (matches.length === 0) return null;
                return <optgroup key={group} label={`${group} • ${matches.length} available`}>
                  {matches.map((technician) => <option key={technician.id} value={technician.id}>{technician.full_name} • {getTechnicianDistrict(technician) ?? "District pending"} • {technician.operating_areas}</option>)}
                </optgroup>;
              })}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TechCard({ tech, updating, onUpdate, onVerify }: { tech: Technician; updating: boolean; onUpdate: (id: number, updates: Partial<Pick<Technician, "is_verified" | "status">>) => void; onVerify: (tech: Technician) => void }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900">{tech.full_name}</p>
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
            <a href={`tel:${tech.phone}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800"><Phone className="h-3 w-3" />Call {tech.phone}</a>
            <span className="flex items-center gap-1 font-semibold text-blue-600">
              {tech.trade === "Electrician" ? <Zap className="h-3.5 w-3.5" /> : <Droplets className="h-3.5 w-3.5" />}
              {tech.trade}
            </span>
            <span>{tech.experience_years} yrs exp</span>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3" />{tech.operating_areas}
          </p>
          {tech.aadhaar_number && (
            <p className="mt-1 text-xs text-slate-400">Aadhaar: ••••••{tech.aadhaar_number.slice(-4)}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <button disabled={updating} onClick={() => onVerify(tech)} className={`rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${tech.is_verified ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-orange-600 text-white hover:bg-orange-700"}`}>
          {tech.is_verified ? "Revoke Verification" : "Verify Expert"}
        </button>
        <button disabled={updating} onClick={() => onUpdate(tech.id, { status: tech.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50">
          {tech.status === "ACTIVE" ? "Set Inactive" : "Set Active"}
        </button>
        <span className={`ml-auto self-center text-[10px] font-bold uppercase tracking-wide ${tech.status === "ACTIVE" ? "text-orange-600" : "text-slate-400"}`}>{tech.status}</span>
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
