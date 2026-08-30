import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Category } from "../../domain/entities/Category";
import { FirestoreCategoryRepository } from "../../infrastructure/firebase/FirestoreCategoryRepository";
import {
  archiveCategory,
  createCategory,
  ensureDefaultCategories,
  removeDuplicateCategories,
} from "../../application/use-cases/manageCategories";
import { Icon, type IconName } from "../icons/Icon";
import { IconSelect, type IconSelectOption } from "../components/IconSelect";
import "./pages.css";

const repo = new FirestoreCategoryRepository();

const ICON_CHOICES: { icon: IconName; label: string }[] = [
  { icon: "food", label: "Comida" },
  { icon: "transport", label: "Transporte" },
  { icon: "fuel", label: "Combustible" },
  { icon: "entertainment", label: "Entretenimiento" },
  { icon: "health", label: "Salud" },
  { icon: "services", label: "Servicios" },
  { icon: "home", label: "Hogar" },
  { icon: "clothing", label: "Ropa" },
  { icon: "education", label: "Educación" },
  { icon: "other", label: "Otros" },
];

const COLOR_CHOICES = ["#E0663F", "#3F8CE0", "#D69A1F", "#9B24DE", "#3FAE6B", "#5B6EE0", "#D14F8C", "#8A7A99"];

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IconName>("other");
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [isFuel, setIsFuel] = useState(false);
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
    color,
  }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createCategory(repo, { name, icon, color, fieldsTemplate: isFuel ? "fuel" : null });
      setName("");
      setIsFuel(false);
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
        <p>Se cargó un set inicial. Puedes agregar las tuyas o archivar las que no uses.</p>
      </div>

      <div className="card">
        <h2>Nueva categoría</h2>
        <form className="inline-form" onSubmit={handleSubmit}>
          <label className="field">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Mascotas" required />
          </label>
          <label className="field">
            Ícono
            <IconSelect value={icon} onChange={(v) => setIcon(v as IconName)} options={iconOptions} />
          </label>
          <label className="field">
            Color
            <div className="color-swatch-picker">
              {COLOR_CHOICES.map((choice) => (
                <button
                  type="button"
                  key={choice}
                  className={`color-swatch-option${choice === color ? " is-selected" : ""}`}
                  style={{ background: choice }}
                  aria-label={choice}
                  onClick={() => setColor(choice)}
                />
              ))}
            </div>
          </label>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: "0.4rem" }}>
            <input type="checkbox" checked={isFuel} onChange={(e) => setIsFuel(e.target.checked)} style={{ minWidth: 0 }} />
            Pedir kilometraje y litros (combustible)
          </label>
          <button className="btn-primary" type="submit" disabled={saving}>
            <Icon name="add" size={16} />
            Agregar
          </button>
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
                {!category.isDefault && <button onClick={() => archiveCategory(repo, category.id)}>Archivar</button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
