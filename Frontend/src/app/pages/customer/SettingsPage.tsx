import { useState, useEffect } from "react";
import { MapPin, Plus, Pencil, Trash2, Star, Check, X, AlertTriangle, Home, Briefcase, MoreHorizontal } from "lucide-react";
import AddressFields, { AddressValue } from "../../components/AddressFields";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

// ── Types ────────────────────────────────────────────────────────────────────
interface Address {
  address_id: number;
  label:      string;
  full_name:  string;
  phone:      string;
  address:    string;
  district:   string;
  city:       string;
  ward:       string | null;
  is_default: boolean;
}

interface AddressForm {
  label:      string;
  full_name:  string;
  phone:      string;
  address:    string;   // Số nhà/tên đường
  district:   string;
  city:       string;
  ward:       string;
  is_default: boolean;
}

const BLANK: AddressForm = {
  label: "Home", full_name: "", phone: "",
  address: "", district: "", city: "", ward: "", is_default: false,
};

const LABEL_OPTIONS = [
  { value: "Home",   icon: Home,         label: "Home" },
  { value: "Office", icon: Briefcase,    label: "Office" },
  { value: "Other",  icon: MoreHorizontal, label: "Other" },
];

// ── Label icon helper ────────────────────────────────────────────────────────
function LabelIcon({ label }: { label: string }) {
  const opt = LABEL_OPTIONS.find((o) => o.value === label);
  const Icon = opt?.icon ?? MapPin;
  return <Icon className="w-4 h-4" />;
}

