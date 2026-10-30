import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { Label } from "./label";
import { cn } from "./utils";

type FieldProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  error?: string;
  label?: string;
  testID?: string;
};

export function Field({ children, className, description, error, label, testID }: FieldProps) {
  return (
    <View className={cn("gap-1.5", className)} testID={testID}>
      {label ? <Label>{label}</Label> : null}
      {children}
      {error ? (
        <Text className="text-xs font-medium text-destructive">{error}</Text>
      ) : description ? (
        <Text className="text-xs text-muted-foreground">{description}</Text>
      ) : null}
    </View>
  );
}
