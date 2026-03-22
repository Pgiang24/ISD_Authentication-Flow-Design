import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { Product } from "../data/products";

export function useProduct(id: string | undefined) {
  const [product, setProduct]  = useState<Product | null>(null);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }

    apiFetch<any>(`/api/products/${id}`)
      .then((p) => {
        console.log("API response:", p);

        const variants = (p.variants || []).map((v: any) => ({
          weight: v.weight,
          price:  Number(v.price),
          stock:  Number(v.stock_quantity) || 0,
        }));

        const isCombo = !!(p.isCombo || (p.comboItems && p.comboItems.length > 0));

        setProduct({
          id:              String(p.product_id),
          name:            p.product_name,
          description:     p.description     || "",
          longDescription: p.description     || "",
          image:           `/images/${p.image_url}`,
          images:          [`/images/${p.image_url}`],
          category:        "pork" as const,
          basePrice:       variants[0]?.price || 0,
          variants,
          tags:            isCombo ? ["combo"] : [],
          rating:          Number(p.rating)   || 4.8,
          reviews:         Number(p.reviews)  || 0,
          preparationTime: p.preparation_time || "",
          certifications:  ["VSATTP Certified"],
          featured:        p.featured === 1,
          isCombo,
          comboItems: (p.comboItems || []).map((c: any) => ({
            id:          String(c.combo_item_id),
            name:        c.item_name,
            description: c.description || "",
            price:       Number(c.price) || 0,
            weight:      c.weight       || "",
            image:       c.image_url
              ? `/images/${c.image_url}`
              : `/images/${p.image_url}`,
          })),
        });
      })
      .catch((e) => {
        console.error("API error:", e.message);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { product, loading, error };
}