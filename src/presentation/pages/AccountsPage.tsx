import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Account, AccountType } from "../../domain/entities/Account";
import { FirestoreAccountRepository } from "../../infrastructure/firebase/FirestoreAccountRepository";
import { archiveAccount, createAccount, updateAccount } from "../../application/use-cases/manageAccounts";
import { Icon } from "../icons/Icon";
import "./pages.css";

const repo = new FirestoreAccountRepository();

const COLOR_CHOICES = [
  "#9B24DE",
  "#B33BF2",
  "#5B1594",
  "#3F8CE0",
  "#5B6EE0",
  "#3FAE6B",
  "#3FA5B0",
  "#D69A1F",
  "#C9863F",
  "#E0663F",
  "#D14F8C",
  "#7A5AF8",
  "#B0473F",
  "#4A7A3F",
  "#8A7A99",
];

const emptyForm = { name: "", type: "card" as AccountType, color: COLOR_CHOICES[0] };

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => repo.subscribe(setAccounts), []);

  const active = useMemo(() => accounts.filter((a) => a.active), [accounts]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function loadForEdit(account: Account) {
    setEditingId(account.id);
    setForm({ name: account.name, type: account.type, color: account.color });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name, type: form.type, color: form.color, icon: form.type };
      if (editingId) {
        await updateAccount(repo, editingId, payload);
      } else {
        await createAccount(repo, payload);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Cuentas</h1>
        <p>Tus tarjetas y efectivo. Aquí no se lleva saldo, solo agrupan gasto para los reportes.</p>
      </div>

      <div className="card">
        <h2>{editingId ? "Editar cuenta" : "Nueva cuenta"}</h2>
        <form className="inline-form" onSubmit={handleSubmit}>
          <label className="field">
            Nombre
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ej. BBVA Oro"
              required
            />
          </label>
          <label className="field">
            Tipo
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })}>
              <option value="card">Tarjeta</option>
              <option value="cash">Efectivo</option>
            </select>
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
        <h2>Tus cuentas</h2>
        {active.length === 0 ? (
          <p className="empty-hint">Todavía no das de alta ninguna cuenta.</p>
        ) : (
          <div className="entity-list">
            {active.map((account) => (
              <div className="entity-row" key={account.id}>
                <div className="entity-swatch" style={{ background: account.color }}>
                  <Icon name={account.type === "card" ? "card" : "cash"} size={17} />
                </div>
                <span className="entity-name">{account.name}</span>
                <span className="entity-meta">{account.type === "card" ? "Tarjeta" : "Efectivo"}</span>
                <button onClick={() => loadForEdit(account)}>Editar</button>
                <button onClick={() => archiveAccount(repo, account.id)}>Archivar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
