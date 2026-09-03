import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Account } from "../../domain/entities/Account";
import type { Category } from "../../domain/entities/Category";
import type { Expense } from "../../domain/entities/Expense";
import { FirestoreAccountRepository } from "../../infrastructure/firebase/FirestoreAccountRepository";
import { FirestoreCategoryRepository } from "../../infrastructure/firebase/FirestoreCategoryRepository";
import { FirestoreExpenseRepository } from "../../infrastructure/firebase/FirestoreExpenseRepository";
import { FirestoreMonthlySummaryRepository } from "../../infrastructure/firebase/FirestoreMonthlySummaryRepository";
import { deleteExpense, registerExpense, updateExpense } from "../../application/use-cases/manageExpenses";
import { Icon, type IconName } from "../icons/Icon";
import { IconSelect, type IconSelectOption } from "../components/IconSelect";
import { currentMonth, formatMoney, todayLocal } from "../format";
import "./pages.css";
import "./ExpensesPage.css";

const accountRepo = new FirestoreAccountRepository();
const categoryRepo = new FirestoreCategoryRepository();
const expenseRepo = new FirestoreExpenseRepository();
const summaryRepo = new FirestoreMonthlySummaryRepository();
const deps = { expenseRepo, summaryRepo };


const emptyForm = {
  amount: "",
  date: todayLocal(),
  accountId: "",
  categoryId: "",
  note: "",
  odometerKm: "",
  liters: "",
};

export function ExpensesPage() {
  const [month, setMonth] = useState(currentMonth());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => accountRepo.subscribe(setAccounts), []);
  useEffect(() => categoryRepo.subscribe(setCategories), []);
  useEffect(() => expenseRepo.subscribeByMonth(month, setExpenses), [month]);

  const activeAccounts = useMemo(() => accounts.filter((a) => a.active), [accounts]);
  const activeCategories = useMemo(() => categories.filter((c) => c.active), [categories]);

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const selectedCategory = categoryById.get(form.categoryId);
  const isFuel = selectedCategory?.fieldsTemplate === "fuel";

  const accountOptions: IconSelectOption[] = activeAccounts.map((a) => ({
    value: a.id,
    label: a.name,
    icon: a.type === "card" ? "card" : "cash",
    color: a.color,
  }));
  const categoryOptions: IconSelectOption[] = activeCategories.map((c) => ({
    value: c.id,
    label: c.name,
    icon: c.icon as IconName,
    color: c.color,
  }));

  const monthTotal = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  function resetForm() {
    setForm({ ...emptyForm, date: todayLocal() });
    setEditingId(null);
  }

  function loadForEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      amount: String(expense.amount),
      date: expense.date,
      accountId: expense.accountId,
      categoryId: expense.categoryId,
      note: expense.note,
      odometerKm: expense.extra?.odometerKm != null ? String(expense.extra.odometerKm) : "",
      liters: expense.extra?.liters != null ? String(expense.extra.liters) : "",
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const amount = Number(form.amount);
    const extra = isFuel
      ? {
          odometerKm: form.odometerKm ? Number(form.odometerKm) : undefined,
          liters: form.liters ? Number(form.liters) : undefined,
          pricePerLiter:
            form.liters && Number(form.liters) > 0 ? amount / Number(form.liters) : undefined,
        }
      : null;

    setSaving(true);
    try {
      if (editingId) {
        const original = expenses.find((e) => e.id === editingId);
        if (original) {
          await updateExpense(deps, original, {
            amount,
            date: form.date,
            accountId: form.accountId,
            categoryId: form.categoryId,
            note: form.note,
            extra,
          });
        }
      } else {
        await registerExpense(deps, {
          amount,
          date: form.date,
          accountId: form.accountId,
          categoryId: form.categoryId,
          note: form.note,
          source: "manual",
          recurringId: null,
          extra,
        });
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el gasto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense: Expense) {
    await deleteExpense(deps, expense);
    if (editingId === expense.id) resetForm();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Gastos</h1>
        <p>Registra cada gasto puntual. El total del mes se recalcula solo.</p>
      </div>

      <div className="card">
        <h2>{editingId ? "Editar gasto" : "Nuevo gasto"}</h2>
        <form className="expense-form" onSubmit={handleSubmit}>
          <div className="inline-form">
            <label className="field">
              Monto
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </label>
            <label className="field">
              Fecha
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </label>
            <label className="field">
              Cuenta
              <IconSelect
                value={form.accountId}
                onChange={(v) => setForm({ ...form, accountId: v })}
                options={accountOptions}
                placeholder="Elige una cuenta"
              />
            </label>
            <label className="field">
              Categoría
              <IconSelect
                value={form.categoryId}
                onChange={(v) => setForm({ ...form, categoryId: v })}
                options={categoryOptions}
                placeholder="Elige una categoría"
              />
            </label>
            <label className="field" style={{ flex: 1 }}>
              Nota
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="opcional"
              />
            </label>
          </div>

          {isFuel && (
            <div className="inline-form fuel-fields">
              <label className="field">
                Kilometraje
                <input
                  type="number"
                  min="0"
                  value={form.odometerKm}
                  onChange={(e) => setForm({ ...form, odometerKm: e.target.value })}
                  placeholder="odómetro"
                />
              </label>
              <label className="field">
                Litros
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.liters}
                  onChange={(e) => setForm({ ...form, liters: e.target.value })}
                />
              </label>
            </div>
          )}

          {error && <p className="login-error">{error}</p>}

          <div className="expense-form-actions">
            <button className="btn-primary" type="submit" disabled={saving}>
              <Icon name="add" size={16} />
              {editingId ? "Guardar cambios" : "Agregar gasto"}
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
        <div className="expenses-list-header">
          <h2>Gastos del mes</h2>
          <div className="month-picker">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            <span className="month-total">{formatMoney(monthTotal)}</span>
          </div>
        </div>

        {expenses.length === 0 ? (
          <p className="empty-hint">No hay gastos registrados este mes.</p>
        ) : (
          <div className="entity-list">
            {expenses.map((expense) => {
              const category = categoryById.get(expense.categoryId);
              const account = accountById.get(expense.accountId);
              return (
                <div className="entity-row expense-row" key={expense.id}>
                  <div className="entity-swatch" style={{ background: category?.color ?? "#8A7A99" }}>
                    <Icon name={(category?.icon as IconName) ?? "other"} size={17} />
                  </div>
                  <div className="expense-info">
                    <span className="entity-name">{expense.note || category?.name || "Sin descripción"}</span>
                    <span className="entity-meta">
                      {category?.name ?? "Sin categoría"} · {expense.date} · {account?.name ?? "?"}
                      {expense.source === "recurring" ? " · recurrente" : ""}
                    </span>
                  </div>
                  <span className="expense-amount">{formatMoney(expense.amount)}</span>
                  <button onClick={() => loadForEdit(expense)}>Editar</button>
                  <button onClick={() => handleDelete(expense)}>Borrar</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
