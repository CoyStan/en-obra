const tokens = require("./src/theme/tokens.json");

function px(value) {
  return `${value}px`;
}

const nativeWindColors = {
  ink: tokens.colors.ink,
  "muted-ink": tokens.colors.mutedInk,
  canvas: tokens.colors.canvas,
  surface: tokens.colors.surface,
  "surface-strong": tokens.colors.surfaceStrong,
  "surface-tinted": tokens.colors.surfaceTinted,
  primary: tokens.colors.primary,
  "primary-dark": tokens.colors.primaryDark,
  "accent-blue": tokens.colors.accentBlue,
  terracotta: tokens.colors.terracotta,
  marigold: tokens.colors.marigold,
  due: tokens.colors.due,
  border: tokens.colors.border,
  "success-wash": tokens.colors.successWash,
  "blue-wash": tokens.colors.blueWash,
  "due-wash": tokens.colors.dueWash,
  "warm-wash": tokens.colors.warmWash,
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: nativeWindColors,
      borderRadius: {
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
