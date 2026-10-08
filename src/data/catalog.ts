import type { Category } from "../types";

export const CITIES = ["Buea", "Douala", "Yaoundé", "Limbe", "Bamenda", "Kumba", "Bafoussam", "Kribi", "Garoua", "Maroua"] as const;

/** Normalize for CATEGORY#CITY search keys. Confirm exact backend normalization when wiring search. */
export const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/\s+/g, "_");
export const searchKey = (category: string, city: string) => `${normalize(category)}#${normalize(city)}`;

/** Used only when the categories API is unreachable. */
export const DEFAULT_CATEGORIES: Category[] = ["Plumbing", "Electrical", "Carpentry", "Tutoring", "Mechanics", "Cleaning", "Painting", "Phone Repair", "Computer Repair"].map((name) => ({ id: normalize(name), name }));
