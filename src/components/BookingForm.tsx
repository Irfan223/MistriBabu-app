import { useState, useEffect, useRef, forwardRef } from "react";
import {
  Loader2,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  MapPin,
  AlertCircle,
  Clock,
  Pencil,
  ChevronDown,
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
  preferred_date: string;
  preferred_time_range: string;
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];
const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};
// Extract "Morning" and "9 AM – 12 PM" from "09:00 AM - 12:00 PM (Morning)"
const parseSlotLabel = (label: string) => {
  const match = label.match(/^(.+?)\s*\((.+?)\)\s*$/);
  if (match) {
    const time = match[1].trim().replace(" - ", " – ").replace(/:00/g, "");
    return { name: match[2].trim(), time };
  }
  return { name: label, time: "" };
};

// After 8PM, earliest bookable date is tomorrow
const getMinDateString = () =>
  new Date().getHours() >= 20 ? getTomorrowDateString() : getTodayDateString();

// Parse slot end hour from label e.g. "09:00 AM - 12:00 PM (Morning)" → 12
const parseSlotEndHour = (label: string): number => {
  const match = label.match(/- (\d{1,2}):\d{2} (AM|PM)/);
  if (!match) return 23;
  let h = parseInt(match[1], 10);
  if (match[2] === "PM" && h !== 12) h += 12;
  if (match[2] === "AM" && h === 12) h = 0;
  return h;
};

const isSlotPast = (label: string, selectedDate: string): boolean => {
  if (selectedDate !== getTodayDateString()) return false;
  return new Date().getHours() >= parseSlotEndHour(label);
};

// Pick the next sensible time slot based on current hour
const getDefaultTimeSlot = (slots: string[]): string => {
  if (slots.length === 0) return "";
  const hour = new Date().getHours();
  const idx = hour < 9 ? 0 : hour < 12 ? 1 : hour < 15 ? 2 : hour < 18 ? 3 : 0;
  return slots[Math.min(idx, slots.length - 1)];
};

