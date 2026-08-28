import { supabase } from "@/lib/supabase";

export type SupportedDistrict = "Muzaffarpur" | "Sitamarhi" | "Sheohar" | "Motihari";
const SUPPORTED_DISTRICTS: SupportedDistrict[] = ["Muzaffarpur", "Sitamarhi", "Sheohar", "Motihari"];

export interface ServiceablePincode {
  pincode: string;
  district: SupportedDistrict;
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

interface IndiaPostOffice {
  Name: string;
  District: string;
  State: string;
  Block: string;
}

export interface PincodeLookupResult {
  district: SupportedDistrict | null;
  block: string | null;
  areaNames: string[];
  latitude: number | null;
  longitude: number | null;
  coordinatesMissing: boolean;
}

// India Post gives district/block/area names; it never returns coordinates.
export async function lookupPincodeFromIndiaPost(pincode: string): Promise<PincodeLookupResult> {
  const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  const [result] = (await response.json()) as Array<{ Status: string; PostOffice: IndiaPostOffice[] | null }>;
  const offices = result?.Status === "Success" ? result.PostOffice ?? [] : [];

  if (offices.length === 0) {
    return { district: null, block: null, areaNames: [], latitude: null, longitude: null, coordinatesMissing: true };
  }

  const district = offices[0].District;
  const block = offices[0].Block;
  const areaNames = [...new Set(offices.map((office) => office.Name))];
  const supportedDistrict = SUPPORTED_DISTRICTS.find((d) => d === district) ?? null;
  const coords = await lookupCoordinatesFromNominatim(block, district);

  return {
    district: supportedDistrict,
    block,
    areaNames,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    coordinatesMissing: coords === null,
  };
}

// Open-source, no API key. Best-effort — admin fills lat/lng manually if this misses.
async function lookupCoordinatesFromNominatim(block: string, district: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const query = encodeURIComponent(`${block}, ${district}, Bihar, India`);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
    if (!response.ok) return null;
    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const match = results[0];
    if (!match) return null;
    return { latitude: Number(match.lat), longitude: Number(match.lon) };
  } catch {
    return null;
  }
}

export async function upsertServiceablePincode(input: ServiceablePincode): Promise<void> {
  const { error } = await supabase.from("serviceable_pincodes").upsert({
    pincode: input.pincode,
    district: input.district,
    block: input.block,
    area_names: input.areaNames.join("|"),
    latitude: input.latitude,
    longitude: input.longitude,
    enabled: true,
  });
  if (error) throw error;
}
