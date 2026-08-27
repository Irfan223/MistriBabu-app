import { useState, useEffect, forwardRef } from "react";
import { Loader2, CheckCircle2, Calendar, Phone, User, MapPin, Zap, Droplets, AlertCircle } from "lucide-react";
import { BRAND } from "@/constants/brand";
import { checkServiceAvailability, type ServiceAvailability } from "@/utils/serviceAvailabilityEngine";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";

interface BookingFormProps {
  prefillCategory: string;
  prefillSubService: string;
  onSubmitSuccess: (bookingId: string) => void;
}

interface FormState {
  customer_name: string;
  customer_phone: string;
  address: string;
  pincode: string;
  locality: string;
  service_category: string;
  sub_service: string;
  problem_description: string;
  preferred_slot: string;
}

const emptyForm: FormState = {
  customer_name: "",
  customer_phone: "",
  address: "",
  pincode: "",
  locality: "",
  service_category: "Electrician",
  sub_service: "",
  problem_description: "",
  preferred_slot: "Today",
};

const BookingForm = forwardRef<HTMLDivElement, BookingFormProps>(
  ({ prefillCategory, prefillSubService, onSubmitSuccess }, ref) => {
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [helpers, setHelpers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [availability, setAvailability] = useState<ServiceAvailability | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(false);
    const { toasts, showToast, dismiss } = useToast();

    useEffect(() => {
      if (prefillCategory) {
        setForm((f) => ({ ...f, service_category: prefillCategory }));
      }
      if (prefillSubService) {
        setForm((f) => ({ ...f, sub_service: prefillSubService }));
      }
    }, [prefillCategory, prefillSubService]);

    useEffect(() => {
      if (!/^\d{6}$/.test(form.pincode)) {
        setAvailability(null);
        setAvailabilityError(false);
        return;
      }
      let cancelled = false;
      setAvailabilityLoading(true);
      setAvailabilityError(false);
      checkServiceAvailability(form.pincode, form.service_category as "Electrician" | "Plumber")
        .then((result) => { if (!cancelled) setAvailability(result); })
        .catch(() => { if (!cancelled) { setAvailability(null); setAvailabilityError(true); } })
        .finally(() => { if (!cancelled) setAvailabilityLoading(false); });
      return () => { cancelled = true; };
    }, [form.pincode, form.service_category]);

    const validatePhone = (phone: string): { valid: boolean; helper: string; error?: string } => {
      const trimmed = phone.trim();
      if (!trimmed) return { valid: false, helper: "10-digit Indian mobile number" };
      if (!/^[6-9]\d{9}$/.test(trimmed)) {
        if (!/^[6-9]/.test(trimmed)) {
          return { valid: false, helper: "Must start with 6, 7, 8, or 9", error: "Indian mobile numbers start with 6, 7, 8, or 9" };
        }
        if (trimmed.length < 10) {
          return { valid: false, helper: `${trimmed.length}/10 digits entered`, error: "Phone number must be exactly 10 digits" };
        }
        return { valid: false, helper: "Enter a valid 10-digit Indian mobile number", error: "Enter a valid 10-digit Indian mobile number" };
      }
      return { valid: true, helper: "Valid mobile number" };
    };

    const validate = (): boolean => {
      const e: Record<string, string> = {};
      if (!form.customer_name.trim()) e.customer_name = "Please enter your name";
      const phoneCheck = validatePhone(form.customer_phone);
      if (!phoneCheck.valid) e.customer_phone = phoneCheck.error!;
      if (!form.address.trim()) e.address = "Enter your street address or landmark";
      if (!availability?.canBook) e.pincode = availability?.message ?? "Enter a serviceable PIN code";
      if (!form.service_category) e.service_category = "Select a service";
      if (!form.sub_service.trim()) e.sub_service = "Describe the service needed";
      if (!form.preferred_slot) e.preferred_slot = "Choose a slot";
      setErrors(e);
      return Object.keys(e).length === 0;
    };

    const handleChange = (field: keyof FormState, value: string) => {
      setForm((f) => ({ ...f, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
      if (field === "customer_phone") {
        const phoneCheck = validatePhone(value);
        setHelpers((prev) => ({ ...prev, customer_phone: phoneCheck.helper }));
      }
    };

    const buildWhatsAppUrl = (f: FormState) => {
      const formattedAddress = `${f.address.trim()}, PIN: ${f.pincode}`;
      const text = `Hi ${BRAND.displayName}! I want to book a service:\n• *Service:* ${f.service_category} - ${f.sub_service}\n• *Name:* ${f.customer_name}\n• *Phone:* ${f.customer_phone}\n• *Address:* ${formattedAddress}\n• *Slot:* ${f.preferred_slot}\n• *Issue:* ${f.problem_description || "—"}`;
      return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
      ev.preventDefault();
      setSubmitError(null);
      if (!validate()) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("bookings")
          .insert({
            customer_name: form.customer_name.trim(),
            customer_phone: form.customer_phone.trim(),
            locality: `${form.address.trim()}, PIN: ${form.pincode}`,
            service_category: form.service_category,
            sub_service: form.sub_service.trim(),
            problem_description: form.problem_description.trim() || null,
            preferred_slot: form.preferred_slot,
            status: "PENDING",
          })
          .select("id")
          .single();

        if (error) throw error;
        const bookingId = `MB-${data.id}`;
        showToast("success", `Booking ${bookingId} confirmed! Opening WhatsApp...`);
        window.open(buildWhatsAppUrl(form), "_blank");
        onSubmitSuccess(bookingId);
        setForm(emptyForm);
        setHelpers({});
      } catch (err) {
        const msg = err instanceof Error
          ? err.message
          : "Could not submit booking. Please try again or call us.";
        setSubmitError(msg);
        showToast("error", msg);
      } finally {
        setLoading(false);
      }
    };

    const phoneHelper = helpers.customer_phone ?? "10-digit Indian mobile number";
    const phoneValid = /^[6-9]\d{9}$/.test(form.customer_phone.trim());
    const pincodeComplete = /^\d{6}$/.test(form.pincode);
    const pincodeValid = Boolean(availability?.canBook);

    return (
      <section id="booking" ref={ref} className="scroll-mt-20 bg-white py-12 sm:py-16">
        <Toast toasts={toasts} onDismiss={dismiss} />
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Quick Booking
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Fill the form — we'll confirm on WhatsApp within minutes.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 sm:p-6"
            noValidate
          >
            {submitError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <Field label="Your Name" icon={<User className="h-4 w-4" />} error={errors.customer_name}>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => handleChange("customer_name", e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="form-input"
              />
            </Field>

            <Field
              label="Phone Number"
              icon={<Phone className="h-4 w-4" />}
              error={errors.customer_phone}
              helper={phoneHelper}
              helperValid={phoneValid && form.customer_phone.length > 0}
            >
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.customer_phone}
                onChange={(e) =>
                  handleChange("customer_phone", e.target.value.replace(/\D/g, ""))
                }
                placeholder="10-digit mobile number"
                className="form-input"
              />
            </Field>

            <Field label="Street Address / Locality / Landmark" icon={<MapPin className="h-4 w-4" />} error={errors.address}>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="e.g. Flat 201, Mithanpura Chowk"
                className="form-input"
              />
            </Field>

            <Field label="PIN Code" error={errors.pincode}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => handleChange("pincode", e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit PIN code"
                className="form-input"
                aria-describedby="pincode-status"
              />
              {pincodeComplete && availabilityLoading && (
                <div id="pincode-status" className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  Checking technician availability...
                </div>
              )}
              {pincodeComplete && !availabilityLoading && availabilityError && (
                <div id="pincode-status" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                  Availability is temporarily unavailable. Please call dispatch to check the nearest technician.
                  <a href={`tel:${BRAND.callingNumber}`} className="ml-2 underline">Call Dispatch</a>
                </div>
              )}
              {pincodeComplete && !availabilityLoading && availability && (
                <div id="pincode-status" className={`mt-2 rounded-lg px-3 py-2 text-xs font-semibold ring-1 ${availability.status === "EXACT_PIN_MATCH" ? "bg-orange-50 text-orange-700 ring-orange-200" : availability.canBook ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-red-50 text-red-700 ring-red-200"}`}>
                  <strong className="block">PIN {form.pincode}: {availability.exactTechnicianCount} technician{availability.exactTechnicianCount === 1 ? "" : "s"} available at this PIN</strong>
                  {availability.status === "EXACT_PIN_MATCH" && `✓ Service available in ${availability.hubName}, ${availability.district} • ETA: ${availability.eta}`}
                  {availability.canBook && availability.status !== "EXACT_PIN_MATCH" && `⚠️ ${availability.technicianCount} technician${availability.technicianCount === 1 ? "" : "s"} available nearby with extended ETA: ${availability.eta}. Immediate dispatch is not available for this location, but you can book a scheduled slot.`}
                  {availability.canBook && availability.status !== "EXACT_PIN_MATCH" && availability.nearestPincode && `Nearest available PIN ${availability.nearestPincode}: ${availability.nearestTechnicianCount} technician${availability.nearestTechnicianCount === 1 ? "" : "s"}`}
                  {!availability.canBook && availability.status === "OUT_OF_SERVICE_REGION" && "❌ We currently serve only Muzaffarpur, Sitamarhi, and Sheohar districts."}
                  {!availability.canBook && availability.status === "NO_TECHNICIAN_AVAILABLE" && "❌ No verified technician is currently available for this PIN code."}
                  {!availability.canBook && <a href={`tel:${BRAND.callingNumber}`} className="ml-2 inline-block underline">Call Dispatch</a>}
                </div>
              )}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Service Category" error={errors.service_category}>
                <div className="flex gap-2">
                  <CategoryPill
                    active={form.service_category === "Electrician"}
                    onClick={() => handleChange("service_category", "Electrician")}
                    icon={<Zap className="h-4 w-4" />}
                    label="Electrician"
                  />
                  <CategoryPill
                    active={form.service_category === "Plumber"}
                    onClick={() => handleChange("service_category", "Plumber")}
                    icon={<Droplets className="h-4 w-4" />}
                    label="Plumber"
                  />
                </div>
              </Field>

              <Field label="Preferred Slot" icon={<Calendar className="h-4 w-4" />} error={errors.preferred_slot}>
                <select
                  value={form.preferred_slot}
                  onChange={(e) => handleChange("preferred_slot", e.target.value)}
                  className="form-input"
                >
                  <option value="Today">Today (ASAP)</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="Specific Time">Pick a specific time</option>
                </select>
              </Field>
            </div>

            <Field label="Specific Service / Problem" error={errors.sub_service}>
              <input
                type="text"
                value={form.sub_service}
                onChange={(e) => handleChange("sub_service", e.target.value)}
                placeholder="e.g. Ceiling fan not working"
                className="form-input"
              />
            </Field>

            <Field label="Problem Description (optional)">
              <textarea
                value={form.problem_description}
                onChange={(e) => handleChange("problem_description", e.target.value)}
                placeholder="Tell us a bit more about the issue..."
                rows={3}
                className="form-input resize-none"
              />
            </Field>

            <button
              type="submit"
              disabled={loading || availabilityLoading || !pincodeValid}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Confirm Booking
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400">
              {BRAND.inspectionFee} visit charge applies. You'll be redirected to WhatsApp to confirm.
            </p>
          </form>
        </div>
      </section>
    );
  }
);

BookingForm.displayName = "BookingForm";
export default BookingForm;

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

function CategoryPill({
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
