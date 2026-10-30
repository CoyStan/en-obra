import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Button, Field, Input, Sheet, SheetContent, SheetFooter, SheetHeader } from "../reusables";
import type { Supplier } from "../../tracker/types";

export function RegisterContactSheet({
  supplier,
  visible,
  onClose,
  onSave,
}: {
  supplier?: Supplier;
  visible: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const saveLock = useRef(false);

  useEffect(() => {
    if (visible) {
      setNote(supplier?.lastContactNote ?? "");
      saveLock.current = false;
    }
  }, [visible, supplier]);

  const save = () => {
    if (saveLock.current || !note.trim()) return;
    saveLock.current = true;
    onSave(note.trim());
    onClose();
  };

  return (
    <Sheet onClose={onClose} visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SheetHeader
          onClose={onClose}
          subtitle={`Registra el acuerdo o nota más reciente con ${supplier?.name ?? "el proveedor"}.`}
          title="Registrar acuerdo / contacto"
        />
        <ScrollView keyboardShouldPersistTaps="handled">
          <SheetContent>
            <Field description="Esto reemplaza la nota anterior" label="Nota o acuerdo">
              <Input
                autoComplete="off"
                autoFocus
                multiline
                numberOfLines={4}
                onChangeText={setNote}
                placeholder="Ej. Acordamos entrega el jueves por la mañana…"
                value={note}
              />
            </Field>
          </SheetContent>
        </ScrollView>
        <SheetFooter>
          <Button className="flex-1" onPress={onClose} variant="outline">
            Cancelar
          </Button>
          <Button
            className="flex-[1.25]"
            disabled={!note.trim()}
            icon="check"
            onPress={save}
          >
            Guardar nota
          </Button>
        </SheetFooter>
      </KeyboardAvoidingView>
    </Sheet>
  );
}
