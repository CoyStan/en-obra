import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "../../theme/theme";
import { Pill } from "./pill";
import { cn } from "./utils";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type ShellAction = {
  accessibilityLabel: string;
  icon: IconName;
  onPress: () => void;
};

type AppTopBarProps = {
  actions: ShellAction[];
  compact?: boolean;
  subtitle: string;
  testID?: string;
  title: string;
};

export function AppTopBar({
  actions,
  compact = false,
  subtitle,
  testID,
  title,
}: AppTopBarProps) {
  return (
    <View className="min-h-[52px] flex-row items-center justify-between gap-ccSm" testID={testID}>
      <View className="min-w-0 flex-1 flex-row items-center gap-ccSm">
        <View className="h-[38px] w-[38px] items-center justify-center rounded-ccLg bg-primary">
          <MaterialCommunityIcons color={colors.surface} name="scale-balance" size={19} />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className={cn("text-ccTitle font-extrabold text-ink", compact && "text-[22px]")}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text className="text-ccMicro font-bold text-muted-ink" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-ccXs">
        {actions.map((action) => (
          <Pressable
            accessibilityLabel={action.accessibilityLabel}
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-ccMd active:bg-surface-strong"
            hitSlop={4}
            key={action.accessibilityLabel}
            onPress={action.onPress}
          >
            <MaterialCommunityIcons color={colors.primaryDark} name={action.icon} size={22} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

type WorkspaceContextBarProps = {
  compact?: boolean;
  icon?: IconName;
  onSwitch: () => void;
  subtitle: string;
  switchLabel: string;
  testID?: string;
  title: string;
};

export function WorkspaceContextBar({
  compact = false,
  icon = "account-group",
  onSwitch,
  subtitle,
  switchLabel,
  testID,
  title,
}: WorkspaceContextBarProps) {
  return (
    <View
      className={cn(
        "min-h-[54px] flex-row items-center gap-ccSm rounded-ccLg border border-border bg-surface px-ccSm py-ccXs",
        compact && "min-h-[50px]",
      )}
      testID={testID}
    >
      <View className="h-8 w-8 items-center justify-center rounded-ccMd bg-surface-strong">
        <MaterialCommunityIcons color={colors.primaryDark} name={icon} size={18} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-ccMicro font-bold uppercase text-muted-ink">Grupo activo</Text>
        <Text className="text-ccSmall font-extrabold text-ink" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-ccMicro font-semibold text-muted-ink" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={switchLabel === "Cambiar" ? "Cambiar grupo activo" : "Elegir grupo"}
        accessibilityRole="button"
        className="min-h-[36px] flex-row items-center gap-ccXs rounded-ccMd border border-border bg-surface px-ccSm active:bg-surface-strong"
        hitSlop={4}
        onPress={onSwitch}
      >
        <MaterialCommunityIcons color={colors.primaryDark} name="swap-horizontal" size={15} />
        <Text className="text-ccMicro font-extrabold text-primary-dark">{switchLabel}</Text>
      </Pressable>
    </View>
  );
}

type BottomTab = {
  accessibilityLabel: string;
  active: boolean;
  disabled?: boolean;
  icon: IconName;
  id: string;
  label: string;
  scoped?: boolean;
};

type BottomTabBarProps = {
  children?: ReactNode;
  compact?: boolean;
  onPressTab: (id: string) => void;
  tabs: BottomTab[];
  testID?: string;
};

export function BottomTabBar({
  children,
  compact = false,
  onPressTab,
  tabs,
  testID,
}: BottomTabBarProps) {
  return (
    <View className="border-t border-border bg-surface px-ccXs pb-ccSm pt-ccXs" testID={testID}>
      <View className="flex-row gap-ccXs">
        {tabs.map((tab) => (
          <Pressable
            accessibilityLabel={tab.accessibilityLabel}
            accessibilityRole="tab"
            accessibilityState={{ disabled: Boolean(tab.disabled), selected: tab.active }}
            className={cn(
              "min-h-[48px] flex-1 items-center justify-center gap-ccXs rounded-ccLg px-ccXs py-ccSm active:bg-surface-strong",
              tab.id === "groups" && "bg-canvas",
              tab.scoped && "border border-primary/10",
              tab.active && "bg-success-wash",
              tab.disabled && "opacity-50",
            )}
            disabled={tab.disabled}
            hitSlop={4}
            key={tab.id}
            onPress={() => onPressTab(tab.id)}
          >
            <MaterialCommunityIcons
              color={tab.disabled ? colors.mutedInk : colors.primaryDark}
              name={tab.icon}
              size={20}
            />
            {tab.scoped ? <View className="-mt-ccXs h-[3px] w-[14px] rounded-[2px] bg-primary" /> : null}
            <Text
              className={cn(
                "text-ccMicro font-semibold text-primary-dark",
                compact && "text-[11px]",
                tab.active && "font-extrabold",
                tab.disabled && "text-muted-ink",
              )}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {children}
    </View>
  );
}

type LocalTrustStripProps = {
  label?: string;
  testID?: string;
};

export function LocalTrustStrip({ label = "Sin pagos reales", testID }: LocalTrustStripProps) {
  return (
    <View className="mt-ccXs flex-row items-center justify-center gap-ccXs" testID={testID}>
      <MaterialCommunityIcons color={colors.mutedInk} name="shield-check-outline" size={13} />
      <Pill label={label} tone="neutral" />
    </View>
  );
}
