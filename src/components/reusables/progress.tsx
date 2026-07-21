import { Text, View } from "react-native";
import { cn } from "./utils";

type ProgressProps = {
  className?: string;
  label?: string;
  max?: number;
  testID?: string;
  value: number;
  valueLabel?: string;
};

export function Progress({
  className,
  label,
  max = 100,
  testID,
  value,
  valueLabel,
}: ProgressProps) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <View
      accessibilityLabel={label ? `${label}: ${valueLabel ?? `${pct}%`}` : undefined}
      className={cn("gap-2", className)}
      testID={testID}
    >
      {(label || valueLabel) && (
        <View className="flex-row items-center justify-between">
          {label ? <Text className="text-sm font-medium text-foreground">{label}</Text> : <View />}
          {valueLabel ? <Text className="text-sm text-muted-foreground">{valueLabel}</Text> : null}
        </View>
      )}
      <View className="h-2 overflow-hidden rounded-full bg-secondary">
        <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}
