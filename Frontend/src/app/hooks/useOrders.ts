import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";

export function useOrders() {
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<any>("/api/orders")
      .then((res) => {
        // Backend trả về { orders: [...], total, statusCounts }
        // KHÔNG phải array thẳng
        const raw: any[] = Array.isArray(res) ? res : (res?.orders ?? []);

        const mapped = raw.map((o: any) => ({
          ...o,
          id:            o.id || o.order_code || `ALE-ORDER-${String(o.order_id).padStart(3, "0")}`,
          customer:      o.customer      || o.recipient_name || o.full_name || "",
          phone:         o.phone         || o.recipient_phone || "",
          email:         o.email         || "",
          address:       o.address       || "",
          date:          o.date          || (o.order_date ? String(o.order_date).split("T")[0] : ""),
          total:         Number(o.total  || o.total_amount   || 0),
          // Backend trả status Title Case ("Pending") → lowercase cho frontend
          status:        (o.status || "pending").toLowerCase(),
          paymentMethod: (o.paymentMethod || o.payment_method || "cod").toLowerCase(),
          paymentStatus: (o.paymentStatus || o.payment_status || "pending").toLowerCase(),
          items: (o.items || []).map((i: any) => ({
            name:   i.name     || i.product_name || "",
            qty:    i.qty      || i.quantity     || 1,
            price:  Number(i.price)              || 0,
            weight: i.weight                     || "",
          })),
        }));
        setOrders(mapped);
      })
      .catch((e) => {
        setError(e.message);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id: number, status: string) => {
    await apiFetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setOrders((prev) =>
      prev.map((o) =>
        o.order_id === id || o.id === `ALE-ORDER-${String(id).padStart(3, "0")}`
          ? { ...o, status: status.toLowerCase() }
          : o
      )
    );
  };

  return { orders, loading, error, updateStatus, setOrders, refetch: fetchOrders };
}