import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Account } from "../../domain/entities/Account";
import type { Category } from "../../domain/entities/Category";
import type { RecurringTemplate } from "../../domain/entities/RecurringTemplate";
import { FirestoreAccountRepository } from "../../infrastructure/firebase/FirestoreAccountRepository";
import { FirestoreCategoryRepository } from "../../infrastructure/firebase/FirestoreCategoryRepository";
import { FirestoreRecurringTemplateRepository } from "../../infrastructure/firebase/FirestoreRecurringTemplateRepository";
import { archiveRecurringTemplate, createRecurringTemplate } from "../../application/use-cases/manageRecurring";
import { Icon, type IconName } from "../icons/Icon";
import { formatMoney } from "../format";
import "./pages.css";

const accountRepo = new FirestoreAccountRepository();
const categoryRepo = new FirestoreCategoryRepository();
const templateRepo = new FirestoreRecurringTemplateRepository();

const today = () => new Date().toISOString().slice(0, 10);

export function RecurringPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => accountRepo.subscribe(setAccounts), []);
  useEffect(() => categoryRepo.subscribe(setCategories), []);
  useEffect(() => templateRepo.subscribe(setTemplates), []);

  const activeAccounts = useMemo(() => accounts.filter((a) => a.active), [accounts]);
  const activeCategories = useMemo(() => categories.filter((c) => c.active), [categories]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const active = useMemo(() => templates.filter((t) => t.active), [templates]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createRecurringTemplate(templateRepo, {
        name,
        amount: Number(amount),
        accountId,
        categoryId,
        dayOfMonth: Number(dayOfMonth),
        startDate: today(),
        endDate: null,
      });
      setName("");
      setAmount("");
      setDayOfMonth("1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Recurrentes</h1>
        <p>Gastos fijos mensuales (renta, suscripciones). Se registran solos cada mes al abrir la app.</p>
      </div>

      <div className="card">
        <h2>Nuevo gasto recurrente</h2>
        <form className="inline-form" onSubmit={handleSubmit}>
          <label className="field">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Renta" required />
          </label>
          <label className="field">
            Monto
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Cuenta
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              <option value="" disabled>
                Elige una cuenta
              </option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Categoría
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              <option value="" disabled>
                Elige una categoría
              </option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Día del mes
            <input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary" type="submit" disabled={saving}>
            <Icon name="add" size={16} />
            Agregar
          </button>
        </form>
        {error && <p className="login-error">{error}</p>}
      </div>

      <div className="card">
        <h2>Tus recurrentes</h2>
        {active.length === 0 ? (
          <p className="empty-hint">No tienes gastos recurrentes activos.</p>
        ) : (
          <div className="entity-list">
            {active.map((template) => {
              const category = categoryById.get(template.categoryId);
              const account = accountById.get(template.accountId);
              return (
                <div className="entity-row" key={template.id}>
                  <div className="entity-swatch" style={{ background: category?.color ?? "#8A7A99" }}>
                    <Icon name={(category?.icon as IconName) ?? "other"} size={17} />
                  </div>
                  <span className="entity-name">{template.name}</span>
                  <span className="entity-meta">
                    día {template.dayOfMonth} · {account?.name ?? "?"}
                  </span>
                  <span className="expense-amount">{formatMoney(template.amount)}</span>
                  <button onClick={() => archiveRecurringTemplate(templateRepo, template.id)}>Pausar</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
