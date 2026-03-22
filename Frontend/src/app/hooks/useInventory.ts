import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

export function useInventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    apiFetch<any[]>("/api/inventory")
      .then(setInventory)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const updateStock = async (productId: number, stock: number) => {
    await apiFetch(`/api/inventory/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ stock }),
    });
    setInventory((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, stock_quantity: stock }
          : item
      )
    );
  };

  return { inventory, loading, error, updateStock };
}