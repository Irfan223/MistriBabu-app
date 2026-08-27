import { supabase } from "@/lib/supabase";

export type ServiceAvailabilityStatus =
  | "OUT_OF_SERVICE_REGION"
  | "EXACT_PIN_MATCH"
  | "SAME_DISTRICT_MATCH"
  | "INTER_DISTRICT_FALLBACK"
  | "NO_TECHNICIAN_AVAILABLE";

export type Trade = "Electrician" | "Plumber" | "AC" | "Painter";
export type SupportedDistrict = "Muzaffarpur" | "Sitamarhi" | "Sheohar" | "Motihari";

export interface ServiceAvailability {
  status: ServiceAvailabilityStatus;
  district: SupportedDistrict | null;
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
  "We currently do not offer on-demand service outside Muzaffarpur, Sitamarhi, Sheohar, and Motihari districts.";

export async function checkServiceAvailability(targetPincode: string, trade?: Trade): Promise<ServiceAvailability> {
  const pincode = targetPincode.trim();
  if (!/^\d{6}$/.test(pincode)) return unavailable();

  const { data: serviceable, error: serviceableError } = await supabase
    .from("serviceable_pincodes")
    .select("pincode")
    .eq("pincode", pincode)
    .eq("enabled", true)
    .maybeSingle();
  if (serviceableError) throw serviceableError;
  if (!serviceable) return unavailable();

  const { data: postal, error: postalError } = await supabase
    .from("postal_pincodes")
    .select("pincode, district")
    .eq("pincode", pincode)
    .maybeSingle();
  if (postalError) throw postalError;
  if (!postal) return unavailable();

  const district = postal.district as SupportedDistrict;
  const { data: offices, error: officesError } = await supabase
    .from("post_offices")
    .select("name, block")
    .eq("pincode", pincode)
    .order("name")
    .limit(1);
  if (officesError) throw officesError;
  const locationName = offices?.[0]?.block ?? offices?.[0]?.name ?? null;

  const { data: technicians, error: techniciansError } = await supabase
    .from("technicians")
    .select("service_pincode, service_district, is_active, is_online, is_verified, status")
    .eq("is_active", true)
    .eq("is_online", true)
    .eq("is_verified", true)
    .eq("status", "ACTIVE")
    .eq("trade", trade ?? "Electrician");
  if (techniciansError) throw techniciansError;

  const available = technicians ?? [];
  const exactTechnicianCount = available.filter((technician) => technician.service_pincode === pincode).length;
  const districtTechnicianCount = available.filter((technician) => technician.service_district === district).length;
  const neighboringTechnicianCount = available.filter((technician) => technician.service_district !== district).length;

  if (exactTechnicianCount > 0) {
    return result("EXACT_PIN_MATCH", district, locationName, "45–60 mins", "Technician available in your immediate locality!", true, exactTechnicianCount, exactTechnicianCount);
  }
  if (districtTechnicianCount > 0) {
    return result("SAME_DISTRICT_MATCH", district, locationName, "2–3 hours (Extended Transit)", `No technician stationed directly at PIN ${pincode}, but a verified ${trade ?? "service"} expert is available in ${district}.`, true, districtTechnicianCount, 0);
  }
  if (neighboringTechnicianCount > 0) {
    return result("INTER_DISTRICT_FALLBACK", district, locationName, "Same-Day / Next-Day Scheduled", "Technicians are available from a neighboring district. Immediate dispatch cannot be guaranteed.", true, neighboringTechnicianCount, 0);
  }
  return result("NO_TECHNICIAN_AVAILABLE", district, locationName, null, "No verified technician is currently available for this PIN code.", false, 0, 0);
}
function unavailable(): ServiceAvailability {
  return result("OUT_OF_SERVICE_REGION", null, null, null, OUTSIDE_REGION_MESSAGE, false, 0, 0);
}

function result(
  status: ServiceAvailabilityStatus,
  district: SupportedDistrict | null,
  hubName: string | null,
  eta: string | null,
  message: string,
  canBook: boolean,
  technicianCount: number,
  exactTechnicianCount: number,
): ServiceAvailability {
  return {
    status,
    district,
    hubName,
    eta,
    message,
    canBook,
    technicianCount,
    exactTechnicianCount,
    nearestPincode: null,
    nearestTechnicianCount: 0,
  };
}
