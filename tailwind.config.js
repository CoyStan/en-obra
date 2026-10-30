const tokens = require("./src/theme/tokens.json");

function px(value) {
  return `${value}px`;
}

const nativeWindColors = {
  background: tokens.colors.background,
  foreground: tokens.colors.foreground,
  card: tokens.colors.card,
  "card-foreground": tokens.colors.cardForeground,
  popover: tokens.colors.popover,
  "popover-foreground": tokens.colors.popoverForeground,
  primary: tokens.colors.primary,
  "primary-foreground": tokens.colors.primaryForeground,
  secondary: tokens.colors.secondary,
  "secondary-foreground": tokens.colors.secondaryForeground,
  muted: tokens.colors.muted,
  "muted-foreground": tokens.colors.mutedForeground,
  accent: tokens.colors.accent,
  "accent-foreground": tokens.colors.accentForeground,
  destructive: tokens.colors.destructive,
  border: tokens.colors.border,
  input: tokens.colors.input,
  ring: tokens.colors.ring,
  ink: tokens.colors.ink,
  "muted-ink": tokens.colors.mutedInk,
  canvas: tokens.colors.canvas,
  surface: tokens.colors.surface,
  "surface-strong": tokens.colors.surfaceStrong,
  "surface-tinted": tokens.colors.surfaceTinted,
  "primary-dark": tokens.colors.primaryDark,
  "accent-blue": tokens.colors.accentBlue,
  terracotta: tokens.colors.terracotta,
  marigold: tokens.colors.marigold,
  due: tokens.colors.due,
  "success-wash": tokens.colors.successWash,
  "blue-wash": tokens.colors.blueWash,
  "due-wash": tokens.colors.dueWash,
  "warm-wash": tokens.colors.warmWash,
  forest: tokens.colors.forest,
  "forest-dark": tokens.colors.forestDark,
  "forest-wash": tokens.colors.forestWash,
  clay: tokens.colors.clay,
  "clay-wash": tokens.colors.clayWash,
  sun: tokens.colors.sun,
  "sun-wash": tokens.colors.sunWash,
  success: tokens.colors.success,
  "status-blue": tokens.colors.statusBlue,
  "status-blue-wash": tokens.colors.statusBlueWash,
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: nativeWindColors,
      borderRadius: {
        sm: px(tokens.radius.sm),
        md: px(tokens.radius.md),
        lg: px(tokens.radius.lg),
        xl: px(tokens.radius.xl),
        ccSm: px(tokens.radius.sm),
        ccMd: px(tokens.radius.md),
        ccLg: px(tokens.radius.lg),
      },
      spacing: {
        ccXs: px(tokens.spacing.xs),
        ccSm: px(tokens.spacing.sm),
        ccMd: px(tokens.spacing.md),
        ccLg: px(tokens.spacing.lg),
        ccXl: px(tokens.spacing.xl),
        ccXxl: px(tokens.spacing.xxl),
      },
      fontSize: {
        ccTitle: px(tokens.typography.title),
        ccHeading: px(tokens.typography.heading),
        ccBody: px(tokens.typography.body),
        ccSmall: px(tokens.typography.small),
        ccMicro: px(tokens.typography.micro),
      },
    },
  },
  plugins: [],
};
