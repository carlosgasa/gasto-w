import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Icon, type IconName } from "../icons/Icon";
import { BrandMark } from "../components/BrandMark";
import { signOutUser } from "../../infrastructure/firebase/authService";
import { FirestoreExpenseRepository } from "../../infrastructure/firebase/FirestoreExpenseRepository";
import { FirestoreMonthlySummaryRepository } from "../../infrastructure/firebase/FirestoreMonthlySummaryRepository";
import { FirestoreRecurringTemplateRepository } from "../../infrastructure/firebase/FirestoreRecurringTemplateRepository";
import { generateRecurringExpensesForMonth } from "../../application/use-cases/manageRecurring";
import { currentMonth } from "../format";
import "./AppLayout.css";

const expenseRepo = new FirestoreExpenseRepository();
const summaryRepo = new FirestoreMonthlySummaryRepository();
const templateRepo = new FirestoreRecurringTemplateRepository();

const NAV_ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Resumen", icon: "dashboard" },
  { to: "/gastos", label: "Gastos", icon: "expenses" },
  { to: "/cuentas", label: "Cuentas", icon: "accounts" },
  { to: "/categorias", label: "Categorías", icon: "categories" },
  { to: "/recurrentes", label: "Recurrentes", icon: "recurring" },
  { to: "/reportes", label: "Reportes", icon: "reports" },
  { to: "/configuracion", label: "Configuración", icon: "settings" },
];

export function AppLayout() {
  useEffect(() => {
    const month = currentMonth();
    Promise.all([templateRepo.list(), expenseRepo.listByMonth(month)])
      .then(([templates, expenses]) =>
        generateRecurringExpensesForMonth({ expenseRepo, summaryRepo }, templates, month, expenses),
      )
      .catch(() => {
        // silencioso: si falla, el usuario igual puede registrar el gasto a mano
      });
  }, []);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <BrandMark size={34} />
          <span>Cuentas</span>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `app-nav-item${isActive ? " is-active" : ""}`}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="app-logout" onClick={() => signOutUser()}>
          <Icon name="logout" size={18} />
          <span>Cerrar sesión</span>
        </button>
      </aside>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
