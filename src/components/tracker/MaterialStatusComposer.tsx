import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Sheet, SheetContent, SheetFooter, SheetHeader } from "../reusables";
import { todayIsoDate } from "../../tracker/dates";
import { statusMeta } from "../../tracker/presentation";
import { trackerColors as color } from "../../tracker/theme";
import type { Material, MaterialStatus, MaterialStatusUpdateInput } from "../../tracker/types";
import { DatePickerField } from "./DatePickerField";

type MaterialStatusComposerProps = {
  material?: Material;
  onClose: () => void;
  onSave: (input: MaterialStatusUpdateInput) => void;
  visible: boolean;
};

const statuses: MaterialStatus[] = ["to_order", "ordered", "received", "installed"];

export function MaterialStatusComposer({ material, onClose, onSave, visible }: MaterialStatusComposerProps) {
  const [status, setStatus] = useState<MaterialStatus>(material?.status ?? "to_order");
  const [expectedOn, setExpectedOn] = useState<string | undefined>();
  const [receivedOn, setReceivedOn] = useState(todayIsoDate());
  const saveLock = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && material) {
      setStatus(material.status);
      setExpectedOn(material.expectedOn);
      setReceivedOn(material.receivedOn ?? todayIsoDate());
      saveLock.current = false;
      setIsSaving(false);
    }
  }, [material, visible]);

  const dismiss = () => onClose();
  const save = () => {
    if (saveLock.current) {
      return;
    }
    saveLock.current = true;
    setIsSaving(true);
    onSave({
      expectedOn: status === "ordered" ? expectedOn : undefined,
      receivedOn: status === "received" || status === "installed" ? receivedOn : undefined,
      status,
    });
    dismiss();
  };
  const selectedMeta = statusMeta[status];

  return (
    <Sheet onClose={dismiss} visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SheetHeader
          onClose={dismiss}
          subtitle="Elige lo que pasó. Nada cambia hasta guardar."
          title="Estado del material"
        >
          <Text className="text-sm font-bold text-primary" numberOfLines={1}>
            {material?.name ?? "Material"}
          </Text>
        </SheetHeader>
        <ScrollView keyboardShouldPersistTaps="handled">
          <SheetContent className="gap-2 pb-2">
          <View accessibilityRole="radiogroup" className="gap-2">
            {statuses.map((option) => {
              const meta = statusMeta[option];
              const selected = option === status;
              return (
                <Pressable
                  accessibilityHint={meta.description}
                  accessibilityLabel={`${meta.label}. ${meta.description}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className="min-h-[72px] flex-row items-center rounded-lg border p-3"
                  key={option}
                  onPress={() => setStatus(option)}
                  style={({ pressed }) => [
                    { borderColor: selected ? meta.color : undefined, backgroundColor: selected ? meta.wash : undefined },
                    pressed && { opacity: 0.68 },
                  ]}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: meta.wash }}>
                    <MaterialCommunityIcons color={meta.color} name={meta.icon} size={20} />
                  </View>
                  <View className="mx-3 min-w-0 flex-1">
                    <Text className="text-sm font-bold text-foreground">{meta.label}</Text>
                    <Text className="mt-0.5 text-xs leading-[17px] text-muted-foreground">{meta.description}</Text>
                  </View>
                  <View
                    className="h-[22px] w-[22px] items-center justify-center rounded-full border-2"
                    style={{ borderColor: selected ? meta.color : undefined }}
                  >
                    {selected ? <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
          {status === "ordered" ? (
            <View className="mt-1 rounded-lg bg-sun-wash p-3">
              <View className="mb-2 flex-row items-center gap-1.5">
                <MaterialCommunityIcons color={color.sun} name="truck-delivery-outline" size={18} />
                <Text className="flex-1 text-xs font-bold text-marigold">
                  Si el proveedor aún no da fecha, déjala vacía.
                </Text>
              </View>
              <DatePickerField clearable label="Entrega estimada" onChange={setExpectedOn} optional value={expectedOn} />
            </View>
          ) : null}
          {status === "received" || status === "installed" ? (
            <View className="mt-1 rounded-lg bg-blue-wash p-3">
              <View className="mb-2 flex-row items-center gap-1.5">
                <MaterialCommunityIcons color={color.blue} name="calendar-check-outline" size={18} />
                <Text className="flex-1 text-xs font-bold text-accent-blue">
                  {status === "installed"
                    ? "¿Cuándo llegó? La fecha queda registrada antes de marcarlo usado."
                    : "¿Cuándo llegó? Por defecto dejamos hoy."}
                </Text>
              </View>
              <DatePickerField
                label="Fecha de recepción"
                maximumDate={todayIsoDate()}
                onChange={(value) => value && setReceivedOn(value)}
                value={receivedOn}
              />
            </View>
          ) : null}
          </SheetContent>
        </ScrollView>
        <SheetFooter>
          <Button className="flex-1" onPress={dismiss} variant="outline">
            Cancelar
          </Button>
          <Button
            accessibilityLabel={`Guardar estado ${selectedMeta.label}`}
            className="flex-[1.25]"
            disabled={isSaving}
            icon="check"
            onPress={save}
          >
            {isSaving ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      </KeyboardAvoidingView>
    </Sheet>
  );
}
