import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text,
  type AccessibilityRole,
  View,
} from "react-native";
import { colors } from "../../theme/theme";
import { cn } from "./utils";

type SelectPanelProps = {
  children: ReactNode;
  className?: string;
  open: boolean;
  testID?: string;
};

export function SelectPanel({ children, className, open, testID }: SelectPanelProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
      toValue: open ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  if (!open) {
    return null;
  }

  return (
    <Animated.View
      className={cn("gap-ccXs rounded-ccLg border border-border bg-surface p-ccXs", className)}
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-6, 0],
            }),
          },
        ],
      }}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
}

type SelectOptionRowProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  leading?: ReactNode;
  meta?: string;
  onPress: () => void;
  role?: AccessibilityRole;
  selected?: boolean;
  testID?: string;
  title: string;
  trailing?: ReactNode;
};

export function SelectOptionRow({
  accessibilityLabel,
  disabled = false,
  leading,
  meta,
  onPress,
  role = "button",
  selected = false,
  testID,
  title,
  trailing,
}: SelectOptionRowProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole={role}
      accessibilityState={{ checked: selected, disabled }}
      className={cn(
        "min-h-[48px] flex-row items-center gap-ccSm rounded-ccMd px-ccSm py-ccXs active:opacity-80",
        selected ? "bg-success-wash" : "bg-surface",
        disabled && "opacity-55",
      )}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      testID={testID}
    >
      {leading}
      <View className="min-w-0 flex-1">
        <Text className={cn("text-ccSmall font-bold text-ink", selected && "text-primary-dark")}>
          {title}
        </Text>
        {meta ? <Text className="text-ccMicro text-muted-ink">{meta}</Text> : null}
      </View>
      {trailing ?? (
        <MaterialCommunityIcons
          color={selected ? colors.primary : colors.mutedInk}
          name={selected ? "check-circle" : "circle-outline"}
          size={19}
        />
      )}
    </Pressable>
  );
}
