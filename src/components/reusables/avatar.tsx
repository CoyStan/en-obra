import { Text, View } from "react-native";
import { cn } from "./utils";

type AvatarProps = {
  className?: string;
  color: string;
  label: string;
  testID?: string;
};

export function Avatar({ className, color, label, testID }: AvatarProps) {
  return (
    <View
      className={cn("h-9 w-9 items-center justify-center rounded-[18px]", className)}
      style={{ backgroundColor: color }}
      testID={testID}
    >
      <Text className="text-ccSmall font-bold text-surface">
        {label.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}