// ── Address Form Modal ────────────────────────────────────────────────────────
function AddressModal({
  initial, isFirst, onSave, onClose,
}: {
  initial: AddressForm;
  isFirst: boolean;
  onSave: (form: AddressForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm]   = useState<AddressForm>(initial);
  const [errs, setErrs]   = useState<Partial<AddressForm>>({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState("");

  const set = (field: keyof AddressForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrs((v) => ({ ...v, [field]: "" }));
      setApiErr("");
    };

  const validate = () => {
    const e: Partial<AddressForm> = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    if (!/^0[0-9]{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit phone number.";
    if (!form.address.trim())   e.address   = "Vui lòng nhập số nhà, tên đường.";
    if (!form.city.trim())      e.city      = "Vui lòng chọn tỉnh/thành phố.";
    if (!form.district.trim())  e.district  = "Vui lòng chọn quận/huyện.";
    if (!form.ward.trim())      e.ward      = "Vui lòng chọn phường/xã.";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({ ...form, is_default: isFirst ? true : form.is_default });
      onClose();
    } catch (e: any) {
      setApiErr(e.message || "Could not save address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">
            {initial.full_name ? "Edit Address" : "Add New Address"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Label selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
            <div className="flex gap-2">
              {LABEL_OPTIONS.map(({ value, icon: Icon, label }) => (
                <button key={value} type="button"
                  onClick={() => setForm((f) => ({ ...f, label: value }))}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.label === value
                      ? "border-[#7C2D12] bg-[#7C2D12]/5 text-[#7C2D12]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input value={form.full_name} onChange={set("full_name")} placeholder="Nguyen Van A"
                className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 transition-all ${errs.full_name ? "border-red-400" : "border-gray-200"}`} />
              {errs.full_name && <p className="text-xs text-red-500 mt-1">{errs.full_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <input value={form.phone} onChange={set("phone")} placeholder="09xxxxxxxx" maxLength={10}
                className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 transition-all ${errs.phone ? "border-red-400" : "border-gray-200"}`} />
              {errs.phone && <p className="text-xs text-red-500 mt-1">{errs.phone}</p>}
            </div>
          </div>

          {/* Số nhà / Tên đường */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Số nhà, tên đường <span className="text-red-500">*</span>
            </label>
            <input value={form.address} onChange={set("address")} placeholder="VD: 123 Đường Láng"
              className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:bg-white focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20 transition-all ${errs.address ? "border-red-400" : "border-gray-200"}`} />
            {errs.address && <p className="text-xs text-red-500 mt-1">{errs.address}</p>}
          </div>

          {/* Address fields với dropdown có thực */}
          <AddressFields
            value={{ city: form.city, district: form.district, ward: form.ward, address: "" }}
            onChange={(val) => setForm(f => ({ ...f, city: val.city, district: val.district, ward: val.ward }))}
            errors={{ city: errs.city, district: errs.district, ward: errs.ward }}
            showStreet={false}
          />

          {/* Set as default */}
          {!isFirst && (
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.is_default ? "bg-[#7C2D12] border-[#7C2D12]" : "border-gray-300"}`}
                onClick={() => setForm((f) => ({ ...f, is_default: !f.is_default }))}>
                {form.is_default && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Set as default address</div>
                <div className="text-xs text-gray-500">Used automatically at checkout</div>
              </div>
            </label>
          )}

          {/* API Error */}
          {apiErr && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {apiErr}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#7C2D12] hover:bg-[#6B2510] text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-70">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? "Saving…" : "Save Address"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();
  const [addresses, setAddresses]   = useState<Address[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [modal, setModal]           = useState<{ form: AddressForm; id?: number } | null>(null);
  const [deleting, setDeleting]     = useState<number | null>(null);
  const [settingDef, setSettingDef] = useState<number | null>(null);
  const [toast, setToast]           = useState<string | null>(null);

  // Load addresses
  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<Address[]>("/api/addresses");
      setAddresses(data);
    } catch (e: any) {
      setError("Could not load your addresses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Open modal for new address
  const openAdd = () =>
    setModal({ form: { ...BLANK, is_default: addresses.length === 0 } });

  // Open modal for edit
  const openEdit = (a: Address) =>
    setModal({
      id: a.address_id,
      form: {
        label: a.label, full_name: a.full_name, phone: a.phone,
        address: a.address, district: a.district, city: a.city,
        ward: a.ward || "", is_default: a.is_default,
      },
    });

  // Save (create or update)
  const handleSave = async (form: AddressForm) => {
    if (modal?.id) {
      await apiFetch(`/api/addresses/${modal.id}`, { method: "PUT", body: JSON.stringify(form) });
      showToast("Address updated successfully.");
    } else {
      await apiFetch("/api/addresses", { method: "POST", body: JSON.stringify(form) });
      showToast("New address added.");
    }
    await load();
  };

  // Set default
  const handleSetDefault = async (id: number) => {
    setSettingDef(id);
    try {
      await apiFetch(`/api/addresses/${id}/default`, { method: "PATCH" });
      await load();
      showToast("Default address updated.");
    } catch {
      setError("Could not set default address.");
    } finally {
      setSettingDef(null);
    }
  };

  // Delete
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this address?")) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/addresses/${id}`, { method: "DELETE" });
      await load();
      showToast("Address deleted.");
    } catch {
      setError("Could not delete address.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Addresses</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your saved addresses. Your default address is pre-filled at checkout.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={load} className="ml-auto underline font-medium">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-40 bg-gray-100 rounded" />
                <div className="h-3 w-56 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">

          {/* Empty state */}
          {addresses.length === 0 && (
            <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-gray-200">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">You haven't saved any addresses yet.</p>
              <button onClick={openAdd}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C2D12] text-white rounded-xl text-sm font-semibold hover:bg-[#6B2510] transition-colors">
                <Plus className="w-4 h-4" /> Add First Address
              </button>
            </div>
          )}

          {/* Address cards */}
          {addresses.map((a) => (
            <div key={a.address_id}
              className={`bg-white rounded-2xl p-5 border-2 transition-all ${
                a.is_default ? "border-[#7C2D12]" : "border-gray-100 hover:border-gray-200"
              }`}>
              <div className="flex items-start justify-between gap-4">

                {/* Left: info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    a.is_default ? "bg-[#7C2D12] text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    <LabelIcon label={a.label} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{a.label}</span>
                      {a.is_default && (
                        <span className="flex items-center gap-1 text-xs bg-[#7C2D12]/10 text-[#7C2D12] px-2 py-0.5 rounded-full font-medium">
                          <Star className="w-3 h-3 fill-current" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-1">{a.full_name}</p>
                    <p className="text-sm text-gray-500">{a.phone}</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {[a.address, a.district, a.city, a.ward].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(a)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-[#7C2D12] hover:text-[#7C2D12] transition-all">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  {!a.is_default && (
                    <button onClick={() => handleSetDefault(a.address_id)}
                      disabled={settingDef === a.address_id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-amber-400 hover:text-amber-600 transition-all disabled:opacity-50">
                      {settingDef === a.address_id
                        ? <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        : <Star className="w-3.5 h-3.5" />}
                      Set Default
                    </button>
                  )}
                  {addresses.length > 1 && (
                    <button onClick={() => handleDelete(a.address_id)}
                      disabled={deleting === a.address_id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50">
                      {deleting === a.address_id
                        ? <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add new button */}
          {addresses.length > 0 && (
            <button onClick={openAdd}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-medium text-gray-500 hover:border-[#7C2D12] hover:text-[#7C2D12] hover:bg-[#7C2D12]/5 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add New Address
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <AddressModal
          initial={modal.form}
          isFirst={addresses.length === 0}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}