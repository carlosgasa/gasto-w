import { useState, type ChangeEvent } from "react";
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, useTheme, type ThemeName } from "../theme/ThemeContext";
import { Icon, type IconName } from "../icons/Icon";
import { FirestoreBackupRepository } from "../../infrastructure/firebase/FirestoreBackupRepository";
import { exportBackup, importBackup } from "../../application/use-cases/manageBackup";
import "./pages.css";
import "./SettingsPage.css";

const backupRepo = new FirestoreBackupRepository();

const THEME_OPTIONS: { value: ThemeName; label: string; icon: IconName }[] = [
  { value: "violeta", label: "Violeta", icon: "violet" },
  { value: "claro", label: "Claro neutro", icon: "sun" },
  { value: "oscuro", label: "Oscuro", icon: "moon" },
];

export function SettingsPage() {
  const { theme, setTheme, zoom, setZoom } = useTheme();
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    setStatus(null);
    try {
      const payload = await exportBackup(backupRepo);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cuentas-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus({ tone: "ok", text: "Respaldo descargado." });
    } catch (err) {
      setStatus({ tone: "error", text: err instanceof Error ? err.message : "No se pudo exportar." });
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      await importBackup(backupRepo, raw);
      setStatus({ tone: "ok", text: "Respaldo restaurado correctamente." });
    } catch (err) {
      setStatus({ tone: "error", text: err instanceof Error ? err.message : "No se pudo restaurar." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Configuración</h1>
        <p>Tema visual y escala de la interfaz.</p>
      </div>

      <div className="card">
        <h2>Tema</h2>
        <div className="theme-options">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`theme-option${theme === option.value ? " is-active" : ""}`}
              onClick={() => setTheme(option.value)}
            >
              <Icon name={option.icon} size={22} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Zoom de la app</h2>
        <div className="zoom-control">
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="card">
        <h2>Respaldo</h2>
        <p className="empty-hint" style={{ marginBottom: "1rem" }}>
          Descarga toda tu información (cuentas, categorías, gastos, recurrentes y resúmenes) en un
          archivo JSON, o restaura un respaldo anterior.
        </p>
        <div className="backup-actions">
          <button className="btn-primary" onClick={handleExport} disabled={busy}>
            <Icon name="reports" size={16} />
            Descargar respaldo (JSON)
          </button>
          <label className="btn-ghost backup-upload">
            Restaurar desde archivo
            <input type="file" accept="application/json" onChange={handleImport} disabled={busy} hidden />
          </label>
        </div>
        {status && (
          <p className={status.tone === "error" ? "login-error" : "backup-status-ok"}>{status.text}</p>
        )}
      </div>
    </div>
  );
}
