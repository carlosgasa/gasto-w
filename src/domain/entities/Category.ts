export type CategoryFieldsTemplate = "fuel" | null;

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  active: boolean;
  fieldsTemplate: CategoryFieldsTemplate;
  createdAt: number;
}

export type NewCategory = Omit<Category, "id" | "createdAt">;
