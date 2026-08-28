import { supabase } from "@/lib/supabase";
import { getServiceablePincode } from "@/services/serviceablePincodeService";

export type ServiceAvailabilityStatus =
  | "OUT_OF_SERVICE_REGION"
  | "AVAILABLE"
  | "NO_TECHNICIAN_AVAILABLE";

export type Trade = "Electrician" | "Plumber" | "Painter" | "AC Technician";
export type SupportedDistrict = "Muzaffarpur" | "Sitamarhi" | "Sheohar" | "Motihari";

export interface ServiceAvailability {
  status: ServiceAvailabilityStatus;
  district: SupportedDistrict | null;
  areaName: string | null;
  message: string;
  canBook: boolean;
  technicianCount: number;
}

const OUT_OF_SERVICE_MESSAGE =
  "We currently serve only Muzaffarpur, Sitamarhi, Sheohar, and Motihari districts.";

export async function checkServiceAvailability(
  targetPincode: string,
  trade?: Trade,
): Promise<ServiceAvailability> {
  const pincode = targetPincode.trim();

  const pincodeData = await getServiceablePincode(pincode);
  if (!pincodeData) {
    return { status: "OUT_OF_SERVICE_REGION", district: null, areaName: null, message: OUT_OF_SERVICE_MESSAGE, canBook: false, technicianCount: 0 };
  }

  // Server-side COUNT filtered by district + trade â€” no client-side filtering
  let query = supabase
    .from("technicians")
    .select("id", { count: "exact", head: true })
    .eq("service_district", pincodeData.district)
    .eq("is_active", true)
    .eq("is_online", true)
    .eq("is_verified", true)
    .eq("status", "ACTIVE");

  if (trade) query = query.contains("trades", [trade]);

  const { count, error } = await query;
  if (error) throw error;

  const technicianCount = count ?? 0;
  const areaName = pincodeData.areaNames[0] ?? pincodeData.block ?? null;
  const district = pincodeData.district;

  if (technicianCount === 0) {
    return {
      status: "NO_TECHNICIAN_AVAILABLE",
      district,
      areaName,
      // Allow booking anyway â€” admin will assign when one becomes available
      message: `No ${trade ?? "service"} technician available in ${district} right now. You can still book and we'll assign one shortly.`,
      canBook: true,
      technicianCount: 0,
    };
  }

  return {
    status: "AVAILABLE",
    district,
    areaName,
    message: `${technicianCount} ${trade ?? "service"} technician${technicianCount === 1 ? "" : "s"} available in ${district}.`,
    canBook: true,
    technicianCount,
  };
}
