import { type ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { cn } from "./utils";

type SheetProps = {
  children: ReactNode;
  onClose: () => void;
  testID?: string;
  visible: boolean;
};

export function Sheet({ children, onClose, testID, visible }: SheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end" testID={testID}>
        <Pressable
          accessibilityHint="Cierra sin guardar"
          accessibilityLabel="Cerrar"
          accessibilityRole="button"
          className="absolute inset-0 bg-black/40"
          onPress={onClose}
        />
        <View className="max-h-[92%] rounded-t-2xl border border-border bg-card pb-6 pt-2">{children}</View>
      </View>
    </Modal>
  );
}

export function SheetHeader({
  children,
  className,
  onClose,
  subtitle,
  title,
}: {
  children?: ReactNode;
  className?: string;
  onClose?: () => void;
  subtitle?: string;
  title?: string;
}) {
  return (
    <View className={cn("gap-2 border-b border-border px-4 pb-3 pt-1", className)}>
      <View className="items-center pb-1">
        <View className="h-1 w-10 rounded-full bg-muted" />
      </View>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          {title ? <Text className="text-lg font-semibold text-card-foreground">{title}</Text> : null}
          {subtitle ? <Text className="text-sm text-muted-foreground">{subtitle}</Text> : null}
          {children}
        </View>
        {onClose ? (
          <Pressable accessibilityLabel="Cerrar" accessibilityRole="button" className="min-h-[44px] min-w-[44px] items-center justify-center rounded-lg" onPress={onClose}>
            <Text className="text-lg text-muted-foreground">✕</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function SheetContent({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn("gap-3 px-4 pt-3", className)}>{children}</View>;
}

export function SheetFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn("flex-row gap-2 px-4 pt-4", className)}>{children}</View>;
}
