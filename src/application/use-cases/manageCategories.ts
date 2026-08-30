import type { CategoryRepository } from "../../domain/repositories/CategoryRepository";
import type { NewCategory } from "../../domain/entities/Category";

export const DEFAULT_CATEGORIES: NewCategory[] = [
  { name: "Comida", color: "#E0663F", icon: "food", isDefault: true, active: true, fieldsTemplate: null },
  { name: "Transporte", color: "#3F8CE0", icon: "transport", isDefault: true, active: true, fieldsTemplate: null },
  { name: "Gasolina", color: "#D69A1F", icon: "fuel", isDefault: true, active: true, fieldsTemplate: "fuel" },
  { name: "Entretenimiento", color: "#9B24DE", icon: "entertainment", isDefault: true, active: true, fieldsTemplate: null },
  { name: "Salud", color: "#3FAE6B", icon: "health", isDefault: true, active: true, fieldsTemplate: null },
  { name: "Servicios", color: "#5B6EE0", icon: "services", isDefault: true, active: true, fieldsTemplate: null },
  { name: "Hogar", color: "#C9863F", icon: "home", isDefault: true, active: true, fieldsTemplate: null },
  { name: "Ropa", color: "#D14F8C", icon: "clothing", isDefault: true, active: true, fieldsTemplate: null },
  { name: "Educación", color: "#3FA5B0", icon: "education", isDefault: true, active: true, fieldsTemplate: null },
  { name: "Otros", color: "#8A7A99", icon: "other", isDefault: true, active: true, fieldsTemplate: null },
];

export async function ensureDefaultCategories(repo: CategoryRepository): Promise<void> {
  await repo.ensureDefaults(DEFAULT_CATEGORIES);
}

export async function createCategory(
  repo: CategoryRepository,
  input: Pick<NewCategory, "name" | "color" | "icon" | "fieldsTemplate">,
): Promise<string> {
  const name = input.name.trim();
  if (!name) throw new Error("El nombre de la categoría no puede estar vacío.");

  return repo.create({ ...input, name, isDefault: false, active: true });
}

export async function archiveCategory(repo: CategoryRepository, id: string): Promise<void> {
  await repo.setActive(id, false);
}
