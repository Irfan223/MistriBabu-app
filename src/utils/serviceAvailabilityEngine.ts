import { supabase } from "@/lib/supabase";
import { getPincodeMeta } from "@/data/triDistrictZones";

export type ServiceAvailabilityStatus =
  | "OUT_OF_SERVICE_REGION"
  | "EXACT_PIN_MATCH"
  | "SAME_DISTRICT_MATCH"
  | "INTER_DISTRICT_FALLBACK"
  | "NO_TECHNICIAN_AVAILABLE";

export interface ServiceAvailability {
  status: ServiceAvailabilityStatus;
  district: "Muzaffarpur" | "Sitamarhi" | "Sheohar" | null;
  hubName: string | null;
  eta: string | null;
  message: string;
  canBook: boolean;
  technicianCount: number;
  exactTechnicianCount: number;
  nearestPincode: string | null;
  nearestTechnicianCount: number;
}

const OUTSIDE_REGION_MESSAGE =
  "We currently do not offer on-demand service outside Muzaffarpur, Sitamarhi, and Sheohar districts.";

type Trade = "Electrician" | "Plumber";

async function getAvailabilityCounts(pincode: string, trade?: Trade) {
  const { data, error } = await supabase.rpc("get_service_availability_counts", {
    target_pincode: pincode,
    target_trade: trade ?? null,
  });
  if (error) throw error;
  return (data?.[0] ?? { exact_count: 0, district_count: 0, neighboring_count: 0, nearest_pincode: null, nearest_count: 0 }) as {
    exact_count: number;
    district_count: number;
    neighboring_count: number;
    nearest_pincode: string | null;
    nearest_count: number;
  };
}

export async function checkServiceAvailability(targetPincode: string, trade?: Trade): Promise<ServiceAvailability> {
  const pincode = targetPincode.trim();
  const location = getPincodeMeta(pincode);
  if (!location) {
    return {
      status: "OUT_OF_SERVICE_REGION",
      district: null,
      hubName: null,
      eta: null,
      message: OUTSIDE_REGION_MESSAGE,
      canBook: false,
      technicianCount: 0,
      exactTechnicianCount: 0,
      nearestPincode: null,
      nearestTechnicianCount: 0,
    };
  }

  const counts = await getAvailabilityCounts(pincode, trade);
  if (counts.exact_count > 0) {
    return {
      status: "EXACT_PIN_MATCH",
      district: location.district,
      hubName: location.meta.hubName,
      eta: "45–60 mins",
      message: "Technician available in your immediate locality!",
      canBook: true,
      technicianCount: counts.exact_count,
      exactTechnicianCount: counts.exact_count,
      nearestPincode: null,
      nearestTechnicianCount: counts.exact_count,
    };
  }

  if (counts.district_count > 0) {
    return {
      status: "SAME_DISTRICT_MATCH",
      district: location.district,
      hubName: location.meta.hubName,
      eta: "2–3 hours (Extended Transit)",
      message: `No technician stationed directly at your PIN code, but mistris from within ${location.district} can arrive with extended travel time.`,
      canBook: true,
      technicianCount: counts.district_count,
      exactTechnicianCount: counts.exact_count,
      nearestPincode: counts.nearest_pincode,
      nearestTechnicianCount: counts.nearest_count,
    };
  }

  if (counts.neighboring_count > 0) {
    return {
      status: "INTER_DISTRICT_FALLBACK",
      district: location.district,
      hubName: location.meta.hubName,
      eta: "Same-Day / Next-Day Scheduled (No Immediate Dispatch)",
      message: "Technicians dispatching from neighboring district. Immediate 60-min resolution cannot be guaranteed.",
      canBook: true,
      technicianCount: counts.neighboring_count,
      exactTechnicianCount: counts.exact_count,
      nearestPincode: counts.nearest_pincode,
      nearestTechnicianCount: counts.nearest_count,
    };
  }

  return {
    status: "NO_TECHNICIAN_AVAILABLE",
    district: location.district,
    hubName: location.meta.hubName,
    eta: null,
    message: "No verified technician is currently available for this PIN code.",
    canBook: false,
    technicianCount: 0,
    exactTechnicianCount: counts.exact_count,
    nearestPincode: counts.nearest_pincode,
    nearestTechnicianCount: counts.nearest_count,
  };
}
