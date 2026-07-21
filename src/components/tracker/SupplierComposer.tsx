import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { Button, Field, Input, Sheet, SheetContent, SheetFooter, SheetHeader } from "../reusables";
import type { NewSupplierInput, Supplier, SupplierUpdateInput } from "../../tracker/types";

type SupplierComposerProps = {
  onClose: () => void;
  onSave: (input: NewSupplierInput) => string | undefined;
  onUpdate?: (input: SupplierUpdateInput) => boolean;
  supplier?: Supplier;
  visible: boolean;
};

export function SupplierComposer({ onClose, onSave, onUpdate, supplier, visible }: SupplierComposerProps) {
  const isEdit = Boolean(supplier);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [lastContactNote, setLastContactNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const saveLock = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (supplier) {
        setName(supplier.name);
        setPhone(supplier.phone);
        setCategory(supplier.category);
        setLastContactNote(supplier.lastContactNote);
      } else {
        setName("");
        setPhone("");
        setCategory("");
        setLastContactNote("");
      }
      saveLock.current = false;
      setIsSaving(false);
    }
  }, [supplier, visible]);

  const close = () => {
    setError(null);
    onClose();
  };
  const save = () => {
    if (saveLock.current) return;
    saveLock.current = true;
    setIsSaving(true);
    const input = { name, phone, category, lastContactNote: lastContactNote || undefined };
    if (isEdit && onUpdate) {
      if (!onUpdate(input)) {
        setError("Escribe al menos el nombre del proveedor.");
        saveLock.current = false;
        setIsSaving(false);
        return;
      }
    } else if (!onSave(input)) {
      setError("Escribe al menos el nombre del proveedor.");
      saveLock.current = false;
      setIsSaving(false);
      return;
    }
    if (!isEdit) {
      setName("");
      setPhone("");
      setCategory("");
      setLastContactNote("");
    }
    setError(null);
    onClose();
  };

  return (
    <Sheet onClose={close} visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SheetHeader
          onClose={close}
          subtitle={isEdit ? "Actualiza el contacto y el último acuerdo." : "Guarda el contacto. El acuerdo queda en WhatsApp."}
          title={isEdit ? "Editar proveedor" : "Nuevo proveedor"}
        />
        <ScrollView keyboardShouldPersistTaps="handled">
          <SheetContent>
            <Field label="Nombre">
              <Input autoComplete="organization" onChangeText={setName} placeholder="Ej. Vivero del barrio…" value={name} />
            </Field>
            <Field description="Opcional" label="WhatsApp">
              <Input
                autoComplete="tel"
                keyboardType="phone-pad"
                onChangeText={setPhone}
                placeholder="Ej. 55 1234 5678…"
                value={phone}
              />
            </Field>
            <Field description="Opcional" label="¿Qué te vende?">
              <Input autoComplete="off" onChangeText={setCategory} placeholder="Ej. Plantas y tierra…" value={category} />
            </Field>
            {isEdit ? (
              <Field description="Opcional" label="Último acuerdo / nota">
                <Input
                  autoComplete="off"
                  multiline
                  numberOfLines={3}
                  onChangeText={setLastContactNote}
                  placeholder="Ej. Entrega el jueves por la mañana…"
                  value={lastContactNote}
                />
              </Field>
            ) : null}
            {error ? <Text accessibilityLiveRegion="polite" className="text-sm font-bold text-destructive">{error}</Text> : null}
          </SheetContent>
        </ScrollView>
        <SheetFooter>
          <Button className="flex-1" disabled={isSaving} icon="storefront-outline" onPress={save}>
            {isSaving ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar proveedor"}
          </Button>
        </SheetFooter>
      </KeyboardAvoidingView>
    </Sheet>
  );
}