const BookingForm = forwardRef<HTMLDivElement, BookingFormProps>(
  ({ prefillCategory, prefillSubService, onSubmitSuccess }, ref) => {
    const { config, categories, timeSlots } = useConfig();
    const timeSlotLabels = timeSlots.map((s) => s.label);

    // Lock flags: when coming via "Book Now" the selections are pre-confirmed
    const [categoryLocked, setCategoryLocked] = useState(
      Boolean(prefillCategory),
    );
    const [subLocked, setSubLocked] = useState(Boolean(prefillSubService));

    const emptyForm: FormState = {
      customer_name: "",
      customer_phone: "",
      address: "",
      pincode: "",
      locality: "",
      service_category: categories[0]?.name ?? "Electrician",
      sub_service: "",
      problem_description: "",
      preferred_date: getMinDateString(),
      preferred_time_range: getDefaultTimeSlot(timeSlotLabels),
    };

    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const activeCategorySubServices =
      categories.find((c) => c.name === form.service_category)?.sub_services ??
      [];
    const [helpers, setHelpers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [availability, setAvailability] =
      useState<ServiceAvailability | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(false);
    const { toasts, showToast, dismiss } = useToast();

    // When DB time slots load, update default if still empty
    useEffect(() => {
      if (timeSlotLabels.length > 0 && !form.preferred_time_range) {
        setForm((f) => ({
          ...f,
          preferred_time_range: getDefaultTimeSlot(timeSlotLabels),
        }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeSlotLabels.length]);

    useEffect(() => {
      if (prefillCategory) {
        setForm((f) => ({ ...f, service_category: prefillCategory }));
        setCategoryLocked(true);
      }
      if (prefillSubService) {
        setForm((f) => ({ ...f, sub_service: prefillSubService }));
        setSubLocked(true);
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

    const getComputedSlot = (): string => {
      return `${form.preferred_date} (${form.preferred_time_range})`;
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
      if (!form.sub_service.trim()) e.sub_service = "Select a service type";
      if (!form.preferred_date) e.preferred_date = "Please select a date";
      if (!form.preferred_time_range)
        e.preferred_time_range = "Please select a time slot";
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
      const text = `Hi ${config.brand_display_name}! I want to book a service:\n\u2022 *Service:* ${f.service_category} - ${f.sub_service}\n\u2022 *Name:* ${f.customer_name}\n\u2022 *Phone:* ${f.customer_phone}\n\u2022 *Address:* ${formattedAddress}\n\u2022 *Slot:* ${slotText}\n\u2022 *Issue:* ${f.problem_description || "\u2014"}`;
      return `https://wa.me/${config.whatsapp_number}?text=${encodeURIComponent(text)}`;
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

    const isFormComplete =
      form.customer_name.trim().length > 0 &&
      phoneValid &&
      form.address.trim().length > 0 &&
      pincodeValid &&
      form.service_category.length > 0 &&
      form.sub_service.trim().length > 0 &&
      form.preferred_date.length > 0 &&
      form.preferred_time_range.length > 0;

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
                placeholder="Enter your full name"
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
                placeholder="Enter your 10-digit mobile number"
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
                placeholder="Enter your street address or landmark"
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
                placeholder="Enter your 6-digit PIN code"
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
                    href={`tel:${config.calling_number}`}
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
              {/* Category — locked chip if prefilled, dropdown if direct */}
              <Field label="Service Category" error={errors.service_category}>
                {categoryLocked && prefillCategory ? (
                  <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-2.5 ring-1 ring-brand-200">
                    <span className="flex items-center gap-2 text-sm font-bold text-brand-700">
                      <span className="text-base">
                        {
                          categories.find(
                            (c) => c.name === form.service_category,
                          )?.icon
                        }
                      </span>
                      {form.service_category}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCategoryLocked(false)}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-700"
                    >
                      <Pencil className="h-3 w-3" /> Change
                    </button>
                  </div>
                ) : (
                  <OptionPicker
                    value={form.service_category}
                    onChange={(val) => {
                      handleChange("service_category", val);
                      handleChange("sub_service", "");
                      setSubLocked(false);
                    }}
                    options={categories.map((c) => ({
                      value: c.name,
                      label: c.name,
                      icon: c.icon,
                    }))}
                    placeholder="Select a category"
                  />
                )}
              </Field>

              {/* Sub-service — locked chip if prefilled, dropdown from DB otherwise */}
              <Field label="Service Type" error={errors.sub_service}>
                {subLocked && prefillSubService ? (
                  <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-2.5 ring-1 ring-orange-200">
                    <span className="text-sm font-bold text-orange-700">
                      {form.sub_service}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubLocked(false)}
                      className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-600"
                    >
                      <Pencil className="h-3 w-3" /> Change
                    </button>
                  </div>
                ) : (
                  <OptionPicker
                    value={form.sub_service}
                    onChange={(val) => handleChange("sub_service", val)}
                    options={[
                      ...activeCategorySubServices.map((s) => ({
                        value: s.name,
                        label: s.name,
                        badge: `₹${s.price}`,
                      })),
                      { value: "other", label: "Other / Not listed" },
                    ]}
                    placeholder="Select a service type..."
                  />
                )}
              </Field>

              {/* Date + time side by side */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Visit Date"
                  icon={<Calendar className="h-4 w-4" />}
                  error={errors.preferred_date}
                >
                  <CustomDatePicker
                    value={form.preferred_date}
                    minDate={getMinDateString()}
                    onChange={(newDate) => {
                      handleChange("preferred_date", newDate);
                      const firstValid = timeSlotLabels.find(
                        (s) => !isSlotPast(s, newDate),
                      );
                      if (
                        firstValid &&
                        isSlotPast(form.preferred_time_range, newDate)
                      ) {
                        handleChange("preferred_time_range", firstValid);
                      }
                    }}
                  />
                </Field>

                <Field
                  label="Time Slot"
                  icon={<Clock className="h-4 w-4" />}
                  error={errors.preferred_time_range}
                >
                  <OptionPicker
                    value={form.preferred_time_range}
                    onChange={(val) =>
                      handleChange("preferred_time_range", val)
                    }
                    options={timeSlotLabels.map((s) => {
                      // "09:00 AM - 12:00 PM (Morning)" → "9 AM – 12 PM"
                      const label = s
                        .replace(/\s*\(.+\)\s*$/, "")
                        .replace(/:00/g, "")
                        .replace(" - ", "–")
                        .trim();
                      return {
                        value: s,
                        label,
                        disabled: isSlotPast(s, form.preferred_date),
                      };
                    })}
                    placeholder="Select time"
                  />
                </Field>
              </div>
            </div>

            <Field label="Additional Details (optional)">
              <textarea
                value={form.problem_description}
                onChange={(e) =>
                  handleChange("problem_description", e.target.value)
                }
                placeholder="Describe your issue (optional)"
                rows={3}
                className="form-input resize-none"
              />
            </Field>

            <button
              type="submit"
              disabled={loading || availabilityLoading || !isFormComplete}
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

interface PickerOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: string;
  badge?: string;
  disabled?: boolean;
}

function OptionPicker({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  options: PickerOption[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ring-1 ${
          open
            ? "bg-white ring-brand-500 shadow-sm"
            : "bg-white ring-slate-200 hover:ring-brand-300"
        }`}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            {selected.icon && (
              <span className="text-lg leading-none shrink-0">
                {selected.icon}
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-slate-800">{selected.label}</span>
              {selected.sublabel && (
                <span className="block text-[10px] text-slate-400">
                  {selected.sublabel}
                </span>
              )}
            </span>
            {selected.badge && (
              <span className="ml-1 shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
                From {selected.badge}
              </span>
            )}
          </span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 min-w-full min-w-[220px] rounded-xl bg-white shadow-lg ring-1 ring-slate-200 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={opt.disabled}
              onClick={() => {
                if (!opt.disabled) {
                  onChange(opt.value);
                  setOpen(false);
                }
              }}
              className={`flex w-full items-center justify-between px-4 py-3 text-sm transition ${
                opt.disabled
                  ? "cursor-not-allowed opacity-40"
                  : opt.value === value
                    ? "bg-brand-50 font-bold text-brand-700"
                    : "text-slate-700 hover:bg-brand-50"
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                {opt.icon && (
                  <span className="text-lg leading-none shrink-0">
                    {opt.icon}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="block text-[10px] text-slate-400">
                      {opt.sublabel}
                    </span>
                  )}
                </span>
              </span>
              {opt.badge && (
                <span className="ml-3 shrink-0 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-600">
                  From {opt.badge}
                </span>
              )}
              {opt.value === value && !opt.disabled && (
                <CheckCircle2 className="ml-2 h-4 w-4 shrink-0 text-brand-600" />
              )}
              {opt.disabled && (
                <span className="ml-2 text-[10px] text-slate-400">past</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomDatePicker({
  value,
  minDate,
  onChange,
}: {
  value: string;
  minDate: string;
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = new Date(value + "T00:00:00");
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const minD = new Date(minDate + "T00:00:00");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const displayDate = new Date(value + "T00:00:00").toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ring-1 ${
          open
            ? "bg-white ring-brand-500 shadow-sm"
            : "bg-white ring-slate-200 hover:ring-brand-300"
        }`}
      >
        <span className="flex items-center gap-2 text-slate-800">
          <Calendar className="h-4 w-4 text-brand-600 shrink-0" />
          {displayDate}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 left-0 mt-1.5 w-72 rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
          <div className="flex items-center justify-between bg-brand-600 px-3 py-3">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xl font-bold text-white hover:bg-brand-500 transition"
            >
              ‹
            </button>
            <span className="text-sm font-bold text-white">{monthLabel}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xl font-bold text-white hover:bg-brand-500 transition"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[10px] font-bold text-slate-400"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 p-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const thisD = new Date(viewYear, viewMonth, day);
              const dateStr = thisD.toLocaleDateString("en-CA");
              const isPast = thisD < minD;
              const isSelected = dateStr === value;
              const isToday = dateStr === getTodayDateString();
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPast}
                  onClick={() => {
                    onChange(dateStr);
                    setOpen(false);
                  }}
                  className={`flex h-9 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
                    isSelected
                      ? "bg-brand-600 text-white shadow-sm"
                      : isPast
                        ? "cursor-not-allowed text-slate-300"
                        : isToday
                          ? "ring-2 ring-brand-400 text-brand-700 hover:bg-brand-50"
                          : "text-slate-700 hover:bg-slate-100 active:scale-95"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
