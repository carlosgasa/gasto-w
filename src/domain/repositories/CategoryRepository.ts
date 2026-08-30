import type { Category, NewCategory } from "../entities/Category";

export interface SeedCategory extends NewCategory {
  /** ID determinístico (no autogenerado) para que sembrar sea idempotente. */
  seedId: string;
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
  subscribe(onChange: (categories: Category[]) => void): () => void;
  create(category: NewCategory): Promise<string>;
  update(id: string, patch: Partial<NewCategory>): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
  remove(id: string): Promise<void>;
  ensureDefaults(defaults: SeedCategory[]): Promise<void>;
}
