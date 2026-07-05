import { type ReactNode } from "react";
import { Pressable, Text } from "react-native";
import { cn } from "./utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
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
        "min-h-[44px] flex-row items-center justify-center rounded-ccMd px-ccMd py-ccSm active:opacity-80",
        variants[variant],
        disabled && "opacity-45",
        className,
      )}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    >
      <Text className={cn("text-ccSmall font-bold", labelVariants[variant], labelClassName)}>
        {children}
      </Text>
    </Pressable>
  );
}
