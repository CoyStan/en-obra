/** Single warm cream theme for En Obra dashboard. */

export type ThemeId = "cream";

export type ThemeTokens = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
};

export type DashboardTheme = {
  id: ThemeId;
  label: string;
  blurb: string;
  tokens: ThemeTokens;
};

const radius = "0.875rem";

export const dashboardThemes: DashboardTheme[] = [
  {
    id: "cream",
    label: "Crema",
    blurb: "Blanco huevo · naranja suave",
    tokens: {
      background: "#fffcf7",
      foreground: "#2a2420",
      card: "#ffffff",
      cardForeground: "#2a2420",
      popover: "#ffffff",
      popoverForeground: "#2a2420",
      primary: "#ea580c",
      primaryForeground: "#ffffff",
      secondary: "#ffedd5",
      secondaryForeground: "#9a3412",
      muted: "#f6f0e8",
      mutedForeground: "#78716c",
      accent: "#fef3c7",
      accentForeground: "#92400e",
      destructive: "#b42318",
      border: "#ebe3d6",
      input: "#ebe3d6",
      ring: "#ea580c",
      sidebar: "#f6f0e8",
      sidebarForeground: "#2a2420",
      sidebarPrimary: "#ea580c",
      sidebarPrimaryForeground: "#ffffff",
      sidebarAccent: "#ffedd5",
      sidebarAccentForeground: "#9a3412",
      sidebarBorder: "#ebe3d6",
      sidebarRing: "#ea580c",
      chart1: "#ea580c",
      chart2: "#147a78",
      chart3: "#eab308",
      chart4: "#15803d",
      chart5: "#b42318",
    },
  },
];

export const THEME_STORAGE_KEY = "cuenta-obra-dashboard-theme";

const cssVarMap: Record<keyof ThemeTokens, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  border: "--border",
  input: "--input",
  ring: "--ring",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
};

export function getThemeById(_id: string | null | undefined): DashboardTheme {
  return dashboardThemes[0];
}

export function applyDashboardTheme(theme: DashboardTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.setProperty("--radius", radius);
  root.style.setProperty("--shadow-soft", "0 4px 16px rgba(234, 88, 12, 0.10)");
  root.style.setProperty("--shadow-lift", "0 8px 24px rgba(234, 88, 12, 0.14)");
  root.classList.remove("dark");

  for (const [key, cssVar] of Object.entries(cssVarMap) as Array<[keyof ThemeTokens, string]>) {
    root.style.setProperty(cssVar, theme.tokens[key]);
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {
    /* ignore private mode */
  }
}

export function readStoredThemeId(): ThemeId {
  return "cream";
}

export function nextThemeId(_current: ThemeId): ThemeId {
  return "cream";
}
