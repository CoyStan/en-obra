import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { cn } from "./utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost";

type BadgeProps = {
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  testID?: string;
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary",
  secondary: "border-transparent bg-secondary",
  destructive: "border-transparent bg-due-wash",
  outline: "border-border bg-background",
  ghost: "border-transparent bg-muted",
};

const labelVariants: Record<BadgeVariant, string> = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  destructive: "text-destructive",
  outline: "text-foreground",
  ghost: "text-muted-foreground",
};

export function Badge({
  children,
  className,
  labelClassName,
  testID,
  variant = "secondary",
}: BadgeProps) {
  return (
    <View
      className={cn(
        "h-6 flex-row items-center gap-1 self-start rounded-full border px-2.5",
        variants[variant],
        className,
      )}
      testID={testID}
    >
      <Text className={cn("text-xs font-medium", labelVariants[variant], labelClassName)}>{children}</Text>
    </View>
  );
}
