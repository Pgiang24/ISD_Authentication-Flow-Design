// src/hooks/useProductLang.ts
// Hook trả về helper function để lấy đúng field ngôn ngữ từ product
// Dùng: const { pName, pDesc, pLongDesc } = useProductLang(product)

import { useTranslation } from "react-i18next";
import type { Product } from "../data/products";

export function useProductLang(product: Product | null) {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  if (!product) return { pName: "", pDesc: "", pLongDesc: "" };

  return {
    pName:     isEn ? ((product as any).nameEn     || product.name)            : product.name,
    pDesc:     isEn ? ((product as any).descriptionEn || product.description)  : product.description,
    pLongDesc: isEn ? ((product as any).longDescriptionEn || (product as any).descriptionEn || product.longDescription || product.description)
                    : (product.longDescription || product.description),
  };
}

// Overload cho trường hợp không có product object (dùng riêng lẻ từng field)
export function useLangField(vi: string, en: string): string {
  const { i18n } = useTranslation();
  return i18n.language === "en" ? (en || vi) : vi;
}