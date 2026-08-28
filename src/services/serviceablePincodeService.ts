import { supabase } from "@/lib/supabase";

export interface ServiceablePincode {
  pincode: string;
  district: "Muzaffarpur" | "Sitamarhi" | "Sheohar" | "Motihari";
  areaNames: string[];
  block: string | null;
  latitude: number;
  longitude: number;
}

export async function getServiceablePincode(pincode: string): Promise<ServiceablePincode | null> {
  const normalized = pincode.trim();
  if (!/^\d{6}$/.test(normalized)) return null;

  const { data, error } = await supabase
    .from("serviceable_pincodes")
    .select("pincode, district, area_names, block, latitude, longitude")
    .eq("pincode", normalized)
    .eq("enabled", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    pincode: data.pincode,
    district: data.district as ServiceablePincode["district"],
    areaNames: data.area_names ? data.area_names.split("|").map((s: string) => s.trim()).filter(Boolean) : [],
    block: data.block ?? null,
    latitude: data.latitude,
    longitude: data.longitude,
  };
}
