import { type ReactNode } from "react";
import { Text, View, type ViewStyle } from "react-native";
import { cn } from "./utils";

type CardProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "sm";
  style?: ViewStyle;
  testID?: string;
};

export function Card({ children, className, size = "default", style, testID }: CardProps) {
  return (
    <View
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        size === "sm" ? "gap-2 py-3" : "gap-3 py-4",
        className,
      )}
      style={style}
      testID={testID}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn("gap-1 px-4", className)}>{children}</View>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn("text-base font-medium leading-snug text-card-foreground", className)}>{children}</Text>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn("text-sm text-muted-foreground", className)}>{children}</Text>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn("px-4", className)}>{children}</View>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn("flex-row items-center gap-2 border-t border-border px-4 pt-3", className)}>{children}</View>;
}
