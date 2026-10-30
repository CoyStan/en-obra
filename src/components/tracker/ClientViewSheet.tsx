import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { Button, Card, CardContent, Separator, Sheet, SheetContent, SheetFooter, SheetHeader } from "../reusables";
import { MaterialRow, MaterialsProgress } from "./MaterialRow";
import { formatDisplayDate } from "../../domain/en-obra/dates";
import { clientReadyCount, latestReceiptDate } from "../../domain/en-obra/status";
import { clientUpdateMessage } from "../../domain/en-obra/whatsapp";
import { trackerColors as color } from "../../tracker/theme";
import type { Material, Project } from "../../tracker/types";

const whatsApp = {
  chat: "#efeae2",
  bubble: "#d9fdd3",
  ink: "#111b21",
  meta: "#667781",
  tick: "#53bdeb",
};

function MessagePreview({ text }: { text: string }) {
  return (
    <View className="rounded-xl p-3" style={{ backgroundColor: whatsApp.chat }}>
      <View
        accessibilityLabel={`Mensaje que se enviará: ${text}`}
        className="ml-8 self-end rounded-lg rounded-tr-none px-3 pb-1.5 pt-2"
        style={{ backgroundColor: whatsApp.bubble }}
      >
        <Text className="text-[13px] leading-[19px]" style={{ color: whatsApp.ink }}>
          {text}
        </Text>
        <View className="mt-1 flex-row items-center justify-end gap-1">
          <Text className="text-[10px]" style={{ color: whatsApp.meta }}>
            Ahora
          </Text>
          <MaterialCommunityIcons color={whatsApp.tick} name="check-all" size={14} />
        </View>
      </View>
    </View>
  );
}

export function ClientViewSheet({
  project,
  materials,
  visible,
  isDemo,
  onClose,
  onWhatsApp,
}: {
  project?: Project;
  materials: Material[];
  visible: boolean;
  isDemo: boolean;
  onClose: () => void;
  onWhatsApp: () => void;
}) {
  if (!project) return null;
  const sortedByUpdated = [...materials].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const readyCount = clientReadyCount(materials);
  const lastReceipt = latestReceiptDate(materials);

  return (
    <Sheet onClose={onClose} visible={visible}>
      <SheetHeader
        onClose={onClose}
        subtitle="Así verá el avance el cliente. Sin costos ni pendientes internos."
        title={`Vista cliente · ${project.clientName}`}
      />
      <ScrollView>
        <SheetContent className="gap-4">
          <Card className="border-0 bg-sun-wash">
            <CardContent>
              <Text className="text-base font-extrabold text-primary-dark">
                Hola, {project.clientName.split(" ")[0]}.
              </Text>
              <Text className="mt-1 text-[13px] leading-[19px] text-primary-dark">
                Avance de "{project.name}" · {project.address || "Dirección por confirmar"}
              </Text>
              {lastReceipt ? (
                <Text className="mt-1 text-[11px] text-marigold">
                  Última actualización: {formatDisplayDate(lastReceipt)}
                </Text>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <MaterialsProgress materials={materials} />
              <Text className="mt-2 text-xs text-muted-foreground">
                {readyCount} de {materials.length} materiales recibidos o instalados
              </Text>
            </CardContent>
          </Card>
          <View className="gap-2">
            <Text className="text-[15px] font-extrabold text-foreground">Mensaje de WhatsApp</Text>
            <MessagePreview text={clientUpdateMessage(project, materials)} />
          </View>
          <Text className="text-[15px] font-extrabold text-foreground">Materiales del trabajo</Text>
          <Card className="overflow-hidden py-0">
            {sortedByUpdated.length ? (
              sortedByUpdated.map((material, index) => (
                <View key={material.id}>
                  {index > 0 ? <Separator /> : null}
                  <MaterialRow clientView material={material} />
                </View>
              ))
            ) : (
              <View className="items-center p-6">
                <Text className="text-[15px] font-extrabold text-foreground">
                  Preparando la lista de materiales
                </Text>
                <Text className="mt-1 text-center text-[13px] leading-[19px] text-muted-foreground">
                  Aquí aparecerán las entregas cuando las registres.
                </Text>
              </View>
            )}
          </Card>
          <View className="mx-2 flex-row items-start gap-2">
            <MaterialCommunityIcons color={color.inkMuted} name="information-outline" size={16} />
            <Text className="flex-1 text-xs leading-[17px] text-muted-foreground">
              Esta vista solo informa el avance. No procesa pagos.
            </Text>
          </View>
          {isDemo ? (
            <View className="rounded-xl bg-sun-wash p-3">
              <Text className="text-xs font-bold text-marigold">
                Modo ejemplo: el número de demo no es real y el mensaje no se enviará.
              </Text>
            </View>
          ) : null}
        </SheetContent>
      </ScrollView>
      <SheetFooter>
        <Button className="flex-1" icon="whatsapp" onPress={onWhatsApp}>
          Enviar actualización por WhatsApp
        </Button>
      </SheetFooter>
    </Sheet>
  );
}
