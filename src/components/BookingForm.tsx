import { useState, useEffect, forwardRef } from "react";
import {
  Loader2,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  MapPin,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  checkServiceAvailability,
  type ServiceAvailability,
  type Trade,
} from "@/utils/serviceAvailabilityEngine";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import { useConfig } from "@/context/AppConfigContext";

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
  slot_type: "Today" | "Tomorrow" | "Specific Time";
  specific_date: string;
  specific_time_range: string;
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];
const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const BookingForm = forwardRef<HTMLDivElement, BookingFormProps>(
  ({ prefillCategory, prefillSubService, onSubmitSuccess }, ref) => {
    const { config, categories, timeSlots } = useConfig();
    const timeSlotLabels = timeSlots.map((s) => s.label);

    const emptyForm: FormState = {
      customer_name: "",
      customer_phone: "",
      address: "",
      pincode: "",
      locality: "",
      service_category: categories[0]?.name ?? "Electrician",
      sub_service: "",
      problem_description: "",
      slot_type: "Today",
      specific_date: getTodayDateString(),
      specific_time_range: timeSlotLabels[0] ?? "",
    };

    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [helpers, setHelpers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [availability, setAvailability] =
      useState<ServiceAvailability | null>(null);
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
      checkServiceAvailability(form.pincode, form.service_category as Trade)
        .then((result) => {
          if (!cancelled) setAvailability(result);
        })
        .catch(() => {
          if (!cancelled) {
            setAvailability(null);
            setAvailabilityError(true);
          }
        })
        .finally(() => {
          if (!cancelled) setAvailabilityLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [form.pincode, form.service_category]);

    const validatePhone = (
      phone: string,
    ): { valid: boolean; helper: string; error?: string } => {
      const trimmed = phone.trim();
      if (!trimmed)
        return { valid: false, helper: "10-digit Indian mobile number" };
      if (!/^[6-9]\d{9}$/.test(trimmed)) {
        if (!/^[6-9]/.test(trimmed)) {
          return {
            valid: false,
            helper: "Must start with 6, 7, 8, or 9",
            error: "Indian mobile numbers start with 6, 7, 8, or 9",
          };
        }
        if (trimmed.length < 10) {
          return {
            valid: false,
            helper: `${trimmed.length}/10 digits entered`,
            error: "Phone number must be exactly 10 digits",
          };
        }
        return {
          valid: false,
          helper: "Enter a valid 10-digit Indian mobile number",
          error: "Enter a valid 10-digit Indian mobile number",
        };
      }
      return { valid: true, helper: "Valid mobile number" };
    };

    const getEffectiveDate = (): string => {
      if (form.slot_type === "Today") return getTodayDateString();
      if (form.slot_type === "Tomorrow") return getTomorrowDateString();
      return form.specific_date;
    };

    const getComputedSlot = (): string => {
      return `${getEffectiveDate()} (${form.specific_time_range})`;
    };

    const validate = (): boolean => {
      const e: Record<string, string> = {};
      if (!form.customer_name.trim())
        e.customer_name = "Please enter your name";
      const phoneCheck = validatePhone(form.customer_phone);
      if (!phoneCheck.valid) e.customer_phone = phoneCheck.error!;
      if (!form.address.trim())
        e.address = "Enter your street address or landmark";
      if (!availability?.canBook)
        e.pincode = availability?.message ?? "Enter a serviceable PIN code";
      if (!form.service_category) e.service_category = "Select a service";
      if (!form.sub_service.trim())
        e.sub_service = "Describe the service needed";

      if (form.slot_type === "Specific Time" && !form.specific_date)
        e.specific_date = "Please pick a date";
      if (!form.specific_time_range)
        e.specific_time_range = "Please select a time range";

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

    const buildWhatsAppUrl = (f: FormState, slotText: string) => {
      const formattedAddress = `${f.address.trim()}, PIN: ${f.pincode}`;
      const text = `Hi ${BRAND.displayName}! I want to book a service:\n• *Service:* ${f.service_category} - ${f.sub_service}\n• *Name:* ${f.customer_name}\n• *Phone:* ${f.customer_phone}\n• *Address:* ${formattedAddress}\n• *Slot:* ${slotText}\n• *Issue:* ${f.problem_description || "—"}`;
      return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
      ev.preventDefault();
      setSubmitError(null);
      if (!validate()) return;

      const finalSlot = getComputedSlot();

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
            preferred_slot: finalSlot,
            status: "PENDING",
          })
          .select("booking_number")
          .single();

        if (error) throw error;
        const bookingId = data.booking_number;
        showToast(
          "success",
          `Booking ${bookingId} confirmed! Opening WhatsApp...`,
        );
        window.open(buildWhatsAppUrl(form, finalSlot), "_blank");
        onSubmitSuccess(bookingId);
        setForm(emptyForm);
        setHelpers({});
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Could not submit booking. Please try again or call us.";
        setSubmitError(msg);
        showToast("error", msg);
      } finally {
        setLoading(false);
      }
    };

    const phoneHelper =
      helpers.customer_phone ?? "10-digit Indian mobile number";
    const phoneValid = /^[6-9]\d{9}$/.test(form.customer_phone.trim());
    const pincodeComplete = /^\d{6}$/.test(form.pincode);
    const pincodeValid = Boolean(availability?.canBook);

    return (
      <section
        id="booking"
        ref={ref}
        className="scroll-mt-20 bg-white py-12 sm:py-16"
      >
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

            <Field
              label="Your Name"
              icon={<User className="h-4 w-4" />}
              error={errors.customer_name}
            >
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
                  handleChange(
                    "customer_phone",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
                placeholder="10-digit mobile number"
                className="form-input"
              />
            </Field>

            <Field
              label="Street Address / Locality / Landmark"
              icon={<MapPin className="h-4 w-4" />}
              error={errors.address}
            >
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
                onChange={(e) =>
                  handleChange("pincode", e.target.value.replace(/\D/g, ""))
                }
                placeholder="6-digit PIN code"
                className="form-input"
                aria-describedby="pincode-status"
              />
              {pincodeComplete && availabilityLoading && (
                <div
                  id="pincode-status"
                  className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                >
                  Checking technician availability...
                </div>
              )}
              {pincodeComplete && !availabilityLoading && availabilityError && (
                <div
                  id="pincode-status"
                  className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200"
                >
                  Availability is temporarily unavailable. Please call dispatch
                  to check the nearest technician.
                  <a
                    href={`tel:${BRAND.callingNumber}`}
                    className="ml-2 underline"
                  >
                    Call Dispatch
                  </a>
                </div>
              )}
              {pincodeComplete && !availabilityLoading && availability && (
                <div
                  id="pincode-status"
                  className={`mt-2 rounded-lg px-3 py-2 text-xs font-semibold ring-1 ${availability.canBook && availability.technicianCount > 0 ? "bg-green-50 text-green-800 ring-green-200" : availability.canBook ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-red-50 text-red-700 ring-red-200"}`}
                >
                  {availability.canBook &&
                    availability.technicianCount > 0 &&
                    `✓ ${availability.message}`}
                  {availability.canBook &&
                    availability.technicianCount === 0 &&
                    `⚠️ ${availability.message}`}
                  {!availability.canBook && `❌ ${availability.message}`}
                  {!availability.canBook && (
                    <a
                      href={`tel:${config.calling_number}`}
                      className="ml-2 inline-block underline"
                    >
                      Call Dispatch
                    </a>
                  )}
                </div>
              )}
            </Field>

            <div className="grid grid-cols-1 gap-4">
              <Field label="Service Category" error={errors.service_category}>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200 p-1 sm:grid-cols-4">
                  {categories.map((cat) => (
                    <CategoryPill
                      key={cat.id}
                      active={form.service_category === cat.name}
                      onClick={() => handleChange("service_category", cat.name)}
                      icon={
                        <span className="text-base leading-none">
                          {cat.icon}
                        </span>
                      }
                      label={cat.name === "AC Technician" ? "AC" : cat.name}
                    />
                  ))}
                </div>
              </Field>

              {/* Preferred Slot Selector */}
              <Field
                label="Preferred Slot"
                icon={<Calendar className="h-4 w-4" />}
                error={errors.slot_type}
              >
                <select
                  value={form.slot_type}
                  onChange={(e) =>
                    handleChange(
                      "slot_type",
                      e.target.value as FormState["slot_type"],
                    )
                  }
                  className="form-input"
                >
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="Specific Time">
                    Pick a specific date & time
                  </option>
                </select>
              </Field>

              {/* Calendar & Time Range Section */}
              <div className="space-y-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4 transition-all">
                {form.slot_type === "Specific Time" && (
                  <Field
                    label="Select Date"
                    icon={<Calendar className="h-4 w-4 text-brand-600" />}
                    error={errors.specific_date}
                  >
                    <input
                      type="date"
                      min={getTodayDateString()}
                      value={form.specific_date}
                      onChange={(e) =>
                        handleChange("specific_date", e.target.value)
                      }
                      className="form-input bg-white"
                    />
                  </Field>
                )}

                <Field
                  label="Select Time Range"
                  icon={<Clock className="h-4 w-4 text-brand-600" />}
                  error={errors.specific_time_range}
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {timeSlotLabels.map((slot) => {
                      const isSelected = form.specific_time_range === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() =>
                            handleChange("specific_time_range", slot)
                          }
                          className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-semibold transition ${
                            isSelected
                              ? "border-2 border-brand-600 bg-brand-600 text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                          }`}
                        >
                          <span>{slot}</span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </div>

            <Field
              label="Specific Service / Problem"
              error={errors.sub_service}
            >
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
                onChange={(e) =>
                  handleChange("problem_description", e.target.value)
                }
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
              ₹{config.inspection_fee} visit charge applies. You'll be
              redirected to WhatsApp to confirm.
            </p>
          </form>
        </div>
      </section>
    );
  },
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
        <p
          className={`mt-1 text-xs ${helperValid ? "text-brand-600" : "text-slate-400"}`}
        >
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
          ? "bg-brand-600 text-white shadow-sm"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
