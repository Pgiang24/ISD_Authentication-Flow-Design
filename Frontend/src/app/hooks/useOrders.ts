import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

export function useOrders() {
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    apiFetch<any[]>("/api/orders")
      .then((data) => {
        // Map field MySQL → field frontend dùng
        const mapped = data.map((o: any) => ({
          ...o,
          id:            `ALE-ORDER-${String(o.order_id).padStart(3, "0")}`,
          customer:      o.customer      || o.full_name      || "",
          phone:         o.phone         || "",
          email:         o.email         || "",
          address:       o.address       || "",
          date:          o.order_date
                           ? String(o.order_date).split("T")[0]
                           : "",
          total:         Number(o.total_amount) || 0,
          status:        o.status        || "pending",
          paymentMethod: o.payment_method || "cod",
          paymentStatus: o.payment_status || "pending",
          items:         (o.items || []).map((i: any) => ({
            name:   i.name     || i.product_name || "",
            qty:    i.qty      || i.quantity     || 1,
            price:  Number(i.price)              || 0,
            weight: i.weight                     || "",
          })),
        }));
        setOrders(mapped);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await apiFetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    // Cập nhật local state sau khi API thành công
    setOrders((prev) =>
      prev.map((o) =>
        o.order_id === id || o.id === `ALE-ORDER-${String(id).padStart(3, "0")}`
          ? { ...o, status }
          : o
      )
    );
  };

  return { orders, loading, error, updateStatus, setOrders };
}