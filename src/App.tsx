import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./presentation/auth/AuthContext";
import { ProtectedRoute } from "./presentation/auth/ProtectedRoute";
import { ThemeProvider } from "./presentation/theme/ThemeContext";
import { AppLayout } from "./presentation/layout/AppLayout";
import { LoginPage } from "./presentation/pages/LoginPage";
import { DashboardPage } from "./presentation/pages/DashboardPage";
import { AccountsPage } from "./presentation/pages/AccountsPage";
import { CategoriesPage } from "./presentation/pages/CategoriesPage";
import { SettingsPage } from "./presentation/pages/SettingsPage";
import { ComingSoonPage } from "./presentation/pages/ComingSoonPage";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/cuentas" element={<AccountsPage />} />
              <Route path="/categorias" element={<CategoriesPage />} />
              <Route path="/configuracion" element={<SettingsPage />} />
              <Route
                path="/gastos"
                element={
                  <ComingSoonPage
                    title="Gastos"
                    icon="expenses"
                    description="La captura de gastos puntuales y con campos extendidos (como gasolina) llega en la siguiente fase."
                  />
                }
              />
              <Route
                path="/recurrentes"
                element={
                  <ComingSoonPage
                    title="Recurrentes"
                    icon="recurring"
                    description="Las plantillas de gasto fijo mensual (renta, suscripciones) llegan en la siguiente fase."
                  />
                }
              />
              <Route
                path="/reportes"
                element={
                  <ComingSoonPage
                    title="Reportes"
                    icon="reports"
                    description="Comparativas, tendencias, proyecciones y el catálogo de gráficas llegan en la siguiente fase."
                  />
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
