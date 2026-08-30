import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Account, AccountType } from "../../domain/entities/Account";
import { FirestoreAccountRepository } from "../../infrastructure/firebase/FirestoreAccountRepository";
import { archiveAccount, createAccount } from "../../application/use-cases/manageAccounts";
import { Icon } from "../icons/Icon";
import "./pages.css";

const repo = new FirestoreAccountRepository();

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("card");
  const [saving, setSaving] = useState(false);

  useEffect(() => repo.subscribe(setAccounts), []);

  const active = useMemo(() => accounts.filter((a) => a.active), [accounts]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createAccount(repo, {
        name,
        type,
        color: type === "card" ? "#9B24DE" : "#3FAE6B",
        icon: type,
      });
      setName("");
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
        <h2>Nueva cuenta</h2>
        <form className="inline-form" onSubmit={handleSubmit}>
          <label className="field">
            Nombre
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. BBVA Oro"
              required
            />
          </label>
          <label className="field">
            Tipo
            <select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
              <option value="card">Tarjeta</option>
              <option value="cash">Efectivo</option>
            </select>
          </label>
          <button className="btn-primary" type="submit" disabled={saving}>
            <Icon name="add" size={16} />
            Agregar
          </button>
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
                <button onClick={() => archiveAccount(repo, account.id)}>Archivar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
