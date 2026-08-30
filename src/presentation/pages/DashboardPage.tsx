import { useEffect, useState } from "react";
import { FirestoreAccountRepository } from "../../infrastructure/firebase/FirestoreAccountRepository";
import { FirestoreCategoryRepository } from "../../infrastructure/firebase/FirestoreCategoryRepository";
import "./pages.css";

const accountRepo = new FirestoreAccountRepository();
const categoryRepo = new FirestoreCategoryRepository();

export function DashboardPage() {
  const [accountCount, setAccountCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubAccounts = accountRepo.subscribe((accounts) =>
      setAccountCount(accounts.filter((a) => a.active).length),
    );
    const unsubCategories = categoryRepo.subscribe((categories) =>
      setCategoryCount(categories.filter((c) => c.active).length),
    );
    return () => {
      unsubAccounts();
      unsubCategories();
    };
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Resumen</h1>
        <p>Base del proyecto lista. El corte mensual y las gráficas llegan en la siguiente fase.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-label">Cuentas activas</div>
          <div className="stat-value">{accountCount ?? "…"}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Categorías activas</div>
          <div className="stat-value">{categoryCount ?? "…"}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Gasto del mes</div>
          <div className="stat-value">—</div>
        </div>
      </div>

      <div className="card">
        <h2>Siguiente paso</h2>
        <p className="empty-hint">
          Da de alta tus tarjetas en <strong>Cuentas</strong> y revisa las categorías. La captura de
          gastos y el dashboard con gráficas se agregan en la próxima iteración.
        </p>
      </div>
    </div>
  );
}
