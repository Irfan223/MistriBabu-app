import { useState, useCallback } from "react";
import { Loader2, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useConfig, type TimeSlot } from "@/context/AppConfigContext";

type SlotDraft = Omit<TimeSlot, "id">;
const BLANK: SlotDraft = { label: "", display_order: 0, is_active: true };

export default function TimeSlotsManager() {
  const { timeSlots, refetch } = useConfig();
  const [editing, setEditing] = useState<(SlotDraft & { id?: string }) | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (!editing?.label.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editing.id) {
        const { error: e } = await supabase
          .from("booking_time_slots")
          .update({
            label: editing.label,
            display_order: editing.display_order,
            is_active: editing.is_active,
          })
          .eq("id", editing.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("booking_time_slots").insert({
          label: editing.label,
          display_order: editing.display_order,
          is_active: editing.is_active,
        });
        if (e) throw e;
      }
      setEditing(null);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save time slot");
    } finally {
      setSaving(false);
    }
  }, [editing, refetch]);

  const deleteSlot = useCallback(
    async (id: string) => {
      if (!confirm("Delete this time slot?")) return;
      const { error: e } = await supabase
        .from("booking_time_slots")
        .delete()
        .eq("id", id);
      if (!e) refetch();
      else setError(e.message);
    },
    [refetch],
  );

  const toggleActive = async (slot: TimeSlot) => {
    const { error: e } = await supabase
      .from("booking_time_slots")
      .update({ is_active: !slot.is_active })
      .eq("id", slot.id);
    if (!e) refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Booking Time Slots
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Control which time slots appear in the booking form.
          </p>
        </div>
        <button
          onClick={() =>
            setEditing({ ...BLANK, display_order: timeSlots.length + 1 })
          }
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-500"
        >
          <Plus className="h-3.5 w-3.5" /> Add Slot
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg ring-1 ring-red-200">
          {error}
        </p>
      )}

      {editing && (
        <div className="rounded-xl bg-white p-4 ring-1 ring-brand-300 space-y-3">
          <p className="text-xs font-bold text-slate-700">
            {editing.id ? "Edit Slot" : "New Time Slot"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 text-xs font-semibold text-slate-600">
              Label (e.g. 09:00 AM - 12:00 PM (Morning))
              <input
                value={editing.label}
                onChange={(e) =>
                  setEditing({ ...editing, label: e.target.value })
                }
                className="form-input mt-1"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Display Order
              <input
                type="number"
                value={editing.display_order}
                onChange={(e) =>
                  setEditing({ ...editing, display_order: +e.target.value })
                }
                className="form-input mt-1"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-5">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(e) =>
                  setEditing({ ...editing, is_active: e.target.checked })
                }
              />
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(null)}
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}{" "}
              Save
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white ring-1 ring-slate-200 divide-y divide-slate-100 overflow-hidden">
        {timeSlots.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            No time slots yet. Add one above.
          </p>
        )}
        {timeSlots.map((slot) => (
          <div key={slot.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                {slot.label}
              </p>
              <p className="text-[10px] text-slate-400">
                Order: {slot.display_order}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleActive(slot)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${slot.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
              >
                {slot.is_active ? "Active" : "Off"}
              </button>
              <button
                onClick={() =>
                  setEditing({
                    id: slot.id,
                    label: slot.label,
                    display_order: slot.display_order,
                    is_active: slot.is_active,
                  })
                }
                className="rounded-lg bg-slate-50 p-1.5 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => deleteSlot(slot.id)}
                className="rounded-lg bg-red-50 p-1.5 text-red-500 ring-1 ring-red-200 hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
