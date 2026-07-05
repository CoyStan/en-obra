import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { type DimensionValue, Pressable, Text, View } from "react-native";
import { colors } from "../../theme/theme";
import { Avatar } from "./avatar";
import { Pill } from "./pill";
import { cn } from "./utils";

type BalanceTone = "success" | "due" | "neutral";

type HomeMoneyInstrumentProps = {
  amountText: string;
  compact?: boolean;
  currencyLabel?: string;
  flow: ReactNode;
  identity: {
    avatarColor: string;
    label: string;
    meta: string;
    onPress: () => void;
  };
  openLabel: string;
  openPercent: DimensionValue;
  routeAmount: string;
  routeCaption: string;
  routeTitle: string;
  spentLabel: string;
  stateLabel: string;
  testID?: string;
  tone?: BalanceTone;
};

export function HomeMoneyInstrument({
  amountText,
  compact = false,
  currencyLabel = "MXN",
  flow,
  identity,
  openLabel,
  openPercent,
  routeAmount,
  routeCaption,
  routeTitle,
  spentLabel,
  stateLabel,
  testID,
  tone = "success",
}: HomeMoneyInstrumentProps) {
  const due = tone === "due";
  const neutral = tone === "neutral";
  return (
    <View
      className={cn(
        "gap-ccMd rounded-ccLg border border-border bg-surface p-ccMd",
        due && "bg-due-wash",
      )}
      testID={testID}
    >
      <View className="flex-row items-start justify-between gap-ccMd">
        <View className="min-w-0 flex-1 gap-ccSm">
          <Pressable
            accessibilityHint="Abre perfil o cambia tu integrante del grupo."
            accessibilityLabel={identity.label}
            accessibilityRole="button"
            className="min-h-[46px] flex-row items-center gap-ccSm rounded-ccMd bg-surface px-ccSm py-ccXs active:bg-surface-strong"
            hitSlop={4}
            onPress={identity.onPress}
          >
            <Avatar color={identity.avatarColor} label={identity.label} />
            <View className="min-w-0 flex-1">
              <Text className="text-ccSmall font-extrabold text-ink" numberOfLines={1}>
                {identity.label}
              </Text>
              <Text className="text-ccMicro font-semibold text-muted-ink" numberOfLines={1}>
                {identity.meta}
              </Text>
            </View>
            <MaterialCommunityIcons color={colors.primaryDark} name="chevron-down" size={18} />
          </Pressable>
          <View>
            <Text className="text-ccMicro font-bold uppercase text-muted-ink">Tu balance</Text>
            <Text className={cn("text-ccHeading font-extrabold text-primary-dark", due && "text-due", neutral && "text-ink")}>
              {stateLabel}
            </Text>
          </View>
        </View>
        <View className="max-w-[50%] items-end">
          <Text className="text-ccMicro font-extrabold text-muted-ink">{currencyLabel}</Text>
          <Text
            adjustsFontSizeToFit
            className={cn(
              "text-right text-[42px] font-extrabold text-primary",
              compact && "text-[36px]",
              due && "text-due",
              neutral && "text-ink",
            )}
            minimumFontScale={0.72}
            numberOfLines={1}
          >
            {amountText}
          </Text>
        </View>
      </View>

      <View className="gap-ccSm rounded-ccMd border border-border bg-surface p-ccSm">
        <View className="flex-row items-start justify-between gap-ccMd">
          <View className="min-w-0 flex-1">
            <Text className="text-ccMicro font-bold uppercase text-muted-ink">Quién le debe a quién</Text>
            <Text className="text-ccBody font-extrabold text-ink" numberOfLines={1}>
              {routeTitle}
            </Text>
          </View>
          <Text className={cn("text-right text-ccSmall font-extrabold text-primary-dark", due && "text-due")}>
            {routeAmount}
          </Text>
        </View>
        {flow}
        <View className="flex-row items-center gap-ccXs">
          <Pill label="Sin pagos reales" tone="neutral" />
          <Text className="min-w-0 flex-1 text-ccMicro font-semibold text-muted-ink" numberOfLines={2}>
            {routeCaption}
          </Text>
        </View>
      </View>

      <View className="gap-ccXs">
        <View className="flex-row items-center justify-between gap-ccMd">
          <Text className="text-ccMicro font-bold text-muted-ink">{spentLabel}</Text>
          <Text className={cn("text-right text-ccMicro font-extrabold text-primary", due && "text-due")}>
            {openLabel}
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-[4px] bg-surface-strong">
          <View
            className={cn("h-2 rounded-[4px]", due ? "bg-due" : "bg-primary")}
            style={{ width: openPercent }}
          />
        </View>
      </View>
    </View>
  );
}
