import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { Product } from "../data/products";

export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }

    apiFetch<any>(`/api/products/${id}`)
      .then((p) => {
        const variants = (p.variants || []).map((v: any) => ({
          weight: v.weight,
          price:  Number(v.price),
          stock:  Number(v.stock_quantity) || 0,
        }));

        const isCombo = !!(p.isCombo || (p.comboItems && p.comboItems.length > 0));

        setProduct({
          id:                 String(p.product_id),
          name:               p.product_name,
          nameEn:             p.name_en             || p.product_name,
          description:        p.description         || "",
          descriptionEn:      p.description_en      || p.description || "",
          longDescription:    p.long_description    || p.description || "",
          longDescriptionEn:  p.long_description_en || p.description_en || p.description || "",
          image:              `/images/${p.image_url}`,
          images:             [`/images/${p.image_url}`],
          category:           mapCategory(p.product_name),
          basePrice:          variants[0]?.price || 0,
          variants,
          tags:               isCombo ? ["combo"] : [],
          rating:             Number(p.rating)  || 4.8,
          reviews:            Number(p.reviews) || 0,
          preparationTime:    p.preparation_time || "",
          certifications:     ["VSATTP Certified"],
          featured:           p.featured === 1,
          isCombo,
          comboItems: (p.comboItems || []).map((c: any) => ({
            id:             String(c.combo_item_id),
            name:           c.item_name,
            nameEn:         c.item_name_en   || c.item_name,
            description:    c.description    || "",
            descriptionEn:  c.description_en || c.description || "",
            price:          Number(c.price)  || 0,
            weight:         c.weight         || "",
            image:          c.image_url
              ? `/images/${c.image_url}`
              : `/images/${p.image_url}`,
          })),
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { product, loading, error };
}

function mapCategory(name: string): Product["category"] {
  const n = name?.toLowerCase() || "";
  if (n.includes("trâu") || n.includes("gác bếp")) return "buffalo";
  if (n.includes("lợn") || n.includes("ba chỉ") || n.includes("lạp xưởng")) return "pork";
  if (n.includes("gà") || n.includes("vịt") || n.includes("gia cầm")) return "poultry";
  return "sausage";
}