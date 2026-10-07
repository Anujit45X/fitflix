export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS";
export type Role = "USER" | "ADMIN" | "PRODUCT_MANAGER";
export interface Account {
  id: string;
  name: string;
  email: string;
  role: Role;
  demo: boolean;
}
export interface Food {
  id: number;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  servingGrams: number;
  source: string;
  sourceId: string | null;
  ownerId: string | null;
}
export interface MealItem {
  id: string;
  foodId: number;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  incomplete: boolean;
}
export interface Meal {
  id: string;
  date: string;
  mealType: MealType;
  items: MealItem[];
}
export interface FoodPage {
  content: Food[];
  totalElements: number;
  totalPages: number;
}
