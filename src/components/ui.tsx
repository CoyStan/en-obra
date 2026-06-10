import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatMoney } from "../domain/money";
import { colors, radius, shadow, spacing, typography } from "../theme/theme";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type ActionButtonProps = {
  label: string;
  icon?: IconName;
  tone?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  onPress: () => void;
};

export function ActionButton({
  disabled = false,
  icon,
  label,
  onPress,
  tone = "primary",
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`${tone}Button`],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons
          color={tone === "primary" ? colors.surface : colors.primaryDark}
          name={icon}
          size={18}
        />
      ) : null}
      <Text style={[styles.buttonLabel, tone === "primary" && styles.primaryButtonLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

type EmptyStateProps = {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
};

export function EmptyState({ action, body, icon, title }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons color={colors.primary} name={icon} size={24} />
      </View>
      <View style={styles.emptyCopy}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyBody}>{body}</Text>
      </View>
      {action}
    </View>
  );
}

type PillProps = {
  label: string;
  tone?: "success" | "due" | "neutral" | "gold";
};

export function Pill({ label, tone = "neutral" }: PillProps) {
  return <Text style={[styles.pill, styles[`${tone}Pill`]]}>{label}</Text>;
}

export function Avatar({ color, label }: { color: string; label: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarLabel}>{label.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export function Amount({
  cents,
  emphasis = false,
  tone = "neutral",
}: {
  cents: number;
  emphasis?: boolean;
  tone?: "neutral" | "success" | "due";
}) {
  return (
    <Text
      style={[
        styles.amount,
        emphasis && styles.amountEmphasis,
        tone === "success" && styles.amountSuccess,
        tone === "due" && styles.amountDue,
      ]}
    >
      {formatMoney(cents)}
    </Text>
  );
}

export function Section({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  amountDue: {
    color: colors.due,
  },
  amountEmphasis: {
    fontSize: 23,
  },
  amountSuccess: {
    color: colors.primary,
  },
  avatar: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  avatarLabel: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "800",
  },
  button: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    color: colors.primaryDark,
    flexShrink: 1,
    fontSize: typography.small,
    fontWeight: "800",
    textAlign: "center",
  },
  dangerButton: {
    backgroundColor: colors.dueWash,
    borderColor: colors.due,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.45,
  },
  duePill: {
    backgroundColor: colors.dueWash,
    color: colors.due,
  },
  emptyBody: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 19,
  },
  emptyCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: radius.sm,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 104,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "800",
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  goldPill: {
    backgroundColor: colors.goldWash,
    color: colors.ink,
  },
  neutralPill: {
    backgroundColor: colors.surfaceStrong,
    color: colors.financeBlue,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    fontSize: typography.micro,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  primaryButton: {
    backgroundColor: colors.primary,
    ...shadow,
  },
  primaryButtonLabel: {
    color: colors.surface,
  },
  secondaryButton: {
    backgroundColor: colors.successWash,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
  },
  successPill: {
    backgroundColor: colors.successWash,
    color: colors.primaryDark,
  },
});
