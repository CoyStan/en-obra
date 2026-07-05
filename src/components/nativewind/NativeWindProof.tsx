import { Text, View } from "react-native";

export function NativeWindProof() {
  return (
    <View
      accessibilityElementsHidden
      className="hidden h-0 w-0 bg-primary"
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      <Text className="text-ccMicro font-bold text-primary-dark">NativeWind ready</Text>
    </View>
  );
}
