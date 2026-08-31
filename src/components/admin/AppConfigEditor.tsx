import { useState, useCallback } from "react";
import { Loader2, Pencil, Check, X, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useConfig } from "@/context/AppConfigContext";

const CONFIG_GROUPS: {
  label: string;
  keys: { key: string; label: string }[];
}[] = [
  {
    label: "Contact & Brand",
    keys: [
      { key: "brand_display_name", label: "Display Name" },
      { key: "brand_legal_name", label: "Legal Name" },
      { key: "support_phone", label: "Support Phone (display)" },
      { key: "calling_number", label: "Calling Number (tel: link)" },
      { key: "whatsapp_number", label: "WhatsApp Number (wa.me)" },
      { key: "support_email", label: "Support Email" },
      { key: "brand_domain", label: "Domain" },
      { key: "brand_url", label: "Brand URL" },
    ],
  },
  {
    label: "Hero Section",
    keys: [
      { key: "hero_title", label: "Hero Title" },
      { key: "hero_subtitle", label: "Hero Subtitle" },
      { key: "hero_region_label", label: "Region Badge Label" },
      { key: "hero_response_time", label: "Response Time Note" },
    ],
  },
  {
    label: "Copy & CTAs",
    keys: [
      { key: "tagline_primary", label: "Primary Tagline" },
      { key: "tagline_secondary", label: "Secondary Tagline" },
      { key: "tagline_short", label: "Short Tagline" },
      { key: "service_heading", label: "Service Section Heading" },
      { key: "service_description", label: "Service Section Description" },
      { key: "booking_button_text", label: "Booking CTA Button" },
      { key: "partner_button_text", label: "Partner CTA Button" },
      { key: "footer_serving_text", label: "Footer Service Area Text" },
    ],
  },
  {
    label: "Pricing & Guarantees",
    keys: [
      { key: "inspection_fee", label: "Inspection Fee (₹, number only)" },
      { key: "guarantee_days", label: "Warranty Days (number only)" },
    ],
  },
  {
    label: "Social Media",
    keys: [
      { key: "twitter_handle", label: "Twitter / X Handle" },
      { key: "instagram_handle", label: "Instagram Handle" },
      { key: "facebook_handle", label: "Facebook Page" },
    ],
  },
];

export default function AppConfigEditor() {
  const { config, refetch } = useConfig();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(config[key] ?? "");
    setSaveError(null);
    setSavedKey(null);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setSaveError(null);
  };

  const saveEdit = useCallback(async () => {
    if (!editingKey) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await supabase
        .from("app_config")
        .upsert(
          { key: editingKey, value: editValue.trim() },
          { onConflict: "key" },
        );
      if (error) throw error;
      setSavedKey(editingKey);
      setEditingKey(null);
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [editingKey, editValue, refetch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Site Configuration
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Changes apply immediately — no redeploy needed.
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {saveError && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg ring-1 ring-red-200">
          {saveError}
        </p>
      )}

      {CONFIG_GROUPS.map((group) => (
        <div
          key={group.label}
          className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden"
        >
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {group.label}
            </h4>
          </div>
          <div className="divide-y divide-slate-100">
            {group.keys.map(({ key, label }) => (
              <div key={key} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-600">
                    {label}
                  </p>
                  {editingKey === key ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="form-input flex-1 text-sm"
                      />
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p
                      className={`mt-0.5 text-sm ${savedKey === key ? "text-emerald-600 font-semibold" : "text-slate-800"}`}
                    >
                      {config[key] || (
                        <span className="italic text-slate-400">—</span>
                      )}
                    </p>
                  )}
                </div>
                {editingKey !== key && (
                  <button
                    onClick={() => startEdit(key)}
                    className="mt-0.5 flex shrink-0 items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
