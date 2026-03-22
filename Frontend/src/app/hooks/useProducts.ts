import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { Product } from "../data/products";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    apiFetch<any[]>("/api/products")
      .then((data) => {
        const mapped: Product[] = data.map((p) => {
          const variants = (p.variants || []).map((v: any) => ({
            weight: v.weight,
            price:  Number(v.price),
            stock:  Number(v.stock_quantity) || 0,
          }));
          const basePrice = variants.length > 0 ? variants[0].price : 0;
          const isCombo = !!(p.isCombo || (p.comboItems && p.comboItems.length > 0));
          return {
            id:              String(p.product_id),
            name:            p.product_name,
            description:     p.description || "",
            longDescription: p.description || "",
            image:           `/images/${p.image_url}`,
            images:          [`/images/${p.image_url}`],
            category:        mapCategory(p.product_name),
            basePrice,
            variants,
            tags:            isCombo ? ["combo"] : [],
            rating:          Number(p.rating) || 4.8,
            reviews:         Number(p.reviews) || 0,
            preparationTime: p.preparation_time || "",
            certifications:  ["VSATTP Certified"],
            featured:        p.featured === 1,
            isCombo,
            comboItems: (p.comboItems || []).map((c: any) => ({
              id:          String(c.combo_item_id),
              name:        c.item_name,
              description: c.description || "",
              price:       Number(c.price) || 0,
              weight:      c.weight || "100g",
              image:       c.image_url
                ? `/images/${c.image_url}`
                : `/images/${p.image_url}`,
            })),
          };
        });
        setProducts(mapped);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}

function mapCategory(name: string): Product["category"] {
  const n = name?.toLowerCase() || "";
  if (n.includes("trâu") || n.includes("gác bếp")) return "buffalo";
  if (n.includes("lợn") || n.includes("ba chỉ") || n.includes("lạp xưởng")) return "pork";
  if (n.includes("gà") || n.includes("vịt") || n.includes("gia cầm")) return "poultry";
  return "sausage";
}