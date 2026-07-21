import { type ReactNode } from "react";
import { Text } from "react-native";
import { cn } from "./utils";

type LabelProps = {
  children: ReactNode;
  className?: string;
};

export function Label({ children, className }: LabelProps) {
  return <Text className={cn("text-sm font-medium text-foreground", className)}>{children}</Text>;
}
