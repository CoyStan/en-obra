import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button, Card, CardContent, Sheet, SheetContent, SheetHeader } from "../reusables";
import { trackerColors as color } from "../../tracker/theme";

export function SettingsSheet({
  visible,
  onClose,
  onEraseAll,
  onExportJson,
}: {
  visible: boolean;
  onClose: () => void;
  onEraseAll: () => Promise<void>;
  onExportJson: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    if (!visible) {
      setConfirming(false);
      setErasing(false);
    }
  }, [visible]);

  const handleErase = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setErasing(true);
    await onEraseAll();
    onClose();
  };

  return (
    <Sheet onClose={onClose} visible={visible}>
      <SheetHeader
        onClose={onClose}
        subtitle="Datos y privacidad"
        title="Configuración"
      />
      <ScrollView>
        <SheetContent className="gap-4">
          <Card>
            <CardContent className="gap-3">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons color={color.forest} name="export-variant" size={20} />
                <Text className="flex-1 text-[13px] font-extrabold text-foreground">
                  Exportar mis datos
                </Text>
              </View>
              <Text className="text-xs leading-[17px] text-muted-foreground">
                Descarga una copia de todos tus trabajos, materiales y proveedores en formato JSON.
              </Text>
              <Button icon="export-variant" onPress={onExportJson} variant="secondary">
                Exportar JSON
              </Button>
            </CardContent>
          </Card>
          <Card className="border border-destructive/40">
            <CardContent className="gap-3">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons color={color.destructive} name="delete-forever-outline" size={20} />
                <Text className="flex-1 text-[13px] font-extrabold text-destructive">
                  Borrar todos mis datos
                </Text>
              </View>
              <Text className="text-xs leading-[17px] text-muted-foreground">
                Elimina permanentemente todos los trabajos, materiales y proveedores. Esta acción no se puede deshacer.
              </Text>
              {confirming ? (
                <View className="gap-2">
                  <Text className="text-xs font-bold text-destructive">
                    ¿Estás seguro? Esta acción es irreversible.
                  </Text>
                  <View className="flex-row gap-2">
                    <Button
                      className="flex-1"
                      onPress={() => setConfirming(false)}
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={erasing}
                      icon="delete-forever-outline"
                      onPress={handleErase}
                      variant="destructive"
                    >
                      {erasing ? "Borrando…" : "Confirmar"}
                    </Button>
                  </View>
                </View>
              ) : (
                <Button
                  icon="delete-forever-outline"
                  onPress={handleErase}
                  variant="destructive"
                >
                  Borrar todos mis datos
                </Button>
              )}
            </CardContent>
          </Card>
        </SheetContent>
      </ScrollView>
    </Sheet>
  );
}
