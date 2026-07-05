import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps, useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { colors } from "../../theme/theme";
import { cn } from "./utils";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
type FeedbackTone = "success" | "neutral" | "due";

type FeedbackToastProps = {
  message: string;
  testID?: string;
  tone?: FeedbackTone;
  visible: boolean;
};

const toneClasses: Record<FeedbackTone, string> = {
  success: "border-primary/20 bg-success-wash",
  neutral: "border-border bg-surface",
  due: "border-due/25 bg-due-wash",
};

const toneIcons: Record<FeedbackTone, IconName> = {
  success: "check-circle-outline",
  neutral: "information-outline",
  due: "alert-circle-outline",
};

export function FeedbackToast({
  message,
  testID,
  tone = "success",
  visible,
}: FeedbackToastProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      duration: visible ? 220 : 160,
      easing: Easing.out(Easing.cubic),
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  if (!visible && !message) {
    return null;
  }

  return (
    <Animated.View
      className="absolute bottom-[86px] left-ccMd right-ccMd z-20"
      pointerEvents="none"
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
      testID={testID}
    >
      <View className={cn("flex-row items-center gap-ccSm rounded-ccLg border px-ccMd py-ccSm shadow-sm", toneClasses[tone])}>
        <MaterialCommunityIcons
          color={tone === "due" ? colors.due : colors.primaryDark}
          name={toneIcons[tone]}
          size={19}
        />
        <Text className="flex-1 text-ccSmall font-bold text-ink">{message}</Text>
      </View>
    </Animated.View>
  );
}
