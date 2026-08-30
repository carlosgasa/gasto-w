import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeName = "violeta" | "oscuro" | "claro";

const THEME_KEY = "cuentas:theme";
const ZOOM_KEY = "cuentas:zoom";

export const ZOOM_MIN = 0.85;
export const ZOOM_MAX = 1.4;
export const ZOOM_STEP = 0.05;

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeName {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "violeta" || stored === "oscuro" || stored === "claro") return stored;
  return "violeta";
}

function readStoredZoom(): number {
  const stored = Number(localStorage.getItem(ZOOM_KEY));
  if (!Number.isFinite(stored) || stored < ZOOM_MIN || stored > ZOOM_MAX) return 1;
  return stored;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(readStoredTheme);
  const [zoom, setZoom] = useState<number>(readStoredZoom);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--app-zoom", String(zoom));
    localStorage.setItem(ZOOM_KEY, String(zoom));
  }, [zoom]);

  const value = useMemo(() => ({ theme, setTheme, zoom, setZoom }), [theme, zoom]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
