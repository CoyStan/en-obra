import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps, type ReactNode } from "react";
import { Pressable, Text, type TextStyle, type ViewStyle } from "react-native";
import { colors } from "../../theme/theme";
import { cn } from "./utils";

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "primary" | "danger";
type ButtonSize = "default" | "sm" | "lg" | "icon";
type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type ButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: IconName;
  labelClassName?: string;
  onPress?: () => void;
  size?: ButtonSize;
  testID?: string;
  variant?: ButtonVariant;
};

const sizes: Record<ButtonSize, string> = {
  default: "min-h-[44px] px-4",
  sm: "min-h-[40px] px-3",
  lg: "min-h-[48px] px-5",
  icon: "h-11 w-11 items-center justify-center p-0",
};

const surfaceStyles: Record<string, ViewStyle> = {
  default: { backgroundColor: colors.primary },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 },
  secondary: { backgroundColor: colors.secondary },
  ghost: { backgroundColor: "transparent" },
  destructive: { backgroundColor: colors.dueWash, borderColor: colors.destructive, borderWidth: 1 },
  danger: { backgroundColor: colors.dueWash, borderColor: colors.destructive, borderWidth: 1 },
};

const labelStyles: Record<string, TextStyle> = {
  default: { color: colors.primaryForeground },
  primary: { color: colors.primaryForeground },
  outline: { color: colors.foreground },
  secondary: { color: colors.secondaryForeground },
  ghost: { color: colors.foreground },
  destructive: { color: colors.destructive },
  danger: { color: colors.destructive },
};

const iconColor: Record<string, string> = {
  default: colors.primaryForeground,
  primary: colors.primaryForeground,
  outline: colors.foreground,
  secondary: colors.secondaryForeground,
  ghost: colors.foreground,
  destructive: colors.destructive,
  danger: colors.destructive,
};

function resolveVariant(variant: ButtonVariant) {
  if (variant === "primary") return "default";
  if (variant === "danger") return "destructive";
  return variant;
}

export function Button({
  accessibilityHint,
  accessibilityLabel,
  children,
  className,
  disabled = false,
  icon,
  labelClassName,
  onPress,
  size = "default",
  testID,
  variant = "default",
}: ButtonProps) {
  const resolved = resolveVariant(variant);
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn("flex-row items-center justify-center gap-2 rounded-lg", sizes[size], disabled && "opacity-50", className)}
      disabled={disabled}
      onPress={onPress}
      style={surfaceStyles[resolved]}
      testID={testID}
    >
      {icon ? <MaterialCommunityIcons color={iconColor[resolved]} name={icon} size={18} /> : null}
      {children != null && children !== "" ? (
        <Text className={cn("text-sm font-medium", labelClassName)} style={labelStyles[resolved]}>
          {children}
        </Text>
      ) : null}
    </Pressable>
  );
}

type IconButtonProps = {
  accessibilityLabel: string;
  className?: string;
  disabled?: boolean;
  icon?: IconName;
  name?: IconName;
  onPress?: () => void;
  testID?: string;
  variant?: ButtonVariant;
};

export function IconButton({
  accessibilityLabel,
  className,
  disabled = false,
  icon,
  name,
  onPress,
  testID,
  variant = "ghost",
}: IconButtonProps) {
  const resolvedIcon = name ?? icon;
  if (!resolvedIcon) {
    throw new Error("IconButton requires name or icon");
  }
  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      className={className}
      disabled={disabled}
      icon={resolvedIcon}
      onPress={onPress}
      size="icon"
      testID={testID}
      variant={variant}
    />
  );
}
