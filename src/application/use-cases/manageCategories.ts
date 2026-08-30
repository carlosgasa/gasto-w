import type { CategoryRepository, SeedCategory } from "../../domain/repositories/CategoryRepository";
import type { Category, NewCategory } from "../../domain/entities/Category";

export const DEFAULT_CATEGORIES: SeedCategory[] = [
  { seedId: "comida", name: "Comida", color: "#E0663F", icon: "food", isDefault: true, active: true, fieldsTemplate: null },
  { seedId: "transporte", name: "Transporte", color: "#3F8CE0", icon: "transport", isDefault: true, active: true, fieldsTemplate: null },
  { seedId: "gasolina", name: "Gasolina", color: "#D69A1F", icon: "fuel", isDefault: true, active: true, fieldsTemplate: "fuel" },
  { seedId: "entretenimiento", name: "Entretenimiento", color: "#9B24DE", icon: "entertainment", isDefault: true, active: true, fieldsTemplate: null },
  { seedId: "salud", name: "Salud", color: "#3FAE6B", icon: "health", isDefault: true, active: true, fieldsTemplate: null },
  { seedId: "servicios", name: "Servicios", color: "#5B6EE0", icon: "services", isDefault: true, active: true, fieldsTemplate: null },
  { seedId: "hogar", name: "Hogar", color: "#C9863F", icon: "home", isDefault: true, active: true, fieldsTemplate: null },
  { seedId: "ropa", name: "Ropa", color: "#D14F8C", icon: "clothing", isDefault: true, active: true, fieldsTemplate: null },
  { seedId: "educacion", name: "Educación", color: "#3FA5B0", icon: "education", isDefault: true, active: true, fieldsTemplate: null },
  { seedId: "otros", name: "Otros", color: "#8A7A99", icon: "other", isDefault: true, active: true, fieldsTemplate: null },
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

/**
 * Archiva duplicados exactos (mismo nombre, sin distinguir mayúsculas) entre
 * las categorías ACTIVAS, dejando una sola visible por nombre. Archiva en vez
 * de borrar a propósito: si ya registraste un gasto con la categoría
 * duplicada, ese gasto no se rompe (categoryId sigue existiendo), solo deja
 * de aparecer en los selectores y en la lista.
 *
 * Prefiere conservar la que tiene ID determinístico ("default-...") si existe
 * en el grupo, porque es la que las futuras siembras de categorías por
 * default van a seguir reconociendo.
 */
export async function removeDuplicateCategories(
  repo: CategoryRepository,
  categories: Category[],
): Promise<number> {
  const groups = new Map<string, Category[]>();
  for (const category of categories) {
    if (!category.active) continue;
    const key = category.name.trim().toLowerCase();
    const group = groups.get(key) ?? [];
    group.push(category);
    groups.set(key, group);
  }

  const toArchive: Category[] = [];
  for (const group of groups.values()) {
    if (group.length <= 1) continue;

    const preferred =
      group.find((c) => c.id.startsWith("default-")) ??
      [...group].sort((a, b) => a.createdAt - b.createdAt)[0];

    for (const category of group) {
      if (category.id !== preferred.id) toArchive.push(category);
    }
  }

  for (const category of toArchive) {
    await repo.setActive(category.id, false);
  }

  return toArchive.length;
}
