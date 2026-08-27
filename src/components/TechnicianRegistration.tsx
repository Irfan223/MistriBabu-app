import { useState } from "react";
import { Loader2, CheckCircle2, User, Phone, Zap, Droplets, MapPin, AlertCircle, BadgeCheck } from "lucide-react";
import { BRAND } from "@/constants/brand";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import { TRI_DISTRICT_DATA, type DistrictCluster } from "@/data/triDistrictZones";

interface TechnicianRegistrationProps {
  open: boolean;
  onClose: () => void;
}

interface TechForm {
  full_name: string;
  phone: string;
  trade: string;
  experience_years: string;
  operating_areas: string;
  operating_pincode: string;
  primary_district: DistrictCluster["district"];
  selected_pincodes: string[];
  aadhaar_number: string;
}

const emptyTech: TechForm = {
  full_name: "",
  phone: "",
  trade: "Electrician",
  experience_years: "",
  operating_areas: "",
  operating_pincode: "",
  primary_district: "Muzaffarpur",
  selected_pincodes: [],
  aadhaar_number: "",
};

export default function TechnicianRegistration({
  open,
  onClose,
}: TechnicianRegistrationProps) {
  const [form, setForm] = useState<TechForm>(emptyTech);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phoneHelper, setPhoneHelper] = useState("10-digit Indian mobile number");
  const { toasts, showToast, dismiss } = useToast();

  if (!open) return null;

  const handleChange = (field: keyof TechForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (field === "phone") {
      const phoneCheck = validatePhone(value);
      setPhoneHelper(phoneCheck.helper);
    }
  };

  const validatePhone = (phone: string): { valid: boolean; helper: string; error?: string } => {
    const trimmed = phone.trim();
    if (!trimmed) return { valid: false, helper: "10-digit Indian mobile number" };
    if (!/^[6-9]/.test(trimmed)) {
      return { valid: false, helper: "Must start with 6, 7, 8, or 9", error: "Indian mobile numbers start with 6, 7, 8, or 9" };
    }
    if (trimmed.length < 10) {
      return { valid: false, helper: `${trimmed.length}/10 digits entered`, error: "Phone number must be exactly 10 digits" };
    }
    if (!/^[6-9]\d{9}$/.test(trimmed)) {
      return { valid: false, helper: "Enter a valid 10-digit Indian mobile number", error: "Enter a valid 10-digit Indian mobile number" };
    }
    return { valid: true, helper: "Valid mobile number" };
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Enter your full name";
    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) e.phone = phoneCheck.error!;
    if (!form.trade) e.trade = "Select your trade";
    if (!form.experience_years.trim()) {
      e.experience_years = "Enter your experience";
    } else if (isNaN(Number(form.experience_years)) || Number(form.experience_years) < 0) {
      e.experience_years = "Enter a valid number of years";
    }
    if (!form.operating_areas.trim()) e.operating_areas = "Enter your operating areas";
    if (form.selected_pincodes.length === 0) e.operating_pincode = "Select at least one serviceable PIN code";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildWhatsAppUrl = (f: TechForm) => {
    const text = `Hi ${BRAND.displayName}, I want to join as a verified expert:\n• *Name:* ${f.full_name}\n• *Trade:* ${f.trade}\n• *Phone:* ${f.phone}\n• *Experience:* ${f.experience_years} years\n• *District:* ${f.primary_district}\n• *Areas:* ${f.operating_areas}\n• *PINs:* ${f.selected_pincodes.join(", ")}`;
    return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("technicians").insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        trade: form.trade,
        experience_years: Number(form.experience_years),
        operating_areas: `District: ${form.primary_district}; Areas: ${form.operating_areas.trim()}; PINs: ${form.selected_pincodes.join(", ")}`,
        aadhaar_number: form.aadhaar_number.trim() || null,
        is_verified: false,
        status: "PENDING_VERIFICATION",
      });

      if (error) throw error;
      showToast("success", "Registration submitted! Opening WhatsApp...");
      window.open(buildWhatsAppUrl(form), "_blank");
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : "Could not submit registration. Please try again.";
      setSubmitError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(emptyTech);
    setErrors({});
    setSuccess(false);
    setSubmitError(null);
    setPhoneHelper("10-digit Indian mobile number");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
      <Toast toasts={toasts} onDismiss={dismiss} />
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Join Quick Mistri</h3>
            <p className="text-sm text-slate-500">Apply as a verified home service expert</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="mt-6 flex flex-col items-center text-center py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <CheckCircle2 className="h-8 w-8 text-orange-600" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-slate-900">
              Registration Received!
            </h4>
            <p className="mt-2 text-sm text-slate-500">
              We've got your details. Our team will verify your profile and call you within 24 hours.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            {submitError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <Field label="Full Name" icon={<User className="h-4 w-4" />} error={errors.full_name}>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="e.g. Suresh Yadav"
                className="form-input"
              />
            </Field>

            <Field
              label="Phone Number"
              icon={<Phone className="h-4 w-4" />}
              error={errors.phone}
              helper={phoneHelper}
              helperValid={/^[6-9]\d{9}$/.test(form.phone.trim()) && form.phone.length > 0}
            >
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit mobile number"
                className="form-input"
              />
            </Field>

            <Field label="Trade" error={errors.trade}>
              <div className="flex gap-2">
                <TradePill
                  active={form.trade === "Electrician"}
                  onClick={() => handleChange("trade", "Electrician")}
                  icon={<Zap className="h-4 w-4" />}
                  label="Electrician"
                />
                <TradePill
                  active={form.trade === "Plumber"}
                  onClick={() => handleChange("trade", "Plumber")}
                  icon={<Droplets className="h-4 w-4" />}
                  label="Plumber"
                />
              </div>
            </Field>

            <Field label="Experience (years)" error={errors.experience_years}>
              <input
                type="number"
                min={0}
                value={form.experience_years}
                onChange={(e) => handleChange("experience_years", e.target.value)}
                placeholder="e.g. 5"
                className="form-input"
              />
            </Field>

            <Field
              label="Operating Localities"
              icon={<MapPin className="h-4 w-4" />}
              error={errors.operating_areas}
            >
              <textarea
                value={form.operating_areas}
                onChange={(e) => handleChange("operating_areas", e.target.value)}
                placeholder="e.g. Mithanpura, Ahiyapur"
                className="form-input"
                rows={2}
              />
            </Field>

            <Field label="Primary District" error={errors.primary_district}>
              <select value={form.primary_district} onChange={(e) => { setForm((current) => ({ ...current, primary_district: e.target.value as DistrictCluster["district"], selected_pincodes: [] })); setErrors((current) => ({ ...current, operating_pincode: "" })); }} className="form-input">
                {Object.keys(TRI_DISTRICT_DATA).map((district) => <option key={district} value={district}>{district}</option>)}
              </select>
            </Field>

            <Field label="Serviceable PIN Codes" icon={<MapPin className="h-4 w-4" />} error={errors.operating_pincode}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TRI_DISTRICT_DATA[form.primary_district].pincodes.map((entry) => {
                  const selected = form.selected_pincodes.includes(entry.pincode);
                  return <button type="button" key={entry.pincode} onClick={() => setForm((current) => ({ ...current, selected_pincodes: selected ? current.selected_pincodes.filter((pin) => pin !== entry.pincode) : [...current.selected_pincodes, entry.pincode] }))} className={`rounded-lg p-2 text-left text-xs font-semibold ring-1 transition ${selected ? "bg-blue-50 text-blue-700 ring-blue-300" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}>
                    {entry.pincode} - {entry.hubName} ({entry.type})
                  </button>;
                })}
              </div>
            </Field>

            <Field label="Aadhaar Number (optional)" icon={<BadgeCheck className="h-4 w-4" />}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={form.aadhaar_number}
                onChange={(e) => handleChange("aadhaar_number", e.target.value.replace(/\D/g, ""))}
                placeholder="12-digit Aadhaar number"
                className="form-input"
              />
            </Field>

            <button
              type="submit"
              disabled={loading || form.selected_pincodes.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-orange-500 active:scale-95 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Register & Join"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  error,
  helper,
  helperValid,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  helper?: string;
  helperValid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        {icon}
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : helper ? (
        <p className={`mt-1 text-xs ${helperValid ? "text-orange-600" : "text-slate-400"}`}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function TradePill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
