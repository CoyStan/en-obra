import { Text } from "react-native";
import { cn } from "./utils";

type PillTone = "success" | "due" | "neutral" | "gold";

type PillProps = {
  className?: string;
  label: string;
  testID?: string;
  tone?: PillTone;
};

export function Pill({ className, label, testID, tone = "neutral" }: PillProps) {
  return (
    <Text
      className={cn(
        "self-start overflow-hidden rounded-ccSm px-ccSm py-ccXs text-ccMicro font-semibold",
        tone === "success" && "bg-success-wash text-primary-dark",
        tone === "due" && "bg-due-wash text-due",
        tone === "neutral" && "bg-surface-strong text-muted-ink",
        tone === "gold" && "bg-warm-wash text-primary-dark",
        className,
      )}
      testID={testID}
    >
      {label}
    </Text>
  );
}
