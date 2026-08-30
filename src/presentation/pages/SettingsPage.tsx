import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, useTheme, type ThemeName } from "../theme/ThemeContext";
import { Icon, type IconName } from "../icons/Icon";
import "./pages.css";
import "./SettingsPage.css";

const THEME_OPTIONS: { value: ThemeName; label: string; icon: IconName }[] = [
  { value: "violeta", label: "Violeta", icon: "violet" },
  { value: "claro", label: "Claro neutro", icon: "sun" },
  { value: "oscuro", label: "Oscuro", icon: "moon" },
];

export function SettingsPage() {
  const { theme, setTheme, zoom, setZoom } = useTheme();

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
    </div>
  );
}
