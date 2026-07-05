import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps, type ReactNode } from "react";
import { Text, View } from "react-native";
import { colors } from "../../theme/theme";
import { Pill } from "./pill";
import { cn } from "./utils";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type ComposerSectionProps = {
  badge?: string;
  children: ReactNode;
  className?: string;
  icon?: IconName;
  meta?: string;
  testID?: string;
  title: string;
};

export function ComposerSection({
  badge,
  children,
  className,
  icon = "receipt-text-outline",
  meta,
  testID,
  title,
}: ComposerSectionProps) {
  return (
    <View className={cn("gap-ccMd rounded-ccLg border border-border bg-surface p-ccMd", className)} testID={testID}>
      <View className="flex-row items-start gap-ccSm">
        <View className="h-9 w-9 items-center justify-center rounded-ccMd bg-surface-strong">
          <MaterialCommunityIcons color={colors.primaryDark} name={icon} size={18} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-ccBody font-extrabold text-ink" numberOfLines={1}>
            {title}
          </Text>
          {meta ? (
            <Text className="text-ccSmall font-semibold text-muted-ink" numberOfLines={2}>
              {meta}
            </Text>
          ) : null}
        </View>
        {badge ? <Pill label={badge} tone="neutral" /> : null}
      </View>
      {children}
    </View>
  );
}

type ComposerSaveDockProps = {
  action: ReactNode;
  body: string;
  testID?: string;
  title: string;
};

export function ComposerSaveDock({ action, body, testID, title }: ComposerSaveDockProps) {
  return (
    <View
      className="flex-row items-center gap-ccMd rounded-ccLg border border-primary/20 bg-success-wash p-ccMd"
      testID={testID}
    >
      <View className="min-w-0 flex-1">
        <Text className="text-ccSmall font-extrabold text-primary-dark">{title}</Text>
        <Text className="text-ccMicro font-semibold text-muted-ink">{body}</Text>
      </View>
      {action}
    </View>
  );
}
