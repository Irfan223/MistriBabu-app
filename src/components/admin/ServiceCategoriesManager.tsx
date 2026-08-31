import { useState, useCallback } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  useConfig,
  type ServiceCategory,
  type SubService,
} from "@/context/AppConfigContext";

type SubServiceDraft = Omit<SubService, "id" | "created_at">;
type CategoryDraft = Omit<
  ServiceCategory,
  "id" | "created_at" | "sub_services"
>;

const BLANK_CAT: CategoryDraft = {
  name: "",
  icon: "🔨",
  display_order: 0,
  is_active: true,
};
const BLANK_SUB: SubServiceDraft = {
  category_id: "",
  name: "",
  description: "",
  price: 0,
  display_order: 0,
  is_active: true,
};

export default function ServiceCategoriesManager() {
  const { categories, refetch } = useConfig();
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<
    (CategoryDraft & { id?: string }) | null
  >(null);
  const [editingSub, setEditingSub] = useState<
    (SubServiceDraft & { id?: string }) | null
  >(null);
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveCategory = useCallback(async () => {
    if (!editingCat?.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingCat.id) {
        const { error: e } = await supabase
          .from("service_categories")
          .update({
            name: editingCat.name,
            icon: editingCat.icon,
            display_order: editingCat.display_order,
            is_active: editingCat.is_active,
          })
          .eq("id", editingCat.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("service_categories").insert({
          name: editingCat.name,
          icon: editingCat.icon,
          display_order: editingCat.display_order,
          is_active: editingCat.is_active,
        });
        if (e) throw e;
      }
      setEditingCat(null);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }, [editingCat, refetch]);

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!confirm("Delete this category and all its sub-services?")) return;
      setSaving(true);
      setError(null);
      try {
        const { error: e } = await supabase
          .from("service_categories")
          .delete()
          .eq("id", id);
        if (e) throw e;
        refetch();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      } finally {
        setSaving(false);
      }
    },
    [refetch],
  );

  const saveSubService = useCallback(async () => {
    if (!editingSub?.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingSub.id) {
        const { error: e } = await supabase
          .from("sub_services")
          .update({
            name: editingSub.name,
            description: editingSub.description,
            price: editingSub.price,
            display_order: editingSub.display_order,
            is_active: editingSub.is_active,
          })
          .eq("id", editingSub.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("sub_services").insert({
          category_id: editingSub.category_id,
          name: editingSub.name,
          description: editingSub.description,
          price: editingSub.price,
          display_order: editingSub.display_order,
          is_active: editingSub.is_active,
        });
        if (e) throw e;
      }
      setEditingSub(null);
      setAddingSubFor(null);
      refetch();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save sub-service",
      );
    } finally {
      setSaving(false);
    }
  }, [editingSub, refetch]);

  const deleteSubService = useCallback(
    async (id: string) => {
      if (!confirm("Delete this sub-service?")) return;
      setSaving(true);
      setError(null);
      try {
        const { error: e } = await supabase
          .from("sub_services")
          .delete()
          .eq("id", id);
        if (e) throw e;
        refetch();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete sub-service",
        );
      } finally {
        setSaving(false);
      }
    },
    [refetch],
  );

  const toggleCatActive = async (cat: ServiceCategory) => {
    const { error: e } = await supabase
      .from("service_categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
    if (!e) refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Service Categories
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage trades and their sub-services with prices.
          </p>
        </div>
        <button
          onClick={() =>
            setEditingCat({
              ...BLANK_CAT,
              display_order: categories.length + 1,
            })
          }
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-500"
        >
          <Plus className="h-3.5 w-3.5" /> Add Category
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg ring-1 ring-red-200">
          {error}
        </p>
      )}

      {/* Add / edit category form */}
      {editingCat && (
        <div className="rounded-xl bg-white p-4 ring-1 ring-brand-300 space-y-3">
          <p className="text-xs font-bold text-slate-700">
            {editingCat.id ? "Edit Category" : "New Category"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-600">
              Name
              <input
                value={editingCat.name}
                onChange={(e) =>
                  setEditingCat({ ...editingCat, name: e.target.value })
                }
                className="form-input mt-1"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Icon (emoji)
              <input
                value={editingCat.icon}
                onChange={(e) =>
                  setEditingCat({ ...editingCat, icon: e.target.value })
                }
                className="form-input mt-1"
                maxLength={4}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Display Order
              <input
                type="number"
                value={editingCat.display_order}
                onChange={(e) =>
                  setEditingCat({
                    ...editingCat,
                    display_order: +e.target.value,
                  })
                }
                className="form-input mt-1"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-5">
              <input
                type="checkbox"
                checked={editingCat.is_active}
                onChange={(e) =>
                  setEditingCat({ ...editingCat, is_active: e.target.checked })
                }
              />
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditingCat(null)}
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              onClick={saveCategory}
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

      {categories
        .concat(/* include inactive via admin view */ [])
        .map((cat) => (
          <div
            key={cat.id}
            className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() =>
                  setExpandedCat(expandedCat === cat.id ? null : cat.id)
                }
                className="text-slate-400 hover:text-slate-600"
              >
                {expandedCat === cat.id ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <span className="text-xl">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{cat.name}</p>
                <p className="text-xs text-slate-500">
                  {cat.sub_services.length} sub-services · order{" "}
                  {cat.display_order}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCatActive(cat)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cat.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {cat.is_active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() =>
                    setEditingCat({
                      id: cat.id,
                      name: cat.name,
                      icon: cat.icon,
                      display_order: cat.display_order,
                      is_active: cat.is_active,
                    })
                  }
                  className="rounded-lg bg-slate-50 p-1.5 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="rounded-lg bg-red-50 p-1.5 text-red-500 ring-1 ring-red-200 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {expandedCat === cat.id && (
              <div className="border-t border-slate-100">
                <div className="divide-y divide-slate-50">
                  {cat.sub_services.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 px-4 py-2.5 bg-slate-50/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">
                          {sub.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {sub.description}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-orange-600 shrink-0">
                        ₹{sub.price}
                      </p>
                      <button
                        onClick={() =>
                          setEditingSub({
                            id: sub.id,
                            category_id: cat.id,
                            name: sub.name,
                            description: sub.description,
                            price: sub.price,
                            display_order: sub.display_order,
                            is_active: sub.is_active,
                          })
                        }
                        className="rounded-lg bg-white p-1.5 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteSubService(sub.id)}
                        className="rounded-lg bg-red-50 p-1.5 text-red-500 ring-1 ring-red-200 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Add sub-service form or button */}
                {addingSubFor === cat.id && editingSub ? (
                  <div className="p-4 space-y-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-700">
                      {editingSub.id ? "Edit Sub-Service" : "New Sub-Service"}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="col-span-2 text-xs font-semibold text-slate-600">
                        Name
                        <input
                          value={editingSub.name}
                          onChange={(e) =>
                            setEditingSub({
                              ...editingSub,
                              name: e.target.value,
                            })
                          }
                          className="form-input mt-1"
                        />
                      </label>
                      <label className="col-span-2 text-xs font-semibold text-slate-600">
                        Description
                        <input
                          value={editingSub.description}
                          onChange={(e) =>
                            setEditingSub({
                              ...editingSub,
                              description: e.target.value,
                            })
                          }
                          className="form-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Price (₹)
                        <input
                          type="number"
                          value={editingSub.price}
                          onChange={(e) =>
                            setEditingSub({
                              ...editingSub,
                              price: +e.target.value,
                            })
                          }
                          className="form-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Display Order
                        <input
                          type="number"
                          value={editingSub.display_order}
                          onChange={(e) =>
                            setEditingSub({
                              ...editingSub,
                              display_order: +e.target.value,
                            })
                          }
                          className="form-input mt-1"
                        />
                      </label>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setEditingSub(null);
                          setAddingSubFor(null);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                      <button
                        onClick={saveSubService}
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
                ) : (
                  <button
                    onClick={() => {
                      setAddingSubFor(cat.id);
                      setEditingSub({
                        ...BLANK_SUB,
                        category_id: cat.id,
                        display_order: cat.sub_services.length + 1,
                      });
                    }}
                    className="flex w-full items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 border-t border-slate-100"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Sub-Service
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

      {/* Edit sub-service form when triggered from the list (not add-for) */}
      {editingSub?.id && addingSubFor === null && (
        <div className="rounded-xl bg-white p-4 ring-1 ring-brand-300 space-y-3">
          <p className="text-xs font-bold text-slate-700">Edit Sub-Service</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 text-xs font-semibold text-slate-600">
              Name
              <input
                value={editingSub.name}
                onChange={(e) =>
                  setEditingSub({ ...editingSub, name: e.target.value })
                }
                className="form-input mt-1"
              />
            </label>
            <label className="col-span-2 text-xs font-semibold text-slate-600">
              Description
              <input
                value={editingSub.description}
                onChange={(e) =>
                  setEditingSub({ ...editingSub, description: e.target.value })
                }
                className="form-input mt-1"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Price (₹)
              <input
                type="number"
                value={editingSub.price}
                onChange={(e) =>
                  setEditingSub({ ...editingSub, price: +e.target.value })
                }
                className="form-input mt-1"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Display Order
              <input
                type="number"
                value={editingSub.display_order}
                onChange={(e) =>
                  setEditingSub({
                    ...editingSub,
                    display_order: +e.target.value,
                  })
                }
                className="form-input mt-1"
              />
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditingSub(null)}
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              onClick={saveSubService}
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
    </div>
  );
}
