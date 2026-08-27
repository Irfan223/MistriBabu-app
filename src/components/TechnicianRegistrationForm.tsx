import { FormEvent, useState } from "react";
import { CheckCircle2, LocateFixed, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserLocation } from "@/hooks/useUserLocation";

interface TechnicianRegistrationFormProps {
  open?: boolean;
  onClose?: () => void;
}

const trades = ["Electrician", "Plumber", "Carpenter", "AC Technician"] as const;
const radii = [5, 10, 20] as const;

export default function TechnicianRegistrationForm({ open = true, onClose }: TechnicianRegistrationFormProps) {
  const { coords, loading: locationLoading, error: locationError, requestGPS } = useUserLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [trade, setTrade] = useState<(typeof trades)[number]>("Electrician");
  const [radius, setRadius] = useState<(typeof radii)[number]>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Enter your full name.");
    if (!/^[6-9]\d{9}$/.test(phone)) return setError("Enter a valid 10-digit mobile number.");
    if (!coords) return setError("Detect your current location before submitting.");

    setLoading(true);
    const { error: insertError } = await supabase.from("technicians").insert({
      name: name.trim(),
      phone,
      trade,
      service_radius_km: radius,
      is_active: true,
      is_online: true,
      location: `POINT(${coords.lng} ${coords.lat})`,
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
      <label className="block text-sm font-semibold text-slate-700">Trade / Skill<select value={trade} onChange={(event) => setTrade(event.target.value as (typeof trades)[number])} className="form-input mt-1.5">{trades.map((value) => <option key={value}>{value}</option>)}</select></label>
      <fieldset><legend className="text-sm font-semibold text-slate-700">Service Radius</legend><div className="mt-1.5 grid grid-cols-3 gap-2">{radii.map((value) => <label key={value} className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-sm font-semibold ring-1 ${radius === value ? "bg-orange-600 text-white ring-orange-600" : "bg-white text-slate-600 ring-slate-200"}`}><input type="radio" name="radius" value={value} checked={radius === value} onChange={() => setRadius(value)} className="sr-only" />{value} km</label>)}</div></fieldset>
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-200">
        <button type="button" onClick={requestGPS} disabled={locationLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-500 disabled:opacity-60"><LocateFixed className="h-4 w-4" />{locationLoading ? "Detecting..." : coords ? "Location captured" : "Detect My Current Location"}</button>
        {locationError && <p className="mt-2 text-xs text-red-600">{locationError}</p>}
        {coords && <p className="mt-2 text-xs text-orange-700">Location captured: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>}
      </div>
      <button type="submit" disabled={loading || !coords} className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Register as Technician</button>
    </form>
  );

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-extrabold text-slate-900">Join Quick Mistri</h2><p className="mt-1 text-sm text-slate-500">Register as a local service professional</p></div>{onClose && <button type="button" onClick={onClose} aria-label="Close registration" className="text-2xl text-slate-400">×</button>}</div>{content}</div></div>;
}
