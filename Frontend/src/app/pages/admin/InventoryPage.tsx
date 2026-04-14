import { useState, useEffect } from "react";
import { Edit2, Check, X, AlertTriangle, TrendingDown, Package, RefreshCw } from "lucide-react";
import { formatPrice } from "../../data/products";
import { useInventory } from "../../hooks/useInventory";

// v_inventory_summary trả về các field này
interface InventoryRow {
  variant_id:    number;
  product_id:    number;
  product_name:  string;
  image_url:     string;
  category_name: string;
  weight:        string;
  price:         number;
  stock_quantity: number;
  last_update:   string;
  sku?:          string;
}

// Grouped để hiển thị theo sản phẩm (rowspan)
interface InventoryItem {
  product_id:   number;
  name:         string;
  image:        string;
  category:     string;
  lastUpdated:  string;
  variants: {
    variant_id: number;
    weight:     string;
    price:      number;
    stock:      number;
    sku:        string;
  }[];
}

interface EditingCell {
  variantId: number;
  field:     "price" | "stock";
}

const LOW_STOCK = 5;

function groupInventory(rows: InventoryRow[]): InventoryItem[] {
  const map = new Map<number, InventoryItem>();
  for (const row of rows) {
    if (!map.has(row.product_id)) {
      map.set(row.product_id, {
        product_id:  row.product_id,
        name:        row.product_name || "Unknown",
        image:       row.image_url ? `/images/${row.image_url}` : "/images/logo.jpg",
        category:    row.category_name || "Sản phẩm",
        lastUpdated: row.last_update?.split("T")[0] || "-",
        variants:    [],
      });
    }
    const item = map.get(row.product_id)!;
    item.variants.push({
      variant_id: row.variant_id,
      weight:     row.weight,
      price:      Number(row.price),
      stock:      Number(row.stock_quantity),
      sku:        row.sku || `P${row.product_id}-${row.weight}`,
    });
    // keep most recent lastUpdated
    if (row.last_update && row.last_update > (item.lastUpdated + "T")) {
      item.lastUpdated = row.last_update.split("T")[0];
    }
  }
  return Array.from(map.values());
}

function getStockStatus(stock: number) {
  // US10 business rule: negative stock must not be displayed as normal status
  if (stock < 0)          return { label: "Invalid",      classes: "bg-gray-100 text-gray-500 border-gray-200",   icon: "⚠️" };
  if (stock === 0)        return { label: "Out of Stock", classes: "bg-red-100 text-red-700 border-red-200",      icon: "🔴" };
  if (stock <= LOW_STOCK) return { label: "Low Stock",    classes: "bg-amber-100 text-amber-700 border-amber-200", icon: "🟡" };
  return                         { label: "In Stock",     classes: "bg-green-100 text-green-700 border-green-200", icon: "🟢" };
}

