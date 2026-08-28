import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  lookupPincodeFromIndiaPost,
  upsertServiceablePincode,
  type ServiceablePincode,
  type SupportedDistrict,
} from "@/services/serviceablePincodeService";

const DISTRICTS: SupportedDistrict[] = ["Muzaffarpur", "Sitamarhi", "Sheohar", "Motihari"];

export default function AdminPincodeManager() {
  const [pincode, setPincode] = useState("");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceablePincode | null>(null);

  const fetchPincode = async () => {
    setError(null);
    setSuccess(null);
    setForm(null);
    if (!/^\d{6}$/.test(pincode)) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }

    setFetching(true);
    try {
      const result = await lookupPincodeFromIndiaPost(pincode);
      if (!result.district) {
        setError("This pincode is outside Muzaffarpur, Sitamarhi, Sheohar, or Motihari, or was not found.");
        return;
      }
      setForm({
        pincode,
        district: result.district,
        block: result.block,
        areaNames: result.areaNames,
        latitude: result.latitude ?? 0,
        longitude: result.longitude ?? 0,
      });
      if (result.coordinatesMissing) {
        setError("Coordinates could not be auto-detected. Enter latitude and longitude manually below.");
      }
    } catch {
      setError("Could not fetch pincode details. Please try again.");
    } finally {
      setFetching(false);
    }
  };

  const save = async () => {
    if (!form) return;
    if (!form.latitude || !form.longitude) {
      setError("Latitude and longitude are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertServiceablePincode(form);
      setSuccess(`Saved pincode ${form.pincode}.`);
      setForm(null);
      setPincode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save pincode.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <h3 className="text-sm font-bold text-slate-900">Add / Update Serviceable Pincode</h3>
      <p className="mt-1 text-xs text-slate-500">
        District, block, and area names are auto-fetched from India Post; coordinates from OpenStreetMap.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={pincode}
          onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))}
          maxLength={6}
          placeholder="6-digit pincode"
          className="form-input"
        />
        <button
          type="button"
          onClick={fetchPincode}
          disabled={fetching}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {fetching && <Loader2 className="h-4 w-4 animate-spin" />}
          Fetch
        </button>
      </div>

      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      {success && <p className="mt-2 text-xs font-semibold text-emerald-600">{success}</p>}

      {form && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <label className="block text-xs font-semibold text-slate-700">
            District
            <select
              value={form.district}
              onChange={(event) => setForm({ ...form, district: event.target.value as SupportedDistrict })}
              className="form-input mt-1"
            >
              {DISTRICTS.map((district) => (
                <option key={district}>{district}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Block
            <input
              value={form.block ?? ""}
              onChange={(event) => setForm({ ...form, block: event.target.value })}
              className="form-input mt-1"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Area names (comma separated)
            <input
              value={form.areaNames.join(", ")}
              onChange={(event) =>
                setForm({
                  ...form,
                  areaNames: event.target.value.split(",").map((value) => value.trim()).filter(Boolean),
                })
              }
              className="form-input mt-1"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-700">
              Latitude
              <input
                type="number"
                step="any"
                value={form.latitude || ""}
                onChange={(event) => setForm({ ...form, latitude: Number(event.target.value) })}
                className="form-input mt-1"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Longitude
              <input
                type="number"
                step="any"
                value={form.longitude || ""}
                onChange={(event) => setForm({ ...form, longitude: Number(event.target.value) })}
                className="form-input mt-1"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Pincode
          </button>
        </div>
      )}
    </div>
  );
}
