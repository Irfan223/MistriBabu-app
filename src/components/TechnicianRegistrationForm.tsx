import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, X, LogIn, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getServiceablePincode,
  type ServiceablePincode,
} from "@/services/serviceablePincodeService";
import { useConfig } from "@/context/AppConfigContext";

interface TechnicianRegistrationFormProps {
  open?: boolean;
  onClose?: () => void;
  onLoginClick?: () => void;
}

const TRADES_FALLBACK = [
  "Electrician",
  "Plumber",
  "AC Technician",
  "Painter",
] as const;

export default function TechnicianRegistrationForm({
  open = true,
  onClose,
  onLoginClick,
}: TechnicianRegistrationFormProps) {
  const { categories } = useConfig();
  const TRADES =
    categories.length > 0
      ? categories.map((c) => c.name)
      : [...TRADES_FALLBACK];
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
  const [hindi, setHindi] = useState(true); // Hindi default for technician audience

  const t = {
    title: hindi ? "मिस्त्री के रूप में जुड़ें" : "Join as a Mistri",
    subtitle: hindi
      ? "स्थानीय सेवा प्रोफ़ेशनल के रूप में रजिस्टर करें"
      : "Register as a local service professional",
    name: hindi ? "पूरा नाम" : "Full Name",
    namePh: hindi ? "आपका पूरा नाम" : "Your full name",
    phone: hindi ? "मोबाइल नंबर" : "Mobile Number",
    phonePh: hindi ? "10 अंकों का मोबाइल नंबर" : "10-digit mobile number",
    exp: hindi ? "अनुभव (वर्षों में)" : "Experience (years)",
    expPh: hindi ? "जैसे: 5" : "e.g. 5",
    skills: hindi ? "आपकी स्किल" : "Skills",
    skillsSub: hindi ? "(सभी लागू चुनें)" : "(select all that apply)",
    pin: hindi ? "सर्विस पिन कोड" : "Service PIN code",
    pinPh: hindi ? "6 अंकों का पिन कोड" : "6-digit PIN of your service area",
    pinHint: hindi
      ? "जिस इलाके में आप सेवा देते हैं उसका पिन डालें।"
      : "Enter the PIN code of the area where you provide services.",
    pinLoading: hindi ? "पिन खोजा जा रहा है..." : "Looking up PIN...",
    pinNotFound: hindi
      ? "यह पिन हमारे सर्विस एरिया में नहीं है।"
      : "This PIN is not in our service area yet.",
    locality: hindi ? "आपका सर्विस लोकेशन" : "Your service locality",
    localityPh: hindi ? "अपना इलाका चुनें" : "Select your area",
    aadhaar: hindi ? "आधार नंबर" : "Aadhaar Number",
    aadhaarOpt: hindi ? "(वैकल्पिक)" : "(optional)",
    aadhaarPh: hindi ? "12 अंकों का आधार नंबर" : "12-digit Aadhaar number",
    submit: hindi
      ? "टेक्नीशियन के रूप में रजिस्टर करें"
      : "Register as Technician",
    done: hindi ? "हो गया" : "Done",
    successTitle: hindi ? "रजिस्ट्रेशन जमा हो गया" : "Registration submitted",
    successSub: hindi
      ? "हमारी टीम आपकी प्रोफ़ाइल देखेगी और जल्द संपर्क करेगी।"
      : "Our team will review your profile and contact you soon.",
    alreadyReg: hindi ? "पहले से रजिस्टर्ड हैं?" : "Already registered?",
    loginHere: hindi ? "यहाँ लॉगिन करें" : "Login here",
    errName: hindi ? "अपना पूरा नाम दर्ज करें।" : "Enter your full name.",
    errPhone: hindi
      ? "10 अंकों का वैध मोबाइल नंबर दर्ज करें।"
      : "Enter a valid 10-digit mobile number.",
    errExp: hindi
      ? "वर्षों में वैध अनुभव दर्ज करें।"
      : "Enter valid experience in years.",
    errSkills: hindi
      ? "कम से कम एक स्किल चुनें।"
      : "Select at least one skill.",
    errPin: hindi
      ? "हमारे सर्विस एरिया का 6 अंकों का पिन दर्ज करें।"
      : "Enter a valid 6-digit service PIN from our service area.",
    errLocality: hindi
      ? "अपना सर्विस लोकेशन चुनें।"
      : "Select your service locality.",
    errAadhaar: hindi
      ? "आधार 12 अंकों का होना चाहिए।"
      : "Aadhaar must be 12 digits.",
    errDuplicate: hindi
      ? "यह मोबाइल नंबर पहले से रजिस्टर्ड है।"
      : "This mobile number is already registered.",
    pinFound: hindi ? "✓ सर्विस एरिया मिला:" : "✓ Service area found:",
  };

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
    if (!name.trim()) return setError(t.errName);
    if (!/^[6-9]\d{9}$/.test(phone)) return setError(t.errPhone);
    if (!experience.trim() || Number(experience) < 0) return setError(t.errExp);
    if (selectedTrades.length === 0) return setError(t.errSkills);
    if (!pincodeData) return setError(t.errPin);
    if (!selectedLocality) return setError(t.errLocality);
    if (aadhaar && !/^\d{12}$/.test(aadhaar)) return setError(t.errAadhaar);

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
          ? t.errDuplicate
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
        {t.successTitle}
      </h2>
      <p className="mt-2 text-sm text-slate-500">{t.successSub}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          {t.done}
        </button>
      )}
    </div>
  ) : (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <label className="block text-sm font-semibold text-slate-700">
        {t.name}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-input mt-1.5"
          placeholder={t.namePh}
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        {t.phone}
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          maxLength={10}
          className="form-input mt-1.5"
          placeholder={t.phonePh}
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        {t.exp}
        <input
          value={experience}
          onChange={(e) => setExperience(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          className="form-input mt-1.5"
          placeholder={t.expPh}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">
          {t.skills}{" "}
          <span className="font-normal text-slate-400">{t.skillsSub}</span>
        </legend>
        <TradeMultiSelect
          options={TRADES}
          selected={selectedTrades}
          onChange={setSelectedTrades}
        />
      </fieldset>

      <label className="block text-sm font-semibold text-slate-700">
        {t.pin}
        <input
          value={servicePincode}
          onChange={(e) => setServicePincode(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          maxLength={6}
          className="form-input mt-1.5"
          placeholder={t.pinPh}
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">
          {t.pinHint}
        </span>
      </label>

      {pincodeLoading && (
        <p className="text-xs text-slate-400">{t.pinLoading}</p>
      )}

      {servicePincode.length === 6 && !pincodeLoading && !pincodeData && (
        <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {t.pinNotFound}
        </p>
      )}

      {pincodeData && (
        <p className="rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-800 ring-1 ring-green-200">
          {t.pinFound}{" "}
          {[pincodeData.block ?? pincodeData.areaNames[0], pincodeData.district]
            .filter(Boolean)
            .join(", ")}
          , {pincodeData.pincode}
        </p>
      )}

      {pincodeData && (
        <label className="block text-sm font-semibold text-slate-700">
          {t.locality}
          <select
            value={selectedLocality}
            onChange={(e) => setSelectedLocality(e.target.value)}
            className="form-input mt-1.5"
          >
            <option value="">{t.localityPh}</option>
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
        {t.aadhaar}{" "}
        <span className="font-normal text-slate-400">{t.aadhaarOpt}</span>
        <input
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          maxLength={12}
          className="form-input mt-1.5"
          placeholder={t.aadhaarPh}
        />
      </label>

      <button
        type="submit"
        disabled={loading || !pincodeData || !selectedLocality}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t.submit}
      </button>

      {onLoginClick && (
        <p className="text-center text-xs text-slate-500">
          {t.alreadyReg}{" "}
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onLoginClick();
            }}
            className="inline-flex items-center gap-1 font-medium text-orange-600 hover:underline"
          >
            <LogIn className="h-3 w-3" /> {t.loginHere}
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
            <h2 className="text-xl font-extrabold text-slate-900">{t.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHindi((h) => !h)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
            >
              {hindi ? "English" : "हिंदी"}
            </button>
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
        </div>
        {content}
      </div>
    </div>
  );
}

function TradeMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: readonly string[] | string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (trade: string) =>
    onChange(
      selected.includes(trade)
        ? selected.filter((t) => t !== trade)
        : [...selected, trade],
    );

  return (
    <div ref={ref} className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ring-1 ${
          open
            ? "bg-white ring-orange-400 shadow-sm"
            : "bg-white ring-slate-200 hover:ring-orange-300"
        }`}
      >
        {selected.length === 0 ? (
          <span className="text-slate-400">Select your skills...</span>
        ) : (
          <span className="flex flex-wrap gap-1.5">
            {selected.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700"
              >
                {t}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(t);
                  }}
                  className="text-orange-400 hover:text-orange-700"
                >
                  ×
                </button>
              </span>
            ))}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full rounded-xl bg-white shadow-lg ring-1 ring-slate-200 overflow-hidden">
          {options.map((trade) => {
            const isSelected = selected.includes(trade);
            return (
              <button
                key={trade}
                type="button"
                onClick={() => toggle(trade)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition ${
                  isSelected
                    ? "bg-orange-50 text-orange-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                    isSelected
                      ? "border-orange-500 bg-orange-500"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="h-3 w-3 text-white"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className={`flex-1 text-left font-semibold`}>
                  {trade}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
