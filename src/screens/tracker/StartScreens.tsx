import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/reusables";
import { trackerColors as color } from "../../tracker/theme";

export function BootSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1" style={{ backgroundColor: color.canvas, paddingTop: insets.top }}>
      <View className="flex-1 gap-4 p-4 pt-[70px]">
        <View className="h-7 w-[62%] rounded-md bg-muted" />
        <View className="h-4 w-[44%] rounded-md bg-muted" />
        <View className="h-[132px] rounded-xl bg-muted" />
        <View className="h-[132px] rounded-xl bg-muted" />
      </View>
    </View>
  );
}

const highlights: { icon: ComponentProps<typeof MaterialCommunityIcons>["name"]; text: string }[] = [
  { icon: "truck-delivery-outline", text: "Qué falta pedir, qué viene en camino y qué ya llegó" },
  { icon: "store-outline", text: "Tus proveedores y el último acuerdo con cada uno" },
  { icon: "whatsapp", text: "Avances para tu cliente por WhatsApp, sin tus precios" },
];

export function WelcomeScreen({ onStart, onDemo }: { onStart: () => void; onDemo: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: color.canvas, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="w-full max-w-[420px] items-center">
        <View
          className="h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: color.primary }}
        >
          <MaterialCommunityIcons color={color.surface} name="hammer-wrench" size={34} />
        </View>
        <Text className="mt-5 text-[28px] font-extrabold tracking-tight text-foreground">
          En Obra
        </Text>
        <Text className="mt-2 text-center text-[15px] leading-[22px] text-muted-foreground">
          Controla pedidos, entregas y el avance de cada trabajo. Sin papeles, sin sorpresas.
        </Text>
        <View className="mt-7 w-full gap-3 rounded-2xl bg-card p-4">
          {highlights.map((item) => (
            <View className="flex-row items-center gap-3" key={item.icon}>
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-forest-wash">
                <MaterialCommunityIcons color={color.forest} name={item.icon} size={19} />
              </View>
              <Text className="flex-1 text-[13px] leading-[18px] text-foreground">{item.text}</Text>
            </View>
          ))}
        </View>
        <View className="mt-7 w-full gap-3">
          <Button className="w-full" icon="play" onPress={onStart}>
            Crear mi primer trabajo
          </Button>
          <Button className="w-full" icon="eye-outline" onPress={onDemo} variant="outline">
            Ver ejemplo
          </Button>
        </View>
        <Text className="mt-5 text-center text-[11px] text-muted-foreground">
          Tus datos se guardan solo en este dispositivo.
        </Text>
      </View>
    </View>
  );
}

export function RecoveryScreen({
  reason,
  onRetry,
  onExport,
}: {
  reason?: string | null;
  onRetry: () => void;
  onExport: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 px-5"
      style={{ backgroundColor: color.canvas, paddingTop: insets.top + 24, paddingBottom: insets.bottom }}
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <MaterialCommunityIcons color={color.destructive} name="alert-circle-outline" size={30} />
      </View>
      <Text className="mt-4 text-[22px] font-extrabold text-foreground">
        Problema al cargar los datos
      </Text>
      <Text className="mt-2 text-sm leading-[21px] text-muted-foreground">
        {reason ?? "Los datos no se pudieron leer. Puedes intentar de nuevo o exportar el respaldo."}
      </Text>
      <View className="mt-8 gap-3">
        <Button icon="refresh" onPress={onRetry}>
          Reintentar
        </Button>
        <Button icon="export-variant" onPress={onExport} variant="outline">
          Exportar respaldo de recuperación
        </Button>
      </View>
      <Text className="mt-6 text-xs leading-[18px] text-muted-foreground">
        La edición está bloqueada para proteger tus datos. Después de exportar el respaldo, puedes
        contactar soporte.
      </Text>
    </View>
  );
}
