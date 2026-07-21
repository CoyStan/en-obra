/** Kit CSS-variable themes — only Atardecer + Crema pairs. */

export type ThemeId = "dusk" | "dusk-light" | "cream-night" | "cream";

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

function theme(
  id: ThemeId,
  label: string,
  blurb: string,
  tokens: ThemeTokens,
): DashboardTheme {
  return { id, label, blurb, tokens };
}

export const dashboardThemes: DashboardTheme[] = [
  theme("dusk", "Atardecer", "Oscuro cálido · teal", {
    background: "#1c1d20",
    foreground: "#f5f2ee",
    card: "#2a2c31",
    cardForeground: "#f5f2ee",
    popover: "#2a2c31",
    popoverForeground: "#f5f2ee",
    primary: "#3aa8a5",
    primaryForeground: "#0a2e2d",
    secondary: "#1e3a39",
    secondaryForeground: "#e7f5f4",
    muted: "#32343a",
    mutedForeground: "#a1a1aa",
    accent: "#3f2e2a",
    accentForeground: "#ffd5cb",
    destructive: "#f97066",
    border: "#3f4148",
    input: "#3f4148",
    ring: "#3aa8a5",
    sidebar: "#232529",
    sidebarForeground: "#f5f2ee",
    sidebarPrimary: "#3aa8a5",
    sidebarPrimaryForeground: "#0a2e2d",
    sidebarAccent: "#1e3a39",
    sidebarAccentForeground: "#e7f5f4",
    sidebarBorder: "#3f4148",
    sidebarRing: "#3aa8a5",
    chart1: "#3aa8a5",
    chart2: "#f28c78",
    chart3: "#d97706",
    chart4: "#4ade80",
    chart5: "#f97066",
  }),
  theme("dusk-light", "Atardecer claro", "Claro cálido · mismo teal", {
    background: "#faf8f5",
    foreground: "#2a2c31",
    card: "#ffffff",
    cardForeground: "#2a2c31",
    popover: "#ffffff",
    popoverForeground: "#2a2c31",
    primary: "#147a78",
    primaryForeground: "#ffffff",
    secondary: "#e7f5f4",
    secondaryForeground: "#0f6261",
    muted: "#f3efea",
    mutedForeground: "#6b7280",
    accent: "#fff0ec",
    accentForeground: "#c96b5a",
    destructive: "#b42318",
    border: "#ebe5df",
    input: "#ebe5df",
    ring: "#147a78",
    sidebar: "#f3efea",
    sidebarForeground: "#2a2c31",
    sidebarPrimary: "#147a78",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#e7f5f4",
    sidebarAccentForeground: "#0f6261",
    sidebarBorder: "#ebe5df",
    sidebarRing: "#147a78",
    chart1: "#147a78",
    chart2: "#f28c78",
    chart3: "#d97706",
    chart4: "#15803d",
    chart5: "#b42318",
  }),
  theme("cream-night", "Crema negra", "Negro cálido · naranja Crema", {
    background: "#12100e",
    foreground: "#f7f0e6",
    card: "#1c1916",
    cardForeground: "#f7f0e6",
    popover: "#1c1916",
    popoverForeground: "#f7f0e6",
    primary: "#fb923c",
    primaryForeground: "#1c1008",
    secondary: "#3b2a1a",
    secondaryForeground: "#ffedd5",
    muted: "#26221c",
    mutedForeground: "#a8a29e",
    accent: "#422006",
    accentForeground: "#fde68a",
    destructive: "#f97066",
    border: "#3f3830",
    input: "#3f3830",
    ring: "#fb923c",
    sidebar: "#181511",
    sidebarForeground: "#f7f0e6",
    sidebarPrimary: "#fb923c",
    sidebarPrimaryForeground: "#1c1008",
    sidebarAccent: "#3b2a1a",
    sidebarAccentForeground: "#ffedd5",
    sidebarBorder: "#3f3830",
    sidebarRing: "#fb923c",
    chart1: "#fb923c",
    chart2: "#3aa8a5",
    chart3: "#eab308",
    chart4: "#4ade80",
    chart5: "#f97066",
  }),
  theme("cream", "Crema", "Blanco huevo · naranja suave", {
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
  }),
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

const darkThemeIds = new Set<ThemeId>(["dusk", "cream-night"]);

export function getThemeById(id: string | null | undefined) {
  return dashboardThemes.find((theme) => theme.id === id) ?? dashboardThemes[0];
}

export function applyDashboardTheme(theme: DashboardTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.setProperty("--radius", radius);

  if (darkThemeIds.has(theme.id)) {
    root.style.setProperty("--shadow-soft", "0 4px 16px rgba(0, 0, 0, 0.45)");
    root.style.setProperty("--shadow-lift", "0 8px 24px rgba(0, 0, 0, 0.55)");
    root.classList.add("dark");
  } else if (theme.id === "dusk-light") {
    root.style.setProperty("--shadow-soft", "0 4px 16px rgba(20, 122, 120, 0.08)");
    root.style.setProperty("--shadow-lift", "0 8px 24px rgba(20, 122, 120, 0.12)");
    root.classList.remove("dark");
  } else {
    root.style.setProperty("--shadow-soft", "0 4px 16px rgba(234, 88, 12, 0.10)");
    root.style.setProperty("--shadow-lift", "0 8px 24px rgba(234, 88, 12, 0.14)");
    root.classList.remove("dark");
  }

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
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && dashboardThemes.some((theme) => theme.id === stored)) {
      return stored as ThemeId;
    }
    // Map removed ids to the closest kept pair.
    if (stored === "vemos" || stored === "sage" || stored === "coral") return "dusk-light";
    if (stored === "honey" || stored === "sand" || stored === "marigold" || stored === "apricot" || stored === "clay") {
      return "cream";
    }
  } catch {
    /* ignore */
  }
  return "cream";
}

export function nextThemeId(current: ThemeId): ThemeId {
  const index = dashboardThemes.findIndex((theme) => theme.id === current);
  const next = dashboardThemes[(index + 1) % dashboardThemes.length];
  return next.id;
}
