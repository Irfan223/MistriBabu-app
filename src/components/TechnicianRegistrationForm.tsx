import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, LocateFixed, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DISTRICT_FALLBACK_COORDINATES, useUserLocation } from "@/hooks/useUserLocation";
import { getServiceablePincode } from "@/services/serviceablePincodeService";

interface TechnicianRegistrationFormProps {
  open?: boolean;
  onClose?: () => void;
}

const trades = ["Electrician", "Plumber", "Carpenter", "AC Technician"] as const;
const radii = [5, 10, 15, 20, 50] as const;
const serviceDistricts = ["Muzaffarpur", "Sitamarhi", "Sheohar", "Motihari"] as const;

export default function TechnicianRegistrationForm({ open = true, onClose }: TechnicianRegistrationFormProps) {
  const { coords, loading: locationLoading, error: locationError, requestGPS } = useUserLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [experience, setExperience] = useState("");
  const [servicePincode, setServicePincode] = useState("");
  const [serviceLocation, setServiceLocation] = useState<Awaited<ReturnType<typeof getServiceablePincode>>>(null);
  const [trade, setTrade] = useState<(typeof trades)[number]>("Electrician");
  const [radius, setRadius] = useState<(typeof radii)[number]>(10);
  const [serviceDistrict, setServiceDistrict] = useState<(typeof serviceDistricts)[number]>("Muzaffarpur");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!/^\d{6}$/.test(servicePincode)) {
      setServiceLocation(null);
      return;
    }
    getServiceablePincode(servicePincode).then(setServiceLocation).catch(() => setServiceLocation(null));
  }, [servicePincode]);

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Enter your full name.");
    if (!/^[6-9]\d{9}$/.test(phone)) return setError("Enter a valid 10-digit mobile number.");
    if (aadhaar && !/^\d{12}$/.test(aadhaar)) return setError("Enter a valid 12-digit Aadhaar number.");
    if (!experience.trim() || Number(experience) < 0) return setError("Enter valid experience in years.");
    if (!serviceDistrict) return setError("Select the district you serve.");
    const verifiedServiceLocation = await getServiceablePincode(servicePincode);
    if (!verifiedServiceLocation || verifiedServiceLocation.district !== serviceDistrict) return setError("Enter a valid service PIN from the selected district.");
    if (!coords && (verifiedServiceLocation.latitude === null || verifiedServiceLocation.longitude === null)) return setError("This service PIN has no verified coordinates yet. Detect GPS or choose another service PIN.");

    setLoading(true);
    const { error: insertError } = await supabase.from("technicians").insert({
      name: name.trim(),
      phone,
      experience_years: Number(experience),
      aadhaar_number: aadhaar || null,
      service_pincode: verifiedServiceLocation.pincode,
      trade,
      service_district: serviceDistrict,
      service_radius_km: radius,
      is_active: true,
      is_online: true,
      location: coords ? `POINT(${coords.lng} ${coords.lat})` : `POINT(${verifiedServiceLocation.longitude} ${verifiedServiceLocation.latitude})`,
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message.includes("technicians_phone_key") ? "This mobile number is already registered." : insertError.message);
      return;
    }
    setSubmitted(true);
  };

  const content = submitted ? (
    <div className="flex flex-col items-center py-10 text-center">
      <CheckCircle2 className="h-14 w-14 text-orange-600" />
      <h2 className="mt-4 text-xl font-bold text-slate-900">Registration submitted</h2>
      <p className="mt-2 text-sm text-slate-500">Our team will review your profile and contact you soon.</p>
      {onClose && <button type="button" onClick={onClose} className="mt-6 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white">Done</button>}
    </div>
  ) : (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <label className="block text-sm font-semibold text-slate-700">Full Name<input value={name} onChange={(event) => setName(event.target.value)} className="form-input mt-1.5" placeholder="Your full name" /></label>
      <label className="block text-sm font-semibold text-slate-700">Mobile Number<input value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={10} className="form-input mt-1.5" placeholder="10-digit mobile number" /></label>
      <label className="block text-sm font-semibold text-slate-700">Aadhaar Number <span className="font-normal text-slate-400">(optional)</span><input value={aadhaar} onChange={(event) => setAadhaar(event.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={12} className="form-input mt-1.5" placeholder="12-digit Aadhaar number" /></label>
      <label className="block text-sm font-semibold text-slate-700">Experience (years)<input value={experience} onChange={(event) => setExperience(event.target.value.replace(/\D/g, ""))} inputMode="numeric" className="form-input mt-1.5" placeholder="e.g. 5" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Trade / Skill<select value={trade} onChange={(event) => setTrade(event.target.value as (typeof trades)[number])} className="form-input mt-1.5">{trades.map((value) => <option key={value}>{value}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Primary service district<select value={serviceDistrict} onChange={(event) => setServiceDistrict(event.target.value as (typeof serviceDistricts)[number])} className="form-input mt-1.5">{serviceDistricts.map((value) => <option key={value}>{value}</option>)}</select></label></div>
      <label className="block text-sm font-semibold text-slate-700">Service PIN code<input value={servicePincode} onChange={(event) => setServicePincode(event.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} className="form-input mt-1.5" placeholder="Technician's 6-digit service PIN" /><span className="mt-1 block text-xs font-normal text-slate-500">Use the PIN where the technician will provide services. It can be different from your current location.</span></label>
      {serviceLocation && serviceLocation.district === serviceDistrict && <p className="-mt-2 rounded-lg bg-blue-50 p-3 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">Service location: {serviceLocation.block ?? serviceLocation.postOffice ?? "Verified postal area"}, {serviceLocation.district} ({serviceLocation.pincode})</p>}
      <fieldset><legend className="text-sm font-semibold text-slate-700">Service Radius</legend><div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">{radii.map((value) => <label key={value} className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-sm font-semibold ring-1 ${radius === value ? "bg-orange-600 text-white ring-orange-600" : "bg-white text-slate-600 ring-slate-200"}`}><input type="radio" name="radius" value={value} checked={radius === value} onChange={() => setRadius(value)} className="sr-only" />{value} km</label>)}</div></fieldset>
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-200">
        <button type="button" onClick={requestGPS} disabled={locationLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-500 disabled:opacity-60"><LocateFixed className="h-4 w-4" />{locationLoading ? "Detecting..." : coords ? "Location captured" : "Detect My Current Location"}</button>
        {locationError && <p className="mt-2 text-xs text-red-600">{locationError}</p>}
        {coords && <p className="mt-2 text-xs text-orange-700">Current location captured: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>}
        {!coords && <p className="mt-2 text-xs text-slate-500">GPS is optional. Registration uses the service PIN location above as backup.</p>}
        {coords && distanceBetween(coords, DISTRICT_FALLBACK_COORDINATES[serviceDistrict]) > 100 && <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">Your current GPS location is outside {serviceDistrict}. We save this as your current location; your selected district is where you provide services.</p>}
      </div>
      <button type="submit" disabled={loading || servicePincode.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Register as Technician</button>
    </form>
  );

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-extrabold text-slate-900">Join Quick Mistri</h2><p className="mt-1 text-sm text-slate-500">Register as a local service professional</p></div>{onClose && <button type="button" onClick={onClose} aria-label="Close registration" className="text-2xl text-slate-400">×</button>}</div>{content}</div></div>;
}

function distanceBetween(first: { lat: number; lng: number }, second: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const latDelta = (second.lat - first.lat) * Math.PI / 180;
  const lngDelta = (second.lng - first.lng) * Math.PI / 180;
  const latitude = first.lat * Math.PI / 180;
  const targetLatitude = second.lat * Math.PI / 180;
  const haversine = Math.sin(latDelta / 2) ** 2 + Math.cos(latitude) * Math.cos(targetLatitude) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
