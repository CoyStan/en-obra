import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { Button, Field, Input, Sheet, SheetContent, SheetFooter, SheetHeader } from "../reusables";
import type { NewProjectInput, Project, ProjectUpdateInput } from "../../tracker/types";

type ProjectComposerProps = {
  onClose: () => void;
  onSave: (input: NewProjectInput) => boolean;
  onUpdate?: (input: ProjectUpdateInput) => boolean;
  project?: Project;
  visible: boolean;
};

export function ProjectComposer({ onClose, onSave, onUpdate, project, visible }: ProjectComposerProps) {
  const isEdit = Boolean(project);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const saveLock = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (project) {
        setName(project.name);
        setClientName(project.clientName);
        setClientPhone(project.clientPhone);
        setAddress(project.address);
      } else {
        setName("");
        setClientName("");
        setClientPhone("");
        setAddress("");
      }
      saveLock.current = false;
      setIsSaving(false);
    }
  }, [project, visible]);

  const close = () => {
    setError(null);
    onClose();
  };

  const save = () => {
    if (saveLock.current) return;
    saveLock.current = true;
    setIsSaving(true);
    const input: NewProjectInput = {
      name,
      clientName,
      clientPhone: clientPhone || undefined,
      address: address || undefined,
    };
    const saved = isEdit && onUpdate ? onUpdate(input) : onSave(input);
    if (!saved) {
      setError("Escribe el trabajo y el nombre del cliente.");
      saveLock.current = false;
      setIsSaving(false);
      return;
    }
    if (!isEdit) {
      setName("");
      setClientName("");
      setClientPhone("");
      setAddress("");
    }
    setError(null);
    onClose();
  };

  return (
    <Sheet onClose={close} visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SheetHeader
          onClose={close}
          subtitle={
            isEdit
              ? "Actualiza los datos del trabajo activo."
              : "Primero lo importante. Lo demás puede esperar."
          }
          title={isEdit ? "Editar trabajo" : "Nuevo trabajo"}
        />
        <ScrollView keyboardShouldPersistTaps="handled">
          <SheetContent>
            <Field label="¿Qué vas a hacer?">
              <Input
                autoComplete="off"
                autoFocus={!isEdit}
                onChangeText={setName}
                placeholder="Ej. Arreglar el jardín…"
                value={name}
              />
            </Field>
            <Field label="¿Para quién?">
              <Input
                autoComplete="off"
                onChangeText={setClientName}
                placeholder="Ej. Camila…"
                value={clientName}
              />
            </Field>
            <Field description="Opcional — +52 para México" label="WhatsApp del cliente">
              <Input
                autoComplete="tel"
                keyboardType="phone-pad"
                onChangeText={setClientPhone}
                placeholder="Ej. 55 1234 5678…"
                value={clientPhone}
              />
            </Field>
            <Field description="Opcional" label="¿Dónde será?">
              <Input
                autoComplete="street-address"
                onChangeText={setAddress}
                placeholder="Ej. Roma Sur…"
                value={address}
              />
            </Field>
            {error ? (
              <Text accessibilityLiveRegion="polite" className="text-sm font-bold text-destructive">
                {error}
              </Text>
            ) : null}
          </SheetContent>
        </ScrollView>
        <SheetFooter>
          <Button
            className="flex-1"
            disabled={isSaving}
            icon={isEdit ? "content-save-outline" : "play"}
            onPress={save}
          >
            {isSaving ? "Guardando…" : isEdit ? "Guardar cambios" : "Empezar trabajo"}
          </Button>
        </SheetFooter>
      </KeyboardAvoidingView>
    </Sheet>
  );
}
