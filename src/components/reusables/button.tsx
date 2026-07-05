import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps, type ReactNode } from "react";
import { Pressable, Text } from "react-native";
import { colors } from "../../theme/theme";
import { cn } from "./utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type ButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: IconName;
  labelClassName?: string;
  onPress?: () => void;
  testID?: string;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "border border-border bg-surface-strong",
  ghost: "bg-transparent",
  danger: "border border-due bg-due-wash",
};

const labelVariants: Record<ButtonVariant, string> = {
  primary: "text-surface",
  secondary: "text-primary-dark",
  ghost: "text-primary-dark",
  danger: "text-due",
};

export function Button({
  children,
  className,
  disabled = false,
  icon,
  labelClassName,
  onPress,
  testID,
  variant = "primary",
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn(
        "min-h-[44px] flex-row items-center justify-center gap-ccXs rounded-ccMd px-ccMd py-ccSm active:opacity-80",
        variants[variant],
        disabled && "opacity-45",
        className,
      )}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    >
      {icon ? (
        <MaterialCommunityIcons
          color={variant === "primary" ? colors.surface : variant === "danger" ? colors.due : colors.primaryDark}
          name={icon}
          size={16}
        />
      ) : null}
      <Text className={cn("text-ccSmall font-bold", labelVariants[variant], labelClassName)}>
        {children}
      </Text>
    </Pressable>
  );
}

type IconButtonProps = {
  accessibilityLabel: string;
  className?: string;
  disabled?: boolean;
  icon: IconName;
  onPress?: () => void;
  testID?: string;
  variant?: ButtonVariant;
};

export function IconButton({
  accessibilityLabel,
  className,
  disabled = false,
  icon,
  onPress,
  testID,
  variant = "ghost",
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn(
        "min-h-[44px] min-w-[44px] items-center justify-center rounded-ccMd active:opacity-80",
        variants[variant],
        disabled && "opacity-45",
        className,
      )}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    >
      <MaterialCommunityIcons
        color={variant === "primary" ? colors.surface : variant === "danger" ? colors.due : colors.primaryDark}
        name={icon}
        size={19}
      />
    </Pressable>
  );
}
