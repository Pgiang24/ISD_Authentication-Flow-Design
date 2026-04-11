import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";

export function useInventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchInventory = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<any[]>("/api/inventory")
      .then((data) => setInventory(Array.isArray(data) ? data : []))
      .catch((e) => { setError(e.message); setInventory([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Backend: PATCH /api/inventory/:variantId/stock
  // variantId nằm trong row của v_inventory_summary
  const updateStock = async (variantId: number, stock: number) => {
    const res = await apiFetch<any>(`/api/inventory/${variantId}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stock }),
    });
    // Cập nhật local state với data mới từ server
    setInventory((prev) =>
      prev.map((item) =>
        item.variant_id === variantId
          ? { ...item, stock_quantity: stock, last_update: new Date().toISOString() }
          : item
      )
    );
    return res;
  };

  // Backend: PATCH /api/inventory/:variantId/price
  const updatePrice = async (variantId: number, price: number) => {
    const res = await apiFetch<any>(`/api/inventory/${variantId}/price`, {
      method: "PATCH",
      body: JSON.stringify({ price }),
    });
    setInventory((prev) =>
      prev.map((item) =>
        item.variant_id === variantId
          ? { ...item, price, last_update: new Date().toISOString() }
          : item
      )
    );
    return res;
  };

  return { inventory, loading, error, updateStock, updatePrice, refetch: fetchInventory };
}