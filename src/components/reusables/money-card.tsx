import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps, type ReactNode } from "react";
import { Text, View } from "react-native";
import { colors } from "../../theme/theme";
import { Amount } from "./amount";
import { Pill } from "./pill";
import { Surface } from "./surface";
import { cn } from "./utils";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type MoneyCardProps = {
  action?: ReactNode;
  cents: number;
  className?: string;
  icon?: IconName;
  label: string;
  meta?: string;
  pill?: string;
  testID?: string;
  title: string;
  tone?: "neutral" | "success" | "due";
};

export function MoneyCard({
  action,
  cents,
  className,
  icon = "cash-multiple",
  label,
  meta,
  pill,
  testID,
  title,
  tone = "neutral",
}: MoneyCardProps) {
  return (
    <Surface
      className={cn("gap-ccSm", className)}
      testID={testID}
      tone={tone === "success" ? "strong" : "default"}
    >
      <View className="flex-row items-start justify-between gap-ccMd">
        <View className="flex-row flex-1 items-center gap-ccSm">
          <View className="h-10 w-10 items-center justify-center rounded-ccMd bg-surface-strong">
            <MaterialCommunityIcons
              color={tone === "due" ? colors.due : colors.primaryDark}
              name={icon}
              size={19}
            />
          </View>
          <View className="flex-1">
            <Text className="text-ccMicro font-bold uppercase text-muted-ink">{label}</Text>
            <Text className="text-ccBody font-bold text-ink">{title}</Text>
          </View>
        </View>
        {pill ? <Pill label={pill} tone={tone === "due" ? "due" : "success"} /> : null}
      </View>
      <View className="flex-row items-end justify-between gap-ccMd">
        <View className="flex-1">
          {meta ? <Text className="text-ccSmall text-muted-ink">{meta}</Text> : null}
        </View>
        <Amount
          cents={cents}
          className="text-right"
          emphasis
          testID={testID ? `${testID}-amount` : undefined}
          tone={tone === "success" ? "success" : tone === "due" ? "due" : "neutral"}
        />
      </View>
      {action ? <View className="pt-ccXs">{action}</View> : null}
    </Surface>
  );
}
