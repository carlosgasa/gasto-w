import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Category } from "../../domain/entities/Category";
import { FirestoreCategoryRepository } from "../../infrastructure/firebase/FirestoreCategoryRepository";
import {
  archiveCategory,
  createCategory,
  ensureDefaultCategories,
  removeDuplicateCategories,
  updateCategory,
} from "../../application/use-cases/manageCategories";
import { Icon, type IconName } from "../icons/Icon";
import { IconSelect, type IconSelectOption } from "../components/IconSelect";
import "./pages.css";

const repo = new FirestoreCategoryRepository();

const ICON_CHOICES: { icon: IconName; label: string }[] = [
  { icon: "food", label: "Comida" },
  { icon: "delivery", label: "Comida a domicilio" },
  { icon: "transport", label: "Transporte" },
  { icon: "fuel", label: "Combustible" },
  { icon: "entertainment", label: "Entretenimiento" },
  { icon: "health", label: "Salud" },
  { icon: "services", label: "Servicios" },
  { icon: "home", label: "Hogar" },
  { icon: "furniture", label: "Muebles" },
  { icon: "construction", label: "Construcción" },
  { icon: "clothing", label: "Ropa" },
  { icon: "education", label: "Educación" },
  { icon: "school", label: "Escuela" },
  { icon: "business", label: "Negocios" },
  { icon: "loans", label: "Préstamos" },
  { icon: "travel", label: "Viajes" },
  { icon: "pets", label: "Mascotas" },
  { icon: "gifts", label: "Regalos" },
  { icon: "other", label: "Otros" },
];

const COLOR_CHOICES = [
  "#E0663F",
  "#D14F8C",
  "#D69A1F",
  "#C9863F",
  "#3FAE6B",
  "#3FA5B0",
  "#3F8CE0",
  "#5B6EE0",
  "#9B24DE",
  "#B33BF2",
  "#7A5AF8",
  "#5B1594",
  "#B0473F",
  "#7A4B2E",
  "#4A7A3F",
  "#8A7A99",
];

const emptyForm = { name: "", icon: "other" as IconName, color: COLOR_CHOICES[0], isFuel: false };

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    ensureDefaultCategories(repo);
    return repo.subscribe(setCategories);
  }, []);

  const active = useMemo(() => categories.filter((c) => c.active), [categories]);

  const duplicateCount = useMemo(() => {
    const seen = new Map<string, number>();
    for (const c of active) {
      const key = c.name.trim().toLowerCase();
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return [...seen.values()].reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0);
  }, [active]);

  const iconOptions: IconSelectOption[] = ICON_CHOICES.map((c) => ({
    value: c.icon,
    label: c.label,
    icon: c.icon,
    color: form.color,
  }));

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function loadForEdit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      icon: category.icon as IconName,
      color: category.color,
      isFuel: category.fieldsTemplate === "fuel",
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        icon: form.icon,
        color: form.color,
        fieldsTemplate: form.isFuel ? ("fuel" as const) : null,
      };
      if (editingId) {
        await updateCategory(repo, editingId, payload);
      } else {
        await createCategory(repo, payload);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveDuplicates() {
    setCleaning(true);
    try {
      await removeDuplicateCategories(repo, categories);
    } finally {
      setCleaning(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Categorías</h1>
        <p>Se cargó un set inicial. Puedes agregar las tuyas, editarlas o archivar las que no uses.</p>
      </div>

      <div className="card">
        <h2>{editingId ? "Editar categoría" : "Nueva categoría"}</h2>
        <form className="inline-form" onSubmit={handleSubmit}>
          <label className="field">
            Nombre
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ej. Mascotas"
              required
            />
          </label>
          <label className="field">
            Ícono
            <IconSelect value={form.icon} onChange={(v) => setForm({ ...form, icon: v as IconName })} options={iconOptions} />
          </label>
          <label className="field">
            Color
            <div className="color-swatch-picker">
              {COLOR_CHOICES.map((choice) => (
                <button
                  type="button"
                  key={choice}
                  className={`color-swatch-option${choice === form.color ? " is-selected" : ""}`}
                  style={{ background: choice }}
                  aria-label={choice}
                  onClick={() => setForm({ ...form, color: choice })}
                />
              ))}
            </div>
          </label>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: "0.4rem" }}>
            <input
              type="checkbox"
              checked={form.isFuel}
              onChange={(e) => setForm({ ...form, isFuel: e.target.checked })}
              style={{ minWidth: 0 }}
            />
            Pedir kilometraje y litros (combustible)
          </label>
          <div className="expense-form-actions">
            <button className="btn-primary" type="submit" disabled={saving}>
              <Icon name="add" size={16} />
              {editingId ? "Guardar cambios" : "Agregar"}
            </button>
            {editingId && (
              <button type="button" className="btn-ghost" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="list-header">
          <h2>Tus categorías</h2>
          {duplicateCount > 0 && (
            <button className="btn-ghost" onClick={handleRemoveDuplicates} disabled={cleaning}>
              Quitar {duplicateCount} duplicado{duplicateCount === 1 ? "" : "s"}
            </button>
          )}
        </div>
        {active.length === 0 ? (
          <p className="empty-hint">Cargando categorías…</p>
        ) : (
          <div className="entity-list">
            {active.map((category) => (
              <div className="entity-row" key={category.id}>
                <div className="entity-swatch" style={{ background: category.color }}>
                  <Icon name={category.icon as IconName} size={17} />
                </div>
                <span className="entity-name">{category.name}</span>
                {category.fieldsTemplate === "fuel" && <span className="entity-meta">combustible</span>}
                <button onClick={() => loadForEdit(category)}>Editar</button>
                {!category.isDefault && <button onClick={() => archiveCategory(repo, category.id)}>Archivar</button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
