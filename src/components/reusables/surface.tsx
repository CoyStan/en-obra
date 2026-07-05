import { type ReactNode } from "react";
import { View } from "react-native";
import { cn } from "./utils";

type SurfaceTone = "default" | "soft" | "strong";

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  testID?: string;
  tone?: SurfaceTone;
};

const tones: Record<SurfaceTone, string> = {
  default: "border-border bg-surface",
  soft: "border-border bg-surface-tinted",
  strong: "border-primary/20 bg-success-wash",
};

export function Surface({ children, className, testID, tone = "default" }: SurfaceProps) {
  return (
    <View
      className={cn("rounded-ccLg border p-ccMd", tones[tone], className)}
      testID={testID}
    >
      {children}
    </View>
  );
}
