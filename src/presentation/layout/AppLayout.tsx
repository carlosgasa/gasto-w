import { NavLink, Outlet } from "react-router-dom";
import { Icon, type IconName } from "../icons/Icon";
import { BrandMark } from "../components/BrandMark";
import { signOutUser } from "../../infrastructure/firebase/authService";
import "./AppLayout.css";

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
