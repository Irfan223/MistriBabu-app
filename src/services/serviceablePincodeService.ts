import { supabase } from "@/lib/supabase";

export interface ServiceablePincode {
  pincode: string;
  district: "Muzaffarpur" | "Sitamarhi" | "Sheohar" | "Motihari";
  postOffice: string | null;
  block: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function getServiceablePincode(pincode: string): Promise<ServiceablePincode | null> {
  const normalized = pincode.trim();
  if (!/^\d{6}$/.test(normalized)) return null;

  const { data: serviceable, error: serviceableError } = await supabase
    .from("serviceable_pincodes")
    .select("pincode")
    .eq("pincode", normalized)
    .eq("enabled", true)
    .maybeSingle();

  if (serviceableError) throw serviceableError;
  if (!serviceable) return null;

  const { data: postal, error: postalError } = await supabase
    .from("postal_pincodes")
    .select("pincode, district")
    .eq("pincode", normalized)
    .maybeSingle();
  if (postalError) throw postalError;
  if (!postal) return null;

  const { data: office, error: officeError } = await supabase
    .from("post_offices")
    .select("name, block, latitude, longitude")
    .eq("pincode", normalized)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("name")
    .limit(1)
    .maybeSingle();
  if (officeError) throw officeError;

  return {
    pincode: postal.pincode,
    district: postal.district as ServiceablePincode["district"],
    postOffice: office?.name ?? null,
    block: office?.block ?? null,
    latitude: office?.latitude ?? null,
    longitude: office?.longitude ?? null,
  };
}
