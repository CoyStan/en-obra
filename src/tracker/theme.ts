import tokens from "../theme/tokens.json";

/** Preferred-kit-aligned tracker palette. Status washes are semantic aliases. */
export const trackerColors = {
  canvas: tokens.colors.background,
  surface: tokens.colors.card,
  surfaceMuted: tokens.colors.muted,
  ink: tokens.colors.foreground,
  inkMuted: tokens.colors.mutedForeground,
  line: tokens.colors.border,
  forest: tokens.colors.forest,
  forestDark: tokens.colors.forestDark,
  forestWash: tokens.colors.forestWash,
  clay: tokens.colors.clay,
  clayWash: tokens.colors.clayWash,
  sun: tokens.colors.sun,
  sunWash: tokens.colors.sunWash,
  blue: tokens.colors.statusBlue,
  blueWash: tokens.colors.statusBlueWash,
  success: tokens.colors.success,
  successWash: tokens.colors.trackerSuccessWash,
  shadow: tokens.colors.shadow,
  primary: tokens.colors.primary,
  primaryForeground: tokens.colors.primaryForeground,
  secondary: tokens.colors.secondary,
  destructive: tokens.colors.destructive,
  ring: tokens.colors.ring,
};

export const trackerSpacing = {
  xxs: tokens.spacing.xs,
  xs: tokens.spacing.sm,
  sm: tokens.spacing.md,
  md: tokens.spacing.lg,
  lg: tokens.spacing.xl,
  xl: tokens.spacing.xxl,
};

export const trackerRadius = {
  sm: tokens.radius.sm,
  md: tokens.radius.md,
  lg: tokens.radius.lg,
  xl: tokens.radius.xl,
  pill: 999,
};
