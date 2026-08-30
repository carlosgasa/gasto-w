import type { Category, NewCategory } from "../entities/Category";

export interface CategoryRepository {
  list(): Promise<Category[]>;
  subscribe(onChange: (categories: Category[]) => void): () => void;
  create(category: NewCategory): Promise<string>;
  update(id: string, patch: Partial<NewCategory>): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
  ensureDefaults(defaults: NewCategory[]): Promise<void>;
}
