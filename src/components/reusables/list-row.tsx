import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps, type ReactNode } from "react";
import { Text, View } from "react-native";
import { colors } from "../../theme/theme";
import { Amount } from "./amount";
import { Avatar } from "./avatar";
import { Pill } from "./pill";
import { Surface } from "./surface";
import { cn } from "./utils";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type RowAmountTone = "neutral" | "success" | "due";

type RowShellProps = {
  children: ReactNode;
  className?: string;
  testID?: string;
};

function RowShell({ children, className, testID }: RowShellProps) {
  return (
    <Surface className={cn("p-ccSm", className)} testID={testID}>
      <View className="min-h-[52px] flex-row items-center gap-ccSm">{children}</View>
    </Surface>
  );
}

type PersonRowProps = {
  amountCents?: number;
  amountTone?: RowAmountTone;
  avatarColor: string;
  badge?: string;
  className?: string;
  meta?: string;
  name: string;
  testID?: string;
};

export function PersonRow({
  amountCents,
  amountTone = "neutral",
  avatarColor,
  badge,
  className,
  meta,
  name,
  testID,
}: PersonRowProps) {
  return (
    <RowShell className={className} testID={testID}>
      <Avatar color={avatarColor} label={name} />
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center gap-ccXs">
          <Text className="text-ccBody font-bold text-ink">{name}</Text>
          {badge ? <Pill label={badge} tone={amountTone === "due" ? "due" : "success"} /> : null}
        </View>
        {meta ? <Text className="text-ccSmall text-muted-ink">{meta}</Text> : null}
      </View>
      {typeof amountCents === "number" ? (
        <Amount cents={amountCents} className="max-w-[42%] text-right" tone={amountTone} />
      ) : null}
    </RowShell>
  );
}

type GroupRowProps = {
  amountCents?: number;
  className?: string;
  icon?: IconName;
  meta: string;
  rightLabel?: string;
  testID?: string;
  title: string;
};

export function GroupRow({
  amountCents,
  className,
  icon = "account-group",
  meta,
  rightLabel,
  testID,
  title,
}: GroupRowProps) {
  return (
    <RowShell className={className} testID={testID}>
      <View className="h-9 w-9 items-center justify-center rounded-ccMd bg-surface-strong">
        <MaterialCommunityIcons color={colors.primaryDark} name={icon} size={18} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-ccBody font-bold text-ink">{title}</Text>
        <Text className="text-ccSmall text-muted-ink">{meta}</Text>
      </View>
      <View className="items-end gap-ccXs">
        {rightLabel ? <Pill label={rightLabel} tone="neutral" /> : null}
        {typeof amountCents === "number" ? (
          <Amount cents={amountCents} className="text-right" tone={amountCents >= 0 ? "success" : "due"} />
        ) : null}
      </View>
    </RowShell>
  );
}

type AuditRowProps = {
  amountCents?: number;
  amountTone?: RowAmountTone;
  className?: string;
  icon?: IconName;
  meta: string;
  testID?: string;
  title: string;
};

export function AuditRow({
  amountCents,
  amountTone = "neutral",
  className,
  icon = "history",
  meta,
  testID,
  title,
}: AuditRowProps) {
  return (
    <RowShell className={cn("border-transparent bg-transparent px-0 py-ccXs", className)} testID={testID}>
      <View className="h-8 w-8 items-center justify-center rounded-ccSm bg-surface-strong">
        <MaterialCommunityIcons color={colors.mutedInk} name={icon} size={16} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-ccSmall font-bold text-ink">{title}</Text>
        <Text className="text-ccMicro text-muted-ink">{meta}</Text>
      </View>
      {typeof amountCents === "number" ? (
        <Amount cents={amountCents} className="text-right text-ccMicro" tone={amountTone} />
      ) : null}
    </RowShell>
  );
}
