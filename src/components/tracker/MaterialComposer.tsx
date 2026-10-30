import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Button, Field, Input, Sheet, SheetContent, SheetFooter, SheetHeader } from "../reusables";
import { trackerColors as color } from "../../tracker/theme";
import type {
  Material,
  MaterialDetailsUpdateInput,
  NewMaterialInput,
  Supplier,
} from "../../tracker/types";

export type MaterialDraft = {
  name: string;
  quantity: string;
  supplierId?: string;
};

export function MaterialComposer({
  visible,
  suppliers,
  draft,
  material,
  onClose,
  onNewSupplier,
  onSave,
  onUpdate,
}: {
  visible: boolean;
  suppliers: Supplier[];
  draft?: MaterialDraft;
  material?: Material;
  onClose: (currentDraft?: MaterialDraft) => void;
  onNewSupplier: (currentDraft: MaterialDraft) => void;
  onSave: (input: NewMaterialInput) => boolean;
  onUpdate?: (input: MaterialDetailsUpdateInput) => boolean;
}) {
  const isEdit = Boolean(material);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const saveLock = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (material) {
        setName(material.name);
        setQuantity(material.quantity ?? "");
        setSupplierId(material.supplierId);
      } else if (draft) {
        setName(draft.name);
        setQuantity(draft.quantity);
        setSupplierId(draft.supplierId ?? suppliers[0]?.id);
      } else {
        setName("");
        setQuantity("");
        setSupplierId(suppliers[0]?.id);
      }
      saveLock.current = false;
      setIsSaving(false);
    }
  }, [draft, material, suppliers, visible]);

  const currentDraft = (): MaterialDraft => ({ name, quantity, supplierId });

  const dismiss = () => {
    setError(null);
    onClose();
  };

  const save = () => {
    if (saveLock.current) return;
    saveLock.current = true;
    setIsSaving(true);
    if (!name.trim()) {
      setError("Escribe el nombre del material.");
      saveLock.current = false;
      setIsSaving(false);
      return;
    }
    const details: MaterialDetailsUpdateInput = {
      name,
      quantity: quantity || undefined,
      supplierId: supplierId || undefined,
    };
    const saved = isEdit && onUpdate
      ? onUpdate(details)
      : onSave({ name, quantity: quantity || undefined, supplierId: supplierId || undefined });
    if (!saved) {
      setError("No se pudo guardar. Revisa los datos.");
      saveLock.current = false;
      setIsSaving(false);
      return;
    }
    if (!isEdit) {
      setName("");
      setQuantity("");
      setSupplierId(suppliers[0]?.id);
    }
    setError(null);
    onClose();
  };

  return (
    <Sheet onClose={dismiss} visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SheetHeader
          onClose={dismiss}
          subtitle={
            isEdit
              ? "Ajusta nombre, cantidad o proveedor."
              : "Solo el nombre es obligatorio."
          }
          title={isEdit ? "Editar material" : "Nuevo material"}
        />
        <ScrollView keyboardShouldPersistTaps="handled">
          <SheetContent>
            <Field label="Material">
              <Input
                autoComplete="off"
                autoFocus={!isEdit}
                onChangeText={setName}
                placeholder="Ej. Plantas de sombra…"
                value={name}
              />
            </Field>
            <Field description="Opcional" label="Cantidad">
              <Input
                autoComplete="off"
                onChangeText={setQuantity}
                placeholder="Ej. 18 piezas…"
                value={quantity}
              />
            </Field>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-[13px] font-extrabold text-foreground">Proveedor</Text>
              <Button
                className="h-auto min-h-[44px] px-1"
                icon="plus"
                onPress={() => onNewSupplier(currentDraft())}
                size="sm"
                variant="ghost"
              >
                Nuevo proveedor
              </Button>
            </View>
            {suppliers.length === 0 ? (
              <View className="rounded-lg bg-muted p-3">
                <Text className="text-xs text-muted-foreground">
                  Sin proveedores aún. Puedes agregar uno ahora o dejarlo vacío.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {/* None option */}
                <Pressable
                  accessibilityLabel="Sin proveedor"
                  accessibilityRole="radio"
                  accessibilityState={{ selected: !supplierId }}
                  className="min-h-[54px] flex-row items-center rounded-lg border px-3"
                  onPress={() => setSupplierId(undefined)}
                  style={({ pressed }) => [
                    !supplierId
                      ? { backgroundColor: color.forestWash, borderColor: color.forest }
                      : undefined,
                    pressed && { opacity: 0.68 },
                  ]}
                >
                  <View
                    className="h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px]"
                    style={{ borderColor: !supplierId ? color.forest : color.inkMuted }}
                  >
                    {!supplierId ? (
                      <View className="h-2 w-2 rounded-full bg-primary" />
                    ) : null}
                  </View>
                  <Text className="ml-3 text-[13px] font-extrabold text-muted-foreground">
                    Proveedor por definir
                  </Text>
                </Pressable>
                {suppliers.map((supplier) => {
                  const selected = supplier.id === supplierId;
                  return (
                    <Pressable
                      accessibilityHint="Asigna este proveedor al material"
                      accessibilityLabel={`${supplier.name}. ${supplier.category}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      className="min-h-[54px] flex-row items-center rounded-lg border px-3"
                      key={supplier.id}
                      onPress={() => setSupplierId(supplier.id)}
                      style={({ pressed }) => [
                        selected
                          ? { backgroundColor: color.forestWash, borderColor: color.forest }
                          : undefined,
                        pressed && { opacity: 0.68 },
                      ]}
                    >
                      <View
                        className="h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px]"
                        style={{ borderColor: selected ? color.forest : color.inkMuted }}
                      >
                        {selected ? <View className="h-2 w-2 rounded-full bg-primary" /> : null}
                      </View>
                      <View className="ml-3">
                        <Text className="text-[13px] font-extrabold text-foreground">
                          {supplier.name}
                        </Text>
                        {supplier.category ? (
                          <Text className="mt-0.5 text-[11px] text-muted-foreground">
                            {supplier.category}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {error ? (
              <Text
                accessibilityLiveRegion="polite"
                className="text-sm font-bold text-destructive"
              >
                {error}
              </Text>
            ) : null}
          </SheetContent>
        </ScrollView>
        <SheetFooter>
          <Button
            className="flex-1"
            disabled={isSaving}
            icon="arrow-right"
            onPress={save}
          >
            {isSaving ? "Guardando…" : isEdit ? "Guardar cambios" : "Agregar al trabajo"}
          </Button>
        </SheetFooter>
      </KeyboardAvoidingView>
    </Sheet>
  );
}
