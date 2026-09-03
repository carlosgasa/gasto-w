import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Icon, type IconName } from "../icons/Icon";
import { BrandMark } from "../components/BrandMark";
import { signOutUser } from "../../infrastructure/firebase/authService";
import { FirestoreExpenseRepository } from "../../infrastructure/firebase/FirestoreExpenseRepository";
import { FirestoreMonthlySummaryRepository } from "../../infrastructure/firebase/FirestoreMonthlySummaryRepository";
import { FirestoreRecurringTemplateRepository } from "../../infrastructure/firebase/FirestoreRecurringTemplateRepository";
import { FirestoreCategoryRepository } from "../../infrastructure/firebase/FirestoreCategoryRepository";
import { generateRecurringExpensesForMonth } from "../../application/use-cases/manageRecurring";
import { removeDuplicateCategories } from "../../application/use-cases/manageCategories";
import { recomputeAllMonthlySummaries } from "../../application/use-cases/recomputeSummaries";
import { currentMonth } from "../format";
import "./AppLayout.css";

const expenseRepo = new FirestoreExpenseRepository();
const summaryRepo = new FirestoreMonthlySummaryRepository();
const templateRepo = new FirestoreRecurringTemplateRepository();
const categoryRepo = new FirestoreCategoryRepository();

const NAV_ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Agregar gasto", icon: "expenses" },
  { to: "/resumen", label: "Resumen", icon: "dashboard" },
  { to: "/cuentas", label: "Cuentas", icon: "accounts" },
  { to: "/categorias", label: "Categorías", icon: "categories" },
  { to: "/recurrentes", label: "Recurrentes", icon: "recurring" },
  { to: "/reportes", label: "Reportes", icon: "reports" },
  { to: "/configuracion", label: "Configuración", icon: "settings" },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const month = currentMonth();
    Promise.all([templateRepo.list(), expenseRepo.listByMonth(month)])
      .then(([templates, expenses]) =>
        generateRecurringExpensesForMonth({ expenseRepo, summaryRepo }, templates, month, expenses),
      )
      .catch(() => {
        // silencioso: si falla, el usuario igual puede registrar el gasto a mano
      });

    // Limpieza automática de categorías duplicadas (secuela del bug de
    // sembrado ya corregido): se archivan solas al abrir la app, sin
    // importar en qué pantalla entre el usuario primero.
    categoryRepo
      .list()
      .then((categories) => removeDuplicateCategories(categoryRepo, categories))
      .catch(() => {
        // silencioso: si falla, el botón "Quitar duplicados" en Categorías sigue disponible
      });

    // Repara monthlySummaries reconstruyéndolo desde los gastos reales: corrige
    // el bug donde byCategory/byAccount no se actualizaban aunque el total sí.
    recomputeAllMonthlySummaries(expenseRepo, summaryRepo).catch(() => {
      // silencioso: los gastos siguen intactos aunque esto falle una vez
    });
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button
          className="app-hamburger"
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="app-brand">
          <BrandMark size={28} />
          <span>Cuentas</span>
        </div>
      </header>

      {mobileOpen && <div className="app-scrim" onClick={() => setMobileOpen(false)} />}

      <aside className={`app-sidebar${mobileOpen ? " is-open" : ""}`}>
        <div className="app-brand app-brand-desktop">
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
              onClick={() => setMobileOpen(false)}
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
