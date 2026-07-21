import { CheckIcon, ChevronRightIcon, PaletteIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  applyDashboardTheme,
  dashboardThemes,
  getThemeById,
  nextThemeId,
  readStoredThemeId,
  type ThemeId,
} from "@/dashboard/themes";

export function ThemeSwitcher() {
  const [themeId, setThemeId] = useState<ThemeId>("cream");

  useEffect(() => {
    const initial = getThemeById(readStoredThemeId());
    setThemeId(initial.id);
    applyDashboardTheme(initial);
  }, []);

  const current = getThemeById(themeId);

  const select = (id: ThemeId) => {
    const theme = getThemeById(id);
    setThemeId(theme.id);
    applyDashboardTheme(theme);
  };

  const cycle = () => {
    select(nextThemeId(themeId));
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button aria-label={`Siguiente tema. Actual: ${current.label}`} className="press-calm" onClick={cycle} size="sm" variant="outline">
        <PaletteIcon data-icon="inline-start" />
        Tema: {current.label}
        <ChevronRightIcon data-icon="inline-end" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button aria-label="Elegir tema" className="press-calm" size="sm" variant="ghost" />}>
          Lista
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>4 temas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {dashboardThemes.map((theme) => (
              <DropdownMenuItem
                className="flex items-start gap-2"
                key={theme.id}
                onClick={() => select(theme.id)}
              >
                <span
                  aria-hidden
                  className="mt-0.5 size-3.5 shrink-0 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: theme.tokens.primary }}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-medium">{theme.label}</span>
                  <span className="text-xs text-muted-foreground">{theme.blurb}</span>
                </span>
                {theme.id === themeId ? <CheckIcon className="size-4 shrink-0 text-primary" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
