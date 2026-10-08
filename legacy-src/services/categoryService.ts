import { apiRequest } from "./api";
import { DEFAULT_CATEGORIES, normalize } from "../data/catalog";
import type { Category } from "../types";

type RawCategory = { category_id?: string; id?: string; name: string };
export type CategoryResult = { categories: Category[]; source: "api" | "fallback" };

/** Single source for category dropdowns. GET /service-categories (public). */
export async function listCategories(): Promise<CategoryResult> {
  try {
    const res = await apiRequest<{ categories?: RawCategory[] }>("/service-categories");
    const categories = (res.categories ?? []).map((c) => ({ id: String(c.category_id ?? c.id ?? normalize(c.name)), name: c.name }));
    return categories.length ? { categories, source: "api" } : { categories: DEFAULT_CATEGORIES, source: "fallback" };
  } catch {
    return { categories: DEFAULT_CATEGORIES, source: "fallback" };
  }
}
