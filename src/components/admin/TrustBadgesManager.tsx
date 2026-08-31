import { useState, useCallback } from "react";
import { Loader2, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useConfig, type TrustBadge } from "@/context/AppConfigContext";

type BadgeDraft = Omit<TrustBadge, "id">;
const BLANK: BadgeDraft = {
  title: "",
  description: "",
  icon: "✅",
  display_order: 0,
  is_active: true,
};

export default function TrustBadgesManager() {
  const { badges, refetch } = useConfig();
  const [editing, setEditing] = useState<(BadgeDraft & { id?: string }) | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (!editing?.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editing.id) {
        const { error: e } = await supabase
          .from("trust_badges")
          .update({
            title: editing.title,
            description: editing.description,
            icon: editing.icon,
            display_order: editing.display_order,
            is_active: editing.is_active,
          })
          .eq("id", editing.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("trust_badges").insert({
          title: editing.title,
          description: editing.description,
          icon: editing.icon,
          display_order: editing.display_order,
          is_active: editing.is_active,
        });
        if (e) throw e;
      }
      setEditing(null);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save badge");
    } finally {
      setSaving(false);
    }
  }, [editing, refetch]);

  const deleteBadge = useCallback(
    async (id: string) => {
      if (!confirm("Delete this trust badge?")) return;
      const { error: e } = await supabase
        .from("trust_badges")
        .delete()
        .eq("id", id);
      if (!e) refetch();
      else setError(e.message);
    },
    [refetch],
  );

  const toggleActive = async (badge: TrustBadge) => {
    const { error: e } = await supabase
      .from("trust_badges")
      .update({ is_active: !badge.is_active })
      .eq("id", badge.id);
    if (!e) refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Trust Badges</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage the "Why Quick Mistri?" section badges.
          </p>
        </div>
        <button
          onClick={() =>
            setEditing({ ...BLANK, display_order: badges.length + 1 })
          }
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-500"
        >
          <Plus className="h-3.5 w-3.5" /> Add Badge
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
            {editing.id ? "Edit Badge" : "New Badge"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-600">
              Icon (emoji)
              <input
                value={editing.icon}
                onChange={(e) =>
                  setEditing({ ...editing, icon: e.target.value })
                }
                className="form-input mt-1"
                maxLength={4}
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
            <label className="col-span-2 text-xs font-semibold text-slate-600">
              Title
              <input
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                className="form-input mt-1"
              />
            </label>
            <label className="col-span-2 text-xs font-semibold text-slate-600">
              Description
              <input
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                className="form-input mt-1"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
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
        {badges.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            No badges yet. Add one above.
          </p>
        )}
        {badges.map((badge) => (
          <div key={badge.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-2xl w-8 text-center">{badge.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">{badge.title}</p>
              <p className="text-xs text-slate-500">{badge.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-[10px] text-slate-400">
                #{badge.display_order}
              </p>
              <button
                onClick={() => toggleActive(badge)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
              >
                {badge.is_active ? "Active" : "Off"}
              </button>
              <button
                onClick={() =>
                  setEditing({
                    id: badge.id,
                    title: badge.title,
                    description: badge.description,
                    icon: badge.icon,
                    display_order: badge.display_order,
                    is_active: badge.is_active,
                  })
                }
                className="rounded-lg bg-slate-50 p-1.5 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => deleteBadge(badge.id)}
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
