import { useState } from "react";
import { Edit2, Check, X, AlertTriangle, TrendingDown, Package } from "lucide-react";
import { formatPrice } from "../../data/products";
import { useInventory } from "../../hooks/useInventory";

interface InventoryVariant {
  weight: string;
  price: number;
  stock: number;
  sku: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  image: string;
  lastUpdated: string;
  variants: InventoryVariant[];
}

interface EditingCell {
  productId: string;
  variantIndex: number;
  field: "price" | "stock";
}

const LOW_STOCK_THRESHOLD = 5;

export default function InventoryPage() {
  const { inventory: rawInventory, loading, updateStock } = useInventory();
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [quickEditModal, setQuickEditModal] = useState<{ item: InventoryItem; variantIdx: number } | null>(null);
  const [modalValues, setModalValues] = useState({ price: 0, stock: 0 });
  const [localInventory, setLocalInventory] = useState<InventoryItem[] | null>(null);

  // Map raw API data sang InventoryItem[]
  const inventory: InventoryItem[] = localInventory ?? rawInventory.reduce((acc: InventoryItem[], item: any) => {
    const existing = acc.find((i) => i.id === String(item.product_id));
    if (existing) {
      existing.variants.push({
        weight:  item.weight,
        price:   Number(item.price),
        stock:   Number(item.stock_quantity),
        sku:     `P${item.product_id}-${item.weight}`,
      });
    } else {
      acc.push({
        id:          String(item.product_id),
        name:        item.name,
        category:    item.category || "Sản phẩm",
        image:       `/images/${item.image}`,
        lastUpdated: item.last_update?.split("T")[0] || new Date().toISOString().split("T")[0],
        variants: [{
          weight:  item.weight,
          price:   Number(item.price),
          stock:   Number(item.stock_quantity),
          sku:     `P${item.product_id}-${item.weight}`,
        }],
      });
    }
    return acc;
  }, []);

  // Khi raw data load xong, set localInventory để có thể edit
  if (rawInventory.length > 0 && localInventory === null) {
    const mapped: InventoryItem[] = rawInventory.reduce((acc: InventoryItem[], item: any) => {
      const existing = acc.find((i) => i.id === String(item.product_id));
      if (existing) {
        existing.variants.push({
          weight:  item.weight,
          price:   Number(item.price),
          stock:   Number(item.stock_quantity),
          sku:     `P${item.product_id}-${item.weight}`,
        });
      } else {
        acc.push({
          id:          String(item.product_id),
          name:        item.name,
          category:    item.category || "Sản phẩm",
          image:       `/images/${item.image}`,
          lastUpdated: item.last_update?.split("T")[0] || new Date().toISOString().split("T")[0],
          variants: [{
            weight:  item.weight,
            price:   Number(item.price),
            stock:   Number(item.stock_quantity),
            sku:     `P${item.product_id}-${item.weight}`,
          }],
        });
      }
      return acc;
    }, []);
    setLocalInventory(mapped);
  }

  const lowStockItems  = inventory.flatMap((i) => i.variants.filter((v) => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD)).length;
  const outOfStockItems = inventory.flatMap((i) => i.variants.filter((v) => v.stock === 0)).length;
  const totalVariants  = inventory.flatMap((i) => i.variants).length;

  const startEdit = (productId: string, variantIndex: number, field: "price" | "stock", currentValue: number) => {
    setEditing({ productId, variantIndex, field });
    setEditValue(currentValue.toString());
  };

  const commitEdit = async () => {
    if (!editing) return;
    const numVal = parseInt(editValue);
    if (isNaN(numVal) || numVal < 0) { cancelEdit(); return; }

    setLocalInventory((prev) =>
      (prev || []).map((item) =>
        item.id === editing.productId
          ? {
              ...item,
              variants: item.variants.map((v, i) =>
                i === editing.variantIndex ? { ...v, [editing.field]: numVal } : v
              ),
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : item
      )
    );

    // Lưu stock vào DB
    if (editing.field === "stock") {
      await updateStock(Number(editing.productId), numVal);
    }

    setEditing(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const openModal = (item: InventoryItem, variantIdx: number) => {
    const v = item.variants[variantIdx];
    setModalValues({ price: v.price, stock: v.stock });
    setQuickEditModal({ item, variantIdx });
  };

  const saveModal = async () => {
    if (!quickEditModal) return;
    setLocalInventory((prev) =>
      (prev || []).map((item) =>
        item.id === quickEditModal.item.id
          ? {
              ...item,
              variants: item.variants.map((v, i) =>
                i === quickEditModal.variantIdx ? { ...v, ...modalValues } : v
              ),
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : item
      )
    );
    // Lưu stock vào DB
    await updateStock(Number(quickEditModal.item.id), modalValues.stock);
    setQuickEditModal(null);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0)                    return { label: "Out of Stock", classes: "bg-red-100 text-red-700 border-red-200",    icon: "🔴" };
    if (stock <= LOW_STOCK_THRESHOLD)   return { label: "Low Stock",    classes: "bg-amber-100 text-amber-700 border-amber-200", icon: "🟡" };
    return                                     { label: "In Stock",     classes: "bg-green-100 text-green-700 border-green-200", icon: "🟢" };
  };

  const EditableCell = ({
    productId, variantIndex, field, value,
  }: {
    productId: string; variantIndex: number; field: "price" | "stock"; value: number;
  }) => {
    const isEditing = editing?.productId === productId && editing?.variantIndex === variantIndex && editing?.field === field;
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
            autoFocus
            className="w-24 px-2 py-1 text-sm border-2 border-[#7C2D12] rounded-lg outline-none bg-white"
          />
          <button onClick={commitEdit} className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600">
            <Check className="w-3 h-3" />
          </button>
          <button onClick={cancelEdit} className="p-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300">
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => startEdit(productId, variantIndex, field, value)}
        className="group flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
      >
        <span className="text-sm text-gray-900">
          {field === "price" ? formatPrice(value) : value}
        </span>
        <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-[#7C2D12] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
        <p className="text-sm text-gray-500">Click on any price or stock value to edit inline</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalVariants}</div>
            <div className="text-sm text-gray-500">Total SKUs</div>
          </div>
        </div>
        <div className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 ${lowStockItems > 0 ? "border-amber-200" : "border-gray-100"}`}>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{lowStockItems}</div>
            <div className="text-sm text-gray-500">Low Stock Alerts</div>
          </div>
          {lowStockItems > 0 && <AlertTriangle className="w-4 h-4 text-amber-500 ml-auto" />}
        </div>
        <div className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 ${outOfStockItems > 0 ? "border-red-200" : "border-gray-100"}`}>
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{outOfStockItems}</div>
            <div className="text-sm text-gray-500">Out of Stock</div>
          </div>
          {outOfStockItems > 0 && <span className="ml-auto text-xs text-red-500 font-medium">Restock!</span>}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Weight</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price (click to edit)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock (click to edit)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Edit</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">Không có dữ liệu tồn kho</td>
                </tr>
              ) : (
                inventory.map((item) =>
                  item.variants.map((variant, vi) => {
                    const status = getStockStatus(variant.stock);
                    return (
                      <tr
                        key={`${item.id}-${vi}`}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          variant.stock === 0 ? "bg-red-50/30" : variant.stock <= LOW_STOCK_THRESHOLD ? "bg-amber-50/30" : ""
                        }`}
                      >
                        {vi === 0 && (
                          <td className="px-5 py-3" rowSpan={item.variants.length}>
                            <div className="flex items-center gap-3">
                              <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-xl flex-shrink-0" />
                              <div>
                                <div className="font-medium text-sm text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-500">{item.category}</div>
                                <div className="text-xs text-gray-400 mt-0.5">Updated: {item.lastUpdated}</div>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-gray-500">{variant.sku}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{variant.weight}</span>
                        </td>
                        <td className="px-4 py-3">
                          <EditableCell productId={item.id} variantIndex={vi} field="price" value={variant.price} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <EditableCell productId={item.id} variantIndex={vi} field="stock" value={variant.stock} />
                            {variant.stock <= LOW_STOCK_THRESHOLD && variant.stock > 0 && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${status.classes}`}>
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openModal(item, vi)}
                            className="p-1.5 text-[#7C2D12] hover:bg-[#7C2D12]/10 rounded-lg transition-colors"
                            title="Quick edit"
                          >
                            <Edit2 className="w-4 h-4" />
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
      {quickEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setQuickEditModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-1">Quick Edit</h3>
            <p className="text-sm text-gray-500 mb-5">
              {quickEditModal.item.name} — {quickEditModal.item.variants[quickEditModal.variantIdx].weight}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (VND)</label>
                <input
                  type="number"
                  value={modalValues.price}
                  onChange={(e) => setModalValues((v) => ({ ...v, price: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20"
                />
                <div className="text-xs text-gray-400 mt-1">{formatPrice(modalValues.price)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity</label>
                <input
                  type="number"
                  value={modalValues.stock}
                  onChange={(e) => setModalValues((v) => ({ ...v, stock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#7C2D12] focus:ring-2 focus:ring-[#7C2D12]/20"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setQuickEditModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveModal} className="flex-1 py-3 bg-[#7C2D12] text-white rounded-xl font-medium hover:bg-[#6B2510] transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}