import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2, X, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getServiceablePincode,
  type ServiceablePincode,
} from "@/services/serviceablePincodeService";

interface TechnicianRegistrationFormProps {
  open?: boolean;
  onClose?: () => void;
  onLoginClick?: () => void;
}

const TRADES = ["Electrician", "Plumber", "AC Technician", "Painter"] as const;

export default function TechnicianRegistrationForm({
  open = true,
  onClose,
  onLoginClick,
}: TechnicianRegistrationFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [servicePincode, setServicePincode] = useState("");
  const [pincodeData, setPincodeData] = useState<ServiceablePincode | null>(
    null,
  );
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [selectedLocality, setSelectedLocality] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Auto-lookup pincode when 6 digits are entered
  useEffect(() => {
    if (!/^\d{6}$/.test(servicePincode)) {
      setPincodeData(null);
      setSelectedLocality("");
      return;
    }
    let cancelled = false;
    setPincodeLoading(true);
    getServiceablePincode(servicePincode)
      .then((data) => {
        if (!cancelled) {
          setPincodeData(data);
          setSelectedLocality("");
        }
      })
      .catch(() => {
        if (!cancelled) setPincodeData(null);
      })
      .finally(() => {
        if (!cancelled) setPincodeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [servicePincode]);

  const toggleTrade = (trade: string) =>
    setSelectedTrades((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade],
    );

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Enter your full name.");
    if (!/^[6-9]\d{9}$/.test(phone))
      return setError("Enter a valid 10-digit mobile number.");
    if (!experience.trim() || Number(experience) < 0)
      return setError("Enter valid experience in years.");
    if (selectedTrades.length === 0)
      return setError("Select at least one skill.");
    if (!pincodeData)
      return setError(
        "Enter a valid 6-digit service PIN from our service area.",
      );
    if (!selectedLocality) return setError("Select your service locality.");
    if (aadhaar && !/^\d{12}$/.test(aadhaar))
      return setError("Aadhaar must be 12 digits.");

    setLoading(true);
    const { error: insertError } = await supabase.from("technicians").insert({
      name: name.trim(),
      phone,
      experience_years: Number(experience),
      trades: selectedTrades,
      service_pincode: pincodeData.pincode,
      service_locality: selectedLocality,
      service_district: pincodeData.district,
      is_active: true,
      is_online: true,
      location: `POINT(${pincodeData.longitude} ${pincodeData.latitude})`,
      aadhaar_number: aadhaar || null,
    });
    setLoading(false);
    if (insertError) {
      setError(
        insertError.message.includes("technicians_phone_key")
          ? "This mobile number is already registered."
          : insertError.message,
      );
      return;
    }
    setSubmitted(true);
  };

  const content = submitted ? (
    <div className="flex flex-col items-center py-10 text-center">
      <CheckCircle2 className="h-14 w-14 text-orange-600" />
      <h2 className="mt-4 text-xl font-bold text-slate-900">
        Registration submitted
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Our team will review your profile and contact you soon.
      </p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          Done
        </button>
      )}
    </div>
  ) : (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <label className="block text-sm font-semibold text-slate-700">
        Full Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-input mt-1.5"
          placeholder="Your full name"
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Mobile Number
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          maxLength={10}
          className="form-input mt-1.5"
          placeholder="10-digit mobile number"
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Experience (years)
        <input
          value={experience}
          onChange={(e) => setExperience(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          className="form-input mt-1.5"
          placeholder="e.g. 5"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">
          Skills{" "}
          <span className="font-normal text-slate-400">
            (select all that apply)
          </span>
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {TRADES.map((trade) => (
            <label
              key={trade}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${selectedTrades.includes(trade) ? "border-orange-500 bg-orange-50 text-orange-800" : "border-slate-200 text-slate-600 hover:border-orange-300"}`}
            >
              <input
                type="checkbox"
                checked={selectedTrades.includes(trade)}
                onChange={() => toggleTrade(trade)}
                className="h-4 w-4 accent-orange-600"
              />
              {trade}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-semibold text-slate-700">
        Service PIN code
        <input
          value={servicePincode}
          onChange={(e) => setServicePincode(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          maxLength={6}
          className="form-input mt-1.5"
          placeholder="6-digit PIN of your service area"
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">
          Enter the PIN code of the area where you provide services.
        </span>
      </label>

      {pincodeLoading && (
        <p className="text-xs text-slate-400">Looking up PIN...</p>
      )}

      {servicePincode.length === 6 && !pincodeLoading && !pincodeData && (
        <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
          This PIN is not in our service area yet.
        </p>
      )}

      {pincodeData && (
        <p className="rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-800 ring-1 ring-green-200">
          ✓ Service area found:{" "}
          {[pincodeData.block ?? pincodeData.areaNames[0], pincodeData.district]
            .filter(Boolean)
            .join(", ")}
          , {pincodeData.pincode}
        </p>
      )}

      {pincodeData && (
        <label className="block text-sm font-semibold text-slate-700">
          Your service locality
          <select
            value={selectedLocality}
            onChange={(e) => setSelectedLocality(e.target.value)}
            className="form-input mt-1.5"
          >
            <option value="">Select your area</option>
            {(pincodeData.areaNames.length > 0
              ? pincodeData.areaNames
              : [pincodeData.block ?? pincodeData.district]
            ).map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-sm font-semibold text-slate-700">
        Aadhaar Number{" "}
        <span className="font-normal text-slate-400">(optional)</span>
        <input
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          maxLength={12}
          className="form-input mt-1.5"
          placeholder="12-digit Aadhaar number"
        />
      </label>

      <button
        type="submit"
        disabled={loading || !pincodeData || !selectedLocality}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Register as Technician
      </button>
      {onLoginClick && (
        <p className="text-center text-xs text-slate-500">
          Already registered?{" "}
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onLoginClick();
            }}
            className="inline-flex items-center gap-1 font-medium text-orange-600 hover:underline"
          >
            <LogIn className="h-3 w-3" /> Login here
          </button>
        </p>
      )}
    </form>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Join as a Mistri
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Register as a local service professional
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {content}
      </div>
    </div>
  );
}
