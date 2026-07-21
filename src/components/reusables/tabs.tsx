import { type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "./utils";

type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  className?: string;
  onChange: (id: string) => void;
  tabs: TabItem[];
  testID?: string;
  value: string;
};

export function Tabs({ className, onChange, tabs, testID, value }: TabsProps) {
  return (
    <View className={cn("flex-row gap-1 rounded-xl bg-muted p-1", className)} testID={testID}>
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={cn(
              "min-h-[40px] flex-1 items-center justify-center rounded-lg px-2",
              selected && "bg-background",
            )}
            key={tab.id}
            onPress={() => onChange(tab.id)}
          >
            <Text className={cn("text-sm font-medium", selected ? "text-foreground" : "text-muted-foreground")}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TabsContent({
  active,
  children,
  id,
}: {
  active: string;
  children: ReactNode;
  id: string;
}) {
  if (active !== id) return null;
  return <View className="pt-3">{children}</View>;
}