export default function InventoryPage() {
  const { inventory: rawRows, loading, error, updateStock, updatePrice, refetch } = useInventory();

  // localRows: optimistic UI
  const [localRows, setLocalRows] = useState<InventoryRow[] | null>(null);
  useEffect(() => {
    if (rawRows.length > 0) setLocalRows(rawRows as InventoryRow[]);
  }, [rawRows]);

  const rows: InventoryRow[]     = (localRows ?? rawRows) as InventoryRow[];
  const inventory: InventoryItem[] = groupInventory(rows);

  // ── Inline edit ────────────────────────────────────────────────────
  const [editing, setEditing]     = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving]       = useState(false);

  const startEdit = (variantId: number, field: "price" | "stock", current: number) => {
    setEditing({ variantId, field });
    setEditValue(current.toString());
    setEditError("");
  };

  const commitEdit = async () => {
    if (!editing) return;
    const num = Number(editValue);
    if (!Number.isInteger(num))        { setEditError("Please enter a valid number.");              return; }
    if (num < 0)                        { setEditError(editing.field === "price" ? "Price cannot be negative." : "Stock cannot be negative."); return; }
    if (editing.field === "price" && num < 1000) { setEditError("Price must be greater than 0 (min 1,000 VND)."); return; }

    setSaving(true);
    try {
      // Optimistic update
      setLocalRows((prev) =>
        (prev || []).map((r) =>
          r.variant_id === editing.variantId
            ? { ...r, [editing.field === "price" ? "price" : "stock_quantity"]: num, last_update: new Date().toISOString() }
            : r
        )
      );
      if (editing.field === "stock") await updateStock(editing.variantId, num);
      else                           await updatePrice(editing.variantId, num);
      setEditing(null);
    } catch (e: any) {
      setEditError(editing.field === "price" ? "Unable to update product price. Please try again." : "Unable to update stock. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => { setEditing(null); setEditValue(""); setEditError(""); };

  // ── Quick Edit modal ───────────────────────────────────────────────
  const [modal, setModal] = useState<{ item: InventoryItem; variantId: number } | null>(null);
  const [modalVals, setModalVals] = useState({ price: 0, stock: 0 });
  const [modalErrs, setModalErrs] = useState({ price: "", stock: "" });
  const [modalSaving, setModalSaving] = useState(false);

  const openModal = (item: InventoryItem, variantId: number) => {
    const v = item.variants.find((vv) => vv.variant_id === variantId)!;
    setModalVals({ price: v.price, stock: v.stock });
    setModalErrs({ price: "", stock: "" });
    setModal({ item, variantId });
  };

  const saveModal = async () => {
    if (!modal) return;
    const errs = { price: "", stock: "" };
    if (!Number.isInteger(modalVals.price) || modalVals.price <= 0) errs.price = "Price must be greater than 0.";
    if (modalVals.stock === null || modalVals.stock === undefined || isNaN(modalVals.stock)) errs.stock = "Stock quantity is required.";
    else if (!Number.isInteger(modalVals.stock) || modalVals.stock < 0) errs.stock = "Stock cannot be negative.";
    if (errs.price || errs.stock) { setModalErrs(errs); return; }

    setModalSaving(true);
    try {
      setLocalRows((prev) =>
        (prev || []).map((r) =>
          r.variant_id === modal.variantId
            ? { ...r, price: modalVals.price, stock_quantity: modalVals.stock, last_update: new Date().toISOString() }
            : r
        )
      );
      await updateStock(modal.variantId, modalVals.stock);
      await updatePrice(modal.variantId, modalVals.price);
      setModal(null);
    } catch (e: any) {
      setModalErrs((p) => ({ ...p, stock: e.message || "Unable to update. Please try again." }));
    } finally {
      setModalSaving(false);
    }
  };

  // ── Summary stats ──────────────────────────────────────────────────
  const allVariants   = inventory.flatMap((i) => i.variants);
  const totalSKUs     = allVariants.length;
  const lowStockCount = allVariants.filter((v) => v.stock > 0 && v.stock <= LOW_STOCK).length;
  const outOfStock    = allVariants.filter((v) => v.stock === 0).length;

  // ── EditableCell ───────────────────────────────────────────────────
  const EditableCell = ({ variantId, field, value }: { variantId: number; field: "price"|"stock"; value: number }) => {
    const isMe = editing?.variantId === variantId && editing?.field === field;
    if (isMe) return (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <input type="number" value={editValue}
            onChange={(e) => { setEditValue(e.target.value); setEditError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
            autoFocus disabled={saving}
            className="w-28 px-2 py-1 text-sm border-2 border-[#7C2D12] rounded-lg outline-none bg-white disabled:opacity-60"
          />
          <button onClick={commitEdit} disabled={saving}
            className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50">
            {saving ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
          </button>
          <button onClick={cancelEdit} disabled={saving} className="p-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300">
            <X className="w-3 h-3" />
          </button>
        </div>
        {editError && <p className="text-xs text-red-500">{editError}</p>}
      </div>
    );
    return (
      <button onClick={() => startEdit(variantId, field, value)}
        className="group flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors">
        <span className="text-sm text-gray-900">{field === "price" ? formatPrice(value) : value}</span>
        <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="w-8 h-8 border-4 border-[#7C2D12] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Loading inventory…</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">Click any price or stock value to edit inline</p>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Could not load inventory. Data may be stale.</span>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg font-medium transition-colors whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalSKUs}</div>
            <div className="text-sm text-gray-500">Total SKUs</div>
          </div>
        </div>
        <div className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 ${lowStockCount > 0 ? "border-amber-200" : "border-gray-100"}`}>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{lowStockCount}</div>
            <div className="text-sm text-gray-500">Low Stock Alerts</div>
          </div>
          {lowStockCount > 0 && <AlertTriangle className="w-4 h-4 text-amber-500 ml-auto" />}
        </div>
        <div className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 ${outOfStock > 0 ? "border-red-200" : "border-gray-100"}`}>
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{outOfStock}</div>
            <div className="text-sm text-gray-500">Out of Stock</div>
          </div>
          {outOfStock > 0 && <span className="ml-auto text-xs text-red-500 font-semibold">Restock!</span>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Weight</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Edit</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No inventory data
                </td></tr>
              ) : (
                inventory.map((item) =>
                  item.variants.map((v, vi) => {
                    const status = getStockStatus(v.stock);
                    return (
                      <tr key={v.variant_id}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          v.stock === 0 ? "bg-red-50/30" : v.stock <= LOW_STOCK ? "bg-amber-50/20" : ""
                        }`}>
                        {vi === 0 && (
                          <td className="px-5 py-3 align-top" rowSpan={item.variants.length}>
                            <div className="flex items-start gap-3">
                              <img src={item.image} alt={item.name}
                                className="w-10 h-10 object-cover rounded-xl flex-shrink-0 mt-0.5"
                                onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo.jpg"; }} />
                              <div>
                                <div className="font-medium text-sm text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{item.category}</div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  Updated: <span className="font-medium">{item.lastUpdated || "-"}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-gray-500">{v.sku}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{v.weight}</span>
                        </td>
                        <td className="px-4 py-3">
                          <EditableCell variantId={v.variant_id} field="price" value={v.price} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <EditableCell variantId={v.variant_id} field="stock" value={v.stock} />
                            {v.stock > 0 && v.stock <= LOW_STOCK && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${status.classes}`}>
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => openModal(item, v.variant_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7C2D12] border border-[#7C2D12]/30 rounded-lg hover:bg-[#7C2D12]/10 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {modal && (() => {
        const v = modal.item.variants.find((vv) => vv.variant_id === modal.variantId)!;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-bold text-gray-900">Quick Edit</h3>
                <button onClick={() => setModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                {modal.item.name} <span className="text-gray-400">— {v.weight}</span>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (VND)</label>
                  <input type="number" value={modalVals.price}
                    onChange={(e) => { setModalVals((p) => ({ ...p, price: parseInt(e.target.value)||0 })); setModalErrs((p) => ({ ...p, price: "" })); }}
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#7C2D12]/20 ${modalErrs.price ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#7C2D12]"}`}
                  />
                  {modalErrs.price ? <p className="text-xs text-red-500 mt-1">{modalErrs.price}</p>
                    : <p className="text-xs text-gray-400 mt-1">{formatPrice(modalVals.price)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity</label>
                  <input type="number" value={modalVals.stock}
                    onChange={(e) => { setModalVals((p) => ({ ...p, stock: parseInt(e.target.value)||0 })); setModalErrs((p) => ({ ...p, stock: "" })); }}
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#7C2D12]/20 ${modalErrs.stock ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#7C2D12]"}`}
                  />
                  {modalErrs.stock && <p className="text-xs text-red-500 mt-1">{modalErrs.stock}</p>}
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getStockStatus(modalVals.stock).classes}`}>
                      {getStockStatus(modalVals.stock).icon} {getStockStatus(modalVals.stock).label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={saveModal} disabled={modalSaving}
                  className="flex-1 py-3 bg-[#7C2D12] text-white rounded-xl font-medium hover:bg-[#6B2510] transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                  {modalSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {modalSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}