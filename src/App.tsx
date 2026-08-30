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
import { ExpensesPage } from "./presentation/pages/ExpensesPage";
import { RecurringPage } from "./presentation/pages/RecurringPage";
import { ReportsPage } from "./presentation/pages/ReportsPage";

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
              <Route path="/gastos" element={<ExpensesPage />} />
              <Route path="/recurrentes" element={<RecurringPage />} />
              <Route path="/reportes" element={<ReportsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
