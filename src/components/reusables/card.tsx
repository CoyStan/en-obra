import { type ReactNode } from "react";
import { View } from "react-native";
import { cn } from "./utils";

type CardProps = {
  children: ReactNode;
  className?: string;
  testID?: string;
};

export function Card({ children, className, testID }: CardProps) {
  return (
    <View
      className={cn("rounded-ccLg border border-border bg-surface p-ccMd", className)}
      testID={testID}
    >
      {children}
    </View>
  );
}
