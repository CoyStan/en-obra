import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DesktopWorkspace } from "../components/tracker/DesktopWorkspace";
import { MaterialStatusComposer } from "../components/tracker/MaterialStatusComposer";
import { ProjectComposer } from "../components/tracker/ProjectComposer";
import { ProjectSwitcher } from "../components/tracker/ProjectSwitcher";
import { SupplierComposer } from "../components/tracker/SupplierComposer";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Field,
  Input,
  Progress,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
} from "../components/reusables";
import { clientReadyCount, latestReceiptDate, urgency } from "../domain/en-obra/status";
import { toClientSnapshot } from "../domain/en-obra/clientSnapshot";
import { buildClientMessage, buildSupplierMessage, waMeUrl } from "../domain/en-obra/whatsapp";
import { formatDisplayDate } from "../domain/en-obra/dates";
import {
  attentionMaterialCount,
  deliveryMeta,
  nextMaterialForAction,
  projectDescriptor,
  readyMaterialCount,
  sortByUrgency,
  statusMeta,
  supplierFor,
  trackerTabs as tabs,
} from "../tracker/presentation";
import { todayIsoDate } from "../tracker/dates";
import { trackerColors as color } from "../tracker/theme";
import type {
  Material,
  MaterialDetailsUpdateInput,
  MaterialStatus,
  MaterialStatusUpdateInput,
  NewMaterialInput,
  NewSupplierInput,
  Project,
  Supplier,
  TrackerTab as TabId,
} from "../tracker/types";
import { useEnObraStore } from "../tracker/useEnObraStore";
import { useWindowDimensions } from "react-native";

// ─── Shared display components ────────────────────────────────────────────────

function MaterialsProgress({
  materials,
  inverse = false,
}: {
  materials: Material[];
  inverse?: boolean;
}) {
  const complete = readyMaterialCount(materials);
  const total = materials.length;
  const progress = total ? Math.round((complete / total) * 100) : 0;

  if (inverse) {
    return (
      <View
        accessibilityLabel={`${complete} de ${total} materiales recibidos`}
        className="mt-4 gap-2"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-secondary">Materiales listos</Text>
          <Text className="text-sm font-extrabold tabular-nums text-primary-foreground">
            {complete}/{total}
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-primary-foreground/20">
          <View className="h-full rounded-full bg-marigold" style={{ width: `${progress}%` }} />
        </View>
      </View>
    );
  }

  return (
    <Progress
      label="Materiales listos"
      max={total || 1}
      value={complete}
      valueLabel={`${complete}/${total}`}
    />
  );
}

function StatusBadge({ status }: { status: MaterialStatus }) {
  const meta = statusMeta[status];
  return (
    <View
      className="h-7 flex-row items-center gap-1 self-start rounded-full px-2"
      style={{ backgroundColor: meta.wash }}
    >
      <MaterialCommunityIcons color={meta.color} name={meta.icon} size={15} />
      <Text className="text-[11px] font-extrabold" style={{ color: meta.color }}>
        {meta.label}
      </Text>
    </View>
  );
}

function MaterialRow({
  material,
  jobTag,
  onChangeStatus,
  onEdit,
  onDelete,
  clientView = false,
}: {
  material: Material;
  jobTag?: string;
  onChangeStatus?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  clientView?: boolean;
}) {
  const meta = statusMeta[material.status];
  const delivery = deliveryMeta(material);
  const quantityPart = material.quantity ? `${material.quantity} · ` : "";
  const detail = `${quantityPart}${delivery.label}`;

  const body = (
    <>
      <View
        className="h-[42px] w-[42px] items-center justify-center rounded-md"
        style={{ backgroundColor: meta.wash }}
      >
        <MaterialCommunityIcons color={meta.color} name={meta.icon} size={21} />
      </View>
      <View className="mx-3 min-w-0 flex-1">
        <Text className="text-sm font-extrabold text-foreground" numberOfLines={1}>
          {material.name}
        </Text>
        <Text className="mt-0.5 text-xs" numberOfLines={1} style={{ color: delivery.color }}>
          {detail}
        </Text>
        {jobTag ? (
          <Text className="mt-0.5 text-[10px] font-bold text-muted-foreground" numberOfLines={1}>
            {jobTag}
          </Text>
        ) : null}
        {clientView &&
        material.proofNote &&
        (material.status === "received" || material.status === "installed") ? (
          <View className="mt-1 flex-row items-center gap-1">
            <MaterialCommunityIcons color={color.success} name="checkbox-marked-circle-outline" size={13} />
            <Text className="text-[11px] font-bold text-forest">
              Marcado como recibido por el prestador
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );

  return (
    <View className="min-h-[76px] flex-row items-center px-3 py-3">
      {onEdit ? (
        <Pressable
          accessibilityHint="Abre el editor de material"
          accessibilityLabel={`Editar ${material.name}`}
          accessibilityRole="button"
          className="min-h-[52px] min-w-0 flex-1 flex-row items-center"
          hitSlop={4}
          onPress={onEdit}
          style={({ pressed }) => [pressed && { opacity: 0.68 }]}
        >
          {body}
        </Pressable>
      ) : (
        <View className="min-w-0 flex-1 flex-row items-center">{body}</View>
      )}
      <View className="flex-row items-center gap-1">
        {onDelete ? (
          <Pressable
            accessibilityLabel={`Borrar ${material.name}`}
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center rounded-full"
            hitSlop={8}
            onPress={onDelete}
            style={({ pressed }) => [pressed && { opacity: 0.68 }]}
          >
            <MaterialCommunityIcons color={color.inkMuted} name="trash-can-outline" size={18} />
          </Pressable>
        ) : null}
        {onChangeStatus ? (
          <Pressable
            accessibilityHint="Abre las opciones de estado y no cambia nada hasta guardar"
            accessibilityLabel={`Cambiar estado de ${material.name}. Estado actual: ${meta.label}`}
            accessibilityRole="button"
            className="min-h-[34px] flex-row items-center gap-0.5 rounded-full px-2"
            hitSlop={8}
            onPress={onChangeStatus}
            style={({ pressed }) => [
              { backgroundColor: meta.wash },
              pressed && { opacity: 0.68 },
            ]}
          >
            <Text className="text-[11px] font-extrabold" style={{ color: meta.color }}>
              {meta.label}
            </Text>
            <MaterialCommunityIcons color={meta.color} name="chevron-down" size={18} />
          </Pressable>
        ) : (
          <StatusBadge status={material.status} />
        )}
      </View>
    </View>
  );
}

function EmptyMaterials({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="items-center px-6 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-forest-wash">
        <MaterialCommunityIcons color={color.forest} name="package-variant-plus" size={28} />
      </View>
      <Text className="mt-3 text-base font-extrabold text-foreground">
        Todavía no hay materiales
      </Text>
      <Text className="mt-1 text-center text-[13px] leading-[19px] text-muted-foreground">
        Agrega lo primero que vas a pedir para este trabajo.
      </Text>
      <Button className="mt-4" icon="plus" onPress={onAdd}>
        Agregar primer material
      </Button>
    </View>
  );
}

// ─── Material composer ────────────────────────────────────────────────────────

type MaterialDraft = {
  name: string;
  quantity: string;
  supplierId?: string;
};

function MaterialComposer({
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
                  Sin proveedores aún — puedes agregar uno ahora o dejarlo vacío.
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

// ─── Register contact sheet ───────────────────────────────────────────────────

function RegisterContactSheet({
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

// ─── Client view sheet ────────────────────────────────────────────────────────

function ClientViewSheet({
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
  const totalCount = materials.length;
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
          {/* Info header */}
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
          {/* Progress */}
          <Card>
            <CardContent>
              <MaterialsProgress materials={materials} />
              <Text className="mt-2 text-xs text-muted-foreground">
                {readyCount} de {totalCount} materiales recibidos o instalados
              </Text>
            </CardContent>
          </Card>
          {/* Materials list */}
          <Text className="text-[15px] font-extrabold text-foreground">
            Materiales del trabajo
          </Text>
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
                Modo ejemplo — el número de demo no es real. El mensaje no se enviará.
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

// ─── Settings sheet ───────────────────────────────────────────────────────────

function SettingsSheet({
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export function TrackerScreen() {
  const store = useEnObraStore();
  const {
    mode,
    data,
    isDemo,
    isLoading,
    saveState,
    infoNotice,
    clearInfoNotice,
    activeProject,
    activeProjects,
    materials,
    hoyMaterials,
    suppliers,
    projects,
    retryLoad,
    startEmptyWorkspace,
    startDemoWorkspace,
    leaveDemo,
    addProject,
    updateProject,
    setActiveProject,
    setLifecycle,
    addMaterial,
    updateMaterialDetails,
    changeMaterialStatus,
    deleteMaterial,
    restoreMaterial,
    addSupplier,
    updateSupplier,
    registerSupplierContact,
    deleteSupplier,
    eraseAll,
    exportJson,
    getRecoveryExport,
  } = store;

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  // Tab and navigation
  const [tab, setTab] = useState<TabId>("home");
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  // Sheet open states
  const [composerOpen, setComposerOpen] = useState(false);
  const [projectComposerOpen, setProjectComposerOpen] = useState(false);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [supplierComposerOpen, setSupplierComposerOpen] = useState(false);
  const [clientViewJobId, setClientViewJobId] = useState<string | undefined>();
  const [registerContactSupplierId, setRegisterContactSupplierId] = useState<string | undefined>();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Draft preservation for "new supplier from material" flow
  const [returnToMaterial, setReturnToMaterial] = useState(false);
  const [materialDraft, setMaterialDraft] = useState<MaterialDraft | undefined>();
  const [newSupplierId, setNewSupplierId] = useState<string | undefined>();

  // Edit targets
  const [statusEditorMaterial, setStatusEditorMaterial] = useState<Material | undefined>();
  const [editMaterial, setEditMaterial] = useState<Material | undefined>();
  const [editProject, setEditProject] = useState<Project | undefined>();
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>();

  // Undo delete
  const [deletedMaterial, setDeletedMaterial] = useState<Material | undefined>();
  const deletedMaterialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notices
  const [notice, setNotice] = useState<string | null>(null);

  // Save state notice: auto-dismiss "saved" after 2s
  const [savedVisible, setSavedVisible] = useState(false);
  useEffect(() => {
    if (saveState === "saved") {
      setSavedVisible(true);
      const t = setTimeout(() => setSavedVisible(false), 2000);
      return () => clearTimeout(t);
    } else {
      setSavedVisible(false);
    }
  }, [saveState]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(t);
  }, [notice]);

  // Derived
  const selectedJob = useMemo(
    () => (selectedJobId ? projects.find((p) => p.id === selectedJobId) : undefined),
    [selectedJobId, projects],
  );

  const selectedJobMaterials = useMemo(
    () =>
      selectedJob
        ? data.materials.filter((m) => m.projectId === selectedJob.id)
        : [],
    [selectedJob, data.materials],
  );

  const sortedJobMaterials = useMemo(
    () => [...selectedJobMaterials].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [selectedJobMaterials],
  );

  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [materials],
  );

  const hoyUrgent = useMemo(
    () => sortByUrgency(hoyMaterials),
    [hoyMaterials],
  );

  const clientViewProject = useMemo(
    () => (clientViewJobId ? projects.find((p) => p.id === clientViewJobId) : undefined),
    [clientViewJobId, projects],
  );

  const clientViewMaterials = useMemo(
    () =>
      clientViewProject
        ? data.materials.filter((m) => m.projectId === clientViewProject.id)
        : [],
    [clientViewProject, data.materials],
  );

  const registerContactSupplier = useMemo(
    () =>
      registerContactSupplierId
        ? suppliers.find((s) => s.id === registerContactSupplierId)
        : undefined,
    [registerContactSupplierId, suppliers],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openStatusEditor = (material: Material) => setStatusEditorMaterial(material);
  const openMaterialEditor = (material: Material) => {
    setEditMaterial(material);
    setComposerOpen(true);
  };

  const saveMaterialDetails = (input: MaterialDetailsUpdateInput) => {
    if (!editMaterial) return false;
    const saved = updateMaterialDetails(editMaterial.id, input);
    if (saved) {
      setNotice(`${input.name.trim()}: cambios guardados.`);
      setEditMaterial(undefined);
    }
    return saved;
  };

  const saveMaterialStatus = (input: MaterialStatusUpdateInput) => {
    if (!statusEditorMaterial) return;
    changeMaterialStatus(statusEditorMaterial.id, input.status, {
      expectedOn: input.expectedOn,
      receivedOn: input.receivedOn,
    });
    setNotice(`${statusEditorMaterial.name}: ${statusMeta[input.status].label.toLowerCase()}.`);
    setStatusEditorMaterial(undefined);
  };

  const handleDeleteMaterial = (material: Material) => {
    if (deletedMaterialTimerRef.current) {
      clearTimeout(deletedMaterialTimerRef.current);
    }
    deleteMaterial(material.id);
    setDeletedMaterial(material);
    deletedMaterialTimerRef.current = setTimeout(() => {
      setDeletedMaterial(undefined);
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (deletedMaterialTimerRef.current) {
      clearTimeout(deletedMaterialTimerRef.current);
    }
    if (deletedMaterial) {
      restoreMaterial(deletedMaterial);
      setDeletedMaterial(undefined);
    }
  };

  const openNewSupplier = (fromMaterialDraft?: MaterialDraft) => {
    setEditSupplier(undefined);
    if (fromMaterialDraft) {
      setMaterialDraft(fromMaterialDraft);
      setReturnToMaterial(true);
      setComposerOpen(false);
    } else {
      setReturnToMaterial(false);
    }
    setSupplierComposerOpen(true);
  };

  const saveSupplier = useCallback(
    (input: NewSupplierInput) => {
      const supplierId = addSupplier(input);
      if (supplierId && returnToMaterial) {
        setNewSupplierId(supplierId);
        setReturnToMaterial(false);
        setComposerOpen(true);
      }
      return supplierId;
    },
    [addSupplier, returnToMaterial],
  );

  const saveProject = (input: Parameters<typeof addProject>[0]) => {
    const saved = addProject(input);
    if (saved) {
      setTab("jobs");
      setNotice(`Trabajo de ${input.clientName.trim()} listo para empezar.`);
    }
    return saved;
  };

  const saveProjectEdits = (input: Parameters<typeof updateProject>[1]) => {
    if (!editProject) return false;
    const saved = updateProject(editProject.id, input);
    if (saved) {
      setNotice(`Trabajo actualizado: ${input.name.trim()}.`);
      setEditProject(undefined);
    }
    return saved;
  };

  const saveSupplierEdits = (input: Parameters<typeof updateSupplier>[1]) => {
    if (!editSupplier) return false;
    const saved = updateSupplier(editSupplier.id, input);
    if (saved) {
      setNotice(`${input.name.trim()}: proveedor actualizado.`);
      setEditSupplier(undefined);
    }
    return saved;
  };

  const handleRegisterContact = (note: string) => {
    if (!registerContactSupplierId) return;
    registerSupplierContact(registerContactSupplierId, { note });
    setNotice("Nota guardada.");
    setRegisterContactSupplierId(undefined);
  };

  const openClientView = (jobId: string) => setClientViewJobId(jobId);

  const sendClientWhatsApp = async () => {
    if (!clientViewProject) return;
    if (isDemo) {
      setNotice("Modo ejemplo — los números de demo no son reales. No se abrirá WhatsApp.");
      return;
    }
    if (!clientViewProject.clientPhone) {
      setNotice(
        `Agrega el WhatsApp de ${clientViewProject.clientName} para enviar actualizaciones.`,
      );
      return;
    }
    const snapshot = toClientSnapshot(clientViewProject, clientViewMaterials);
    const readyCount = clientReadyCount(clientViewMaterials);
    const readyItems = clientViewMaterials.filter(
      (m) => m.status === "received" || m.status === "installed",
    );
    const msg = buildClientMessage({
      jobName: snapshot.name,
      clientFirstName: clientViewProject.clientName.split(" ")[0] ?? clientViewProject.clientName,
      materialsReadyCount: readyCount,
      materialsTotal: clientViewMaterials.length,
      items: readyItems.map((m) => ({
        name: m.name,
        quantity: m.quantity,
        status: m.status,
      })),
    });
    const url = waMeUrl(clientViewProject.clientPhone, msg);
    if (!url) {
      setNotice("El número de WhatsApp del cliente no es válido.");
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      setNotice("No se pudo abrir WhatsApp en este dispositivo.");
    }
  };

  const sendSupplierWhatsApp = async (supplier: Supplier, materialContext?: Material) => {
    if (isDemo) {
      setNotice("Modo ejemplo — los números de demo no son reales. No se abrirá WhatsApp.");
      return;
    }
    if (!supplier.phone) {
      setNotice(
        `Agrega el WhatsApp de ${supplier.name} para escribirle desde aquí.`,
      );
      return;
    }
    const job = activeProject ?? activeProjects[0];
    let msg: string;
    if (materialContext && job) {
      const need =
        materialContext.status === "to_order" ? "cotización o pedido" : "seguimiento de pedido";
      msg = buildSupplierMessage({
        jobName: job.name,
        materialName: materialContext.name,
        quantity: materialContext.quantity,
        need,
        expectedOn: materialContext.expectedOn,
      });
    } else {
      msg = `Hola ${supplier.name}, te escribo sobre el trabajo${job ? ` "${job.name}"` : ""}.`;
    }
    const url = waMeUrl(supplier.phone, msg);
    if (!url) {
      setNotice("El número de WhatsApp no es válido.");
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      setNotice("No se pudo abrir WhatsApp en este dispositivo.");
    }
  };

  const handleExportJson = async () => {
    const json = await exportJson();
    try {
      await Share.share({ message: json, title: "En Obra — datos exportados" });
    } catch {
      setNotice("No se pudo compartir. Copia el JSON desde la pantalla.");
    }
  };

  const handleExportRecovery = async () => {
    const raw = await getRecoveryExport();
    if (!raw) {
      setNotice("No se encontraron datos de recuperación.");
      return;
    }
    try {
      await Share.share({ message: raw, title: "En Obra — recuperación" });
    } catch {
      setNotice("No se pudo compartir. Intenta copiar el texto.");
    }
  };

  const handleDeleteSupplier = (supplierId: string, supplierName: string) => {
    const result = deleteSupplier(supplierId);
    if (!result.ok) {
      setNotice(result.reason);
    } else {
      setNotice(`${supplierName}: proveedor eliminado.`);
    }
  };

  // ── Boot / chooser / recovery modes ─────────────────────────────────────────

  if (mode === "boot" || isLoading) {
    return (
      <View
        className="flex-1"
        style={{ backgroundColor: color.canvas, paddingTop: insets.top }}
      >
        <View className="flex-1 gap-4 p-4 pt-[70px]">
          <View className="h-7 w-[62%] rounded-md bg-muted" />
          <View className="h-4 w-[44%] rounded-md bg-muted" />
          <View className="h-[132px] rounded-xl bg-muted" />
          <View className="h-[132px] rounded-xl bg-muted" />
        </View>
      </View>
    );
  }

  if (mode === "chooser") {
    return (
      <>
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: color.canvas, paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          <View className="h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: color.primary }}>
            <MaterialCommunityIcons color={color.surface} name="hammer-wrench" size={34} />
          </View>
          <Text className="mt-5 text-[28px] font-extrabold tracking-tight text-foreground">
            En Obra
          </Text>
          <Text className="mt-2 text-center text-[15px] leading-[22px] text-muted-foreground">
            Controla pedidos, entregas y el avance de cada trabajo. Sin papeles, sin sorpresas.
          </Text>
          <View className="mt-8 w-full gap-3">
            <Button
              className="w-full"
              icon="play"
              onPress={() => {
                startEmptyWorkspace();
                setProjectComposerOpen(true);
              }}
            >
              Crear mi primer trabajo
            </Button>
            <Button
              className="w-full"
              icon="eye-outline"
              onPress={() => void startDemoWorkspace()}
              variant="outline"
            >
              Ver ejemplo
            </Button>
          </View>
        </View>
        <ProjectComposer
          onClose={() => setProjectComposerOpen(false)}
          onSave={saveProject}
          visible={projectComposerOpen}
        />
      </>
    );
  }

  if (mode === "recovery") {
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
          {store.recoveryError ?? "Los datos no se pudieron leer. Puedes intentar de nuevo o exportar el respaldo."}
        </Text>
        <View className="mt-8 gap-3">
          <Button icon="refresh" onPress={() => void retryLoad()}>
            Reintentar
          </Button>
          <Button icon="export-variant" onPress={handleExportRecovery} variant="outline">
            Exportar respaldo de recuperación
          </Button>
        </View>
        <Text className="mt-6 text-xs leading-[18px] text-muted-foreground">
          La edición está bloqueada para proteger tus datos. Después de exportar el respaldo, puedes contactar soporte.
        </Text>
      </View>
    );
  }

  // ── Main UI (user | demo) ───────────────────────────────────────────────────

  // ── Tab content renderers ───────────────────────────────────────────────────

  const renderHoy = () => {
    const today = todayIsoDate();
    const nonComplete = hoyUrgent.filter(
      (m) => m.status !== "installed",
    );
    const complete = hoyUrgent.filter((m) => m.status === "installed");

    if (activeProjects.length === 0) {
      return (
        <View className="items-center px-6 py-10">
          <MaterialCommunityIcons color={color.inkMuted} name="briefcase-outline" size={36} />
          <Text className="mt-3 text-base font-extrabold text-foreground">
            No hay trabajos activos
          </Text>
          <Text className="mt-1 text-center text-[13px] leading-[19px] text-muted-foreground">
            Los trabajos completados o archivados no aparecen aquí.
          </Text>
          <Button
            className="mt-4"
            icon="plus"
            onPress={() => {
              setEditProject(undefined);
              setProjectComposerOpen(true);
            }}
          >
            Nuevo trabajo
          </Button>
        </View>
      );
    }

    return (
      <>
        <View className="pb-4 pt-6">
          <Text className="text-[27px] font-extrabold tracking-tight text-foreground">Hoy</Text>
          <Text className="mt-1 text-sm leading-5 text-muted-foreground">
            {nonComplete.length
              ? `${nonComplete.length} material${nonComplete.length === 1 ? "" : "es"} pendiente${nonComplete.length === 1 ? "" : "s"} en ${activeProjects.length} trabajo${activeProjects.length === 1 ? "" : "s"} activo${activeProjects.length === 1 ? "" : "s"}.`
              : "Todo el material está recibido o usado. ¡Buen trabajo!"}
          </Text>
        </View>
        {nonComplete.length === 0 && hoyMaterials.length > 0 ? (
          <View className="flex-row items-center gap-2 rounded-xl bg-forest-wash p-4">
            <MaterialCommunityIcons color={color.success} name="check-decagram-outline" size={21} />
            <Text className="flex-1 text-sm font-bold text-forest">
              Todo el material está recibido o usado.
            </Text>
          </View>
        ) : null}
        {nonComplete.length > 0 ? (
          <Card className="overflow-hidden py-0">
            {nonComplete.map((material, index) => {
              const job = projects.find((p) => p.id === material.projectId);
              const supplier = supplierFor(suppliers, material.supplierId);
              const u = urgency(material, today);
              const isUrgent = u === "late" || u === "today";
              return (
                <View key={material.id}>
                  {index > 0 ? <Separator /> : null}
                  <View className="flex-row items-center">
                    {isUrgent ? (
                      <View className="ml-3 h-full w-1.5 rounded-full" style={{ backgroundColor: color.clay, minHeight: 40 }} />
                    ) : null}
                    <View className="flex-1">
                      <MaterialRow
                        jobTag={job?.name}
                        material={material}
                        onChangeStatus={() => openStatusEditor(material)}
                        onEdit={
                          job?.lifecycle === "active"
                            ? () => openMaterialEditor(material)
                            : undefined
                        }
                      />
                    </View>
                    {supplier ? (
                      <Pressable
                        accessibilityLabel={`Escribir a ${supplier.name} por WhatsApp`}
                        accessibilityRole="button"
                        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
                        hitSlop={6}
                        onPress={() => void sendSupplierWhatsApp(supplier, material)}
                        style={({ pressed }) => [pressed && { opacity: 0.68 }]}
                      >
                        <MaterialCommunityIcons color={color.forest} name="whatsapp" size={20} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Card>
        ) : null}
        {complete.length > 0 && nonComplete.length > 0 ? (
          <Text className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Usados en este ciclo
          </Text>
        ) : null}
        {complete.length > 0 ? (
          <Card className="mt-2 overflow-hidden py-0" style={{ opacity: 0.64 }}>
            {complete.map((material, index) => {
              const job = projects.find((p) => p.id === material.projectId);
              return (
                <View key={material.id}>
                  {index > 0 ? <Separator /> : null}
                  <MaterialRow jobTag={job?.name} material={material} />
                </View>
              );
            })}
          </Card>
        ) : null}
      </>
    );
  };

  const renderJobs = () => {
    if (selectedJob) {
      const outstanding = nextMaterialForAction(sortedJobMaterials);
      const nextDelivery = outstanding ? deliveryMeta(outstanding) : undefined;
      const attentionCount = attentionMaterialCount(sortedJobMaterials);
      const lastReceipt = latestReceiptDate(sortedJobMaterials);

      return (
        <>
          {/* Back header */}
          <View className="flex-row items-center gap-2 pb-3 pt-4">
            <Pressable
              accessibilityLabel="Volver a Mis trabajos"
              accessibilityRole="button"
              className="min-h-[44px] flex-row items-center gap-1"
              onPress={() => setSelectedJobId(undefined)}
              style={({ pressed }) => [pressed && { opacity: 0.68 }]}
            >
              <MaterialCommunityIcons color={color.forest} name="chevron-left" size={22} />
              <Text className="text-sm font-bold text-primary">Mis trabajos</Text>
            </Pressable>
          </View>
          {/* Job header */}
          <View className="mb-5">
            <View className="mb-1 flex-row items-center gap-1.5">
              <View
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    selectedJob.lifecycle === "active" ? color.success : color.inkMuted,
                }}
              />
              <Text className="text-xs font-bold text-muted-foreground">
                {selectedJob.lifecycle === "active"
                  ? "Trabajo activo"
                  : selectedJob.lifecycle === "completed"
                  ? "Completado"
                  : "Archivado"}
              </Text>
            </View>
            <Text className="text-[27px] font-extrabold tracking-tight text-foreground">
              {selectedJob.name}
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              {projectDescriptor(selectedJob)}
            </Text>
            {lastReceipt ? (
              <Text className="mt-1 text-xs text-muted-foreground">
                Última recepción: {formatDisplayDate(lastReceipt)}
              </Text>
            ) : null}
          </View>
          {/* Progress card */}
          <Card className="mb-4 border-0 py-4" style={{ backgroundColor: color.primary }}>
            <CardContent>
              <View className="flex-row items-center">
                <View
                  className="h-[38px] w-[38px] items-center justify-center rounded-full"
                  style={{ backgroundColor: color.sunWash }}
                >
                  <Text
                    className="text-[15px] font-extrabold"
                    style={{ color: color.forestDark }}
                  >
                    {selectedJob.clientName.charAt(0)}
                  </Text>
                </View>
                <View className="ml-3 min-w-0 flex-1">
                  <Text className="text-[11px] font-bold" style={{ color: color.secondary }}>
                    Cliente
                  </Text>
                  <Text
                    className="mt-0.5 text-[15px] font-bold"
                    style={{ color: color.primaryForeground }}
                  >
                    {selectedJob.clientName}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Vista cliente y WhatsApp"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => openClientView(selectedJob.id)}
                  style={({ pressed }) => [pressed && { opacity: 0.68 }]}
                >
                  <Badge
                    className="border-0 bg-white/10"
                    labelClassName="text-[11px] font-bold text-primary-foreground"
                    variant="ghost"
                  >
                    Vista cliente
                  </Badge>
                </Pressable>
              </View>
              <MaterialsProgress inverse materials={sortedJobMaterials} />
            </CardContent>
          </Card>
          {/* Next action */}
          {outstanding && nextDelivery ? (
            <>
              <Text className="mb-2 text-[15px] font-extrabold tracking-tight text-foreground">
                Lo siguiente
              </Text>
              <View
                className="mb-6 flex-row items-center rounded-xl bg-card p-3"
                style={shadowStyles.nextAction}
              >
                <View
                  className="h-[46px] w-[46px] items-center justify-center rounded-md"
                  style={{ backgroundColor: nextDelivery.wash }}
                >
                  <MaterialCommunityIcons
                    color={nextDelivery.color}
                    name={nextDelivery.icon}
                    size={22}
                  />
                </View>
                <View className="mx-3 min-w-0 flex-1">
                  <Text className="text-xs font-bold" style={{ color: nextDelivery.color }}>
                    {nextDelivery.label}
                  </Text>
                  <Text className="mt-0.5 text-[15px] font-extrabold text-foreground">
                    {outstanding.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted-foreground">
                    {supplierFor(suppliers, outstanding.supplierId)?.name ?? "Proveedor por definir"}
                  </Text>
                </View>
                <Button
                  accessibilityLabel={`Cambiar estado de ${outstanding.name}`}
                  className="h-[42px] w-[42px]"
                  icon="pencil-outline"
                  onPress={() => openStatusEditor(outstanding)}
                  size="icon"
                />
              </View>
            </>
          ) : sortedJobMaterials.length > 0 ? (
            <View className="mb-6 flex-row items-center gap-2 rounded-xl bg-forest-wash p-4">
              <MaterialCommunityIcons color={color.success} name="check-decagram-outline" size={21} />
              <Text className="flex-1 text-sm font-bold text-forest">
                Todo el material está recibido o usado.
              </Text>
            </View>
          ) : null}
          {/* Materials */}
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[17px] font-extrabold tracking-tight text-foreground">
              Materiales
            </Text>
            <Text className="text-xs text-muted-foreground">
              {attentionCount
                ? `${attentionCount} requieren seguimiento`
                : "sin pendientes urgentes"}
            </Text>
          </View>
          <Card className="overflow-hidden py-0">
            {sortedJobMaterials.length ? (
              sortedJobMaterials.map((material, index) => (
                <View key={material.id}>
                  {index > 0 ? <Separator /> : null}
                  <MaterialRow
                    material={material}
                    onChangeStatus={
                      selectedJob.lifecycle === "active"
                        ? () => openStatusEditor(material)
                        : undefined
                    }
                    onDelete={
                      selectedJob.lifecycle === "active"
                        ? () => handleDeleteMaterial(material)
                        : undefined
                    }
                    onEdit={
                      selectedJob.lifecycle === "active"
                        ? () => openMaterialEditor(material)
                        : undefined
                    }
                  />
                </View>
              ))
            ) : (
              <EmptyMaterials
                onAdd={() => {
                  setEditMaterial(undefined);
                  setComposerOpen(true);
                }}
              />
            )}
          </Card>
          {/* Lifecycle actions */}
          {selectedJob.lifecycle === "active" ? (
            <View className="mt-6 gap-2">
              <Button
                icon="check-circle-outline"
                onPress={() => {
                  setLifecycle(selectedJob.id, "completed");
                  setNotice(`"${selectedJob.name}" marcado como completado.`);
                  setSelectedJobId(undefined);
                }}
                variant="outline"
              >
                Marcar como completado
              </Button>
              <Button
                icon="archive-outline"
                onPress={() => {
                  setLifecycle(selectedJob.id, "archived");
                  setNotice(`"${selectedJob.name}" archivado.`);
                  setSelectedJobId(undefined);
                }}
                variant="ghost"
              >
                Archivar
              </Button>
            </View>
          ) : selectedJob.lifecycle === "completed" ? (
            <View className="mt-6">
              <Button
                icon="restore"
                onPress={() => {
                  setLifecycle(selectedJob.id, "active");
                  setNotice(`"${selectedJob.name}" reactivado.`);
                }}
                variant="outline"
              >
                Reactivar trabajo
              </Button>
            </View>
          ) : null}
        </>
      );
    }

    // Jobs list
    const activeJobs = projects.filter((p) => p.lifecycle === "active");
    const otherJobs = projects.filter((p) => p.lifecycle !== "active");

    return (
      <>
        <View className="pb-4 pt-6">
          <Text className="text-[27px] font-extrabold tracking-tight text-foreground">
            Mis trabajos
          </Text>
          <Text className="mt-1 text-sm leading-5 text-muted-foreground">
            {projects.length === 0
              ? "Empieza con tu primer trabajo."
              : `${activeJobs.length} activo${activeJobs.length !== 1 ? "s" : ""}, ${otherJobs.length} terminado${otherJobs.length !== 1 ? "s" : ""}.`}
          </Text>
        </View>
        {projects.length === 0 ? (
          <View className="items-center py-8">
            <MaterialCommunityIcons color={color.inkMuted} name="briefcase-plus-outline" size={40} />
            <Text className="mt-3 text-base font-extrabold text-foreground">
              Todavía no hay trabajos
            </Text>
            <Button
              className="mt-4"
              icon="plus"
              onPress={() => {
                setEditProject(undefined);
                setProjectComposerOpen(true);
              }}
            >
              Crear primer trabajo
            </Button>
          </View>
        ) : (
          <View className="gap-3">
            {activeJobs.map((project) => {
              const jobMats = data.materials.filter((m) => m.projectId === project.id);
              const ready = clientReadyCount(jobMats);
              return (
                <Pressable
                  accessibilityHint="Abre el detalle de este trabajo"
                  accessibilityLabel={`${project.name}. ${project.clientName}`}
                  accessibilityRole="button"
                  key={project.id}
                  onPress={() => setSelectedJobId(project.id)}
                  style={({ pressed }) => [pressed && { opacity: 0.68 }]}
                >
                  <Card className="py-3">
                    <CardContent>
                      <View className="flex-row items-center">
                        <View
                          className="h-10 w-10 items-center justify-center rounded-md"
                          style={{ backgroundColor: color.primary }}
                        >
                          <MaterialCommunityIcons
                            color={color.surface}
                            name="hammer-wrench"
                            size={20}
                          />
                        </View>
                        <View className="ml-3 min-w-0 flex-1">
                          <Text
                            className="text-[15px] font-extrabold text-foreground"
                            numberOfLines={1}
                          >
                            {project.name}
                          </Text>
                          <Text
                            className="mt-0.5 text-xs text-muted-foreground"
                            numberOfLines={1}
                          >
                            {project.clientName}
                            {project.address ? ` · ${project.address}` : ""}
                          </Text>
                        </View>
                        <Text className="ml-2 text-xs tabular-nums text-muted-foreground">
                          {ready}/{jobMats.length}
                        </Text>
                        <MaterialCommunityIcons
                          color={color.inkMuted}
                          name="chevron-right"
                          size={20}
                        />
                      </View>
                    </CardContent>
                  </Card>
                </Pressable>
              );
            })}
            {otherJobs.length > 0 ? (
              <>
                <Text className="mt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Completados / archivados
                </Text>
                {otherJobs.map((project) => {
                  const jobMats = data.materials.filter((m) => m.projectId === project.id);
                  const ready = clientReadyCount(jobMats);
                  return (
                    <Pressable
                      accessibilityHint="Abre el detalle de este trabajo"
                      accessibilityLabel={`${project.name}. ${project.clientName}`}
                      accessibilityRole="button"
                      key={project.id}
                      onPress={() => setSelectedJobId(project.id)}
                      style={({ pressed }) => [{ opacity: 0.72 }, pressed && { opacity: 0.5 }]}
                    >
                      <Card className="py-3">
                        <CardContent>
                          <View className="flex-row items-center">
                            <View className="h-10 w-10 items-center justify-center rounded-md bg-muted">
                              <MaterialCommunityIcons
                                color={color.inkMuted}
                                name="briefcase-variant-outline"
                                size={20}
                              />
                            </View>
                            <View className="ml-3 min-w-0 flex-1">
                              <Text
                                className="text-[15px] font-extrabold text-foreground"
                                numberOfLines={1}
                              >
                                {project.name}
                              </Text>
                              <Text
                                className="mt-0.5 text-xs text-muted-foreground"
                                numberOfLines={1}
                              >
                                {project.clientName} ·{" "}
                                {project.lifecycle === "completed" ? "Completado" : "Archivado"}
                              </Text>
                            </View>
                            <Text className="ml-2 text-xs tabular-nums text-muted-foreground">
                              {ready}/{jobMats.length}
                            </Text>
                            <MaterialCommunityIcons
                              color={color.inkMuted}
                              name="chevron-right"
                              size={20}
                            />
                          </View>
                        </CardContent>
                      </Card>
                    </Pressable>
                  );
                })}
              </>
            ) : null}
          </View>
        )}
        {/* Settings / data management */}
        <View className="mt-8 border-t border-border pt-6">
          <Button
            icon="cog-outline"
            onPress={() => setSettingsOpen(true)}
            variant="ghost"
          >
            Configuración y datos
          </Button>
        </View>
      </>
    );
  };

  const renderSuppliers = () => (
    <>
      <View className="pb-4 pt-6">
        <Text className="text-[27px] font-extrabold tracking-tight text-foreground">
          Proveedores
        </Text>
        <Text className="mt-1 text-sm leading-5 text-muted-foreground">
          Guarda el contacto y el último acuerdo de cada compra.
        </Text>
      </View>
      {suppliers.length === 0 ? (
        <View className="items-center py-8">
          <MaterialCommunityIcons color={color.inkMuted} name="store-plus-outline" size={40} />
          <Text className="mt-3 text-base font-extrabold text-foreground">
            Todavía no hay proveedores
          </Text>
          <Text className="mt-1 text-center text-[13px] leading-[19px] text-muted-foreground">
            Agrega al primero con el botón de arriba.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {suppliers.map((supplier) => {
            const supplied = data.materials.filter((m) => m.supplierId === supplier.id);
            return (
              <Card key={supplier.id}>
                <CardContent>
                  <View className="flex-row items-center">
                    <View className="h-11 w-11 items-center justify-center rounded-md bg-forest-wash">
                      <MaterialCommunityIcons color={color.forest} name="store-outline" size={22} />
                    </View>
                    <View className="ml-3 min-w-0 flex-1">
                      <Text className="text-[15px] font-extrabold text-foreground">
                        {supplier.name}
                      </Text>
                      {supplier.category ? (
                        <Text className="mt-0.5 text-xs text-muted-foreground">
                          {supplier.category}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {/* Last contact note */}
                  <Pressable
                    accessibilityHint="Toca para registrar un nuevo acuerdo o nota"
                    accessibilityLabel={
                      supplier.lastContactNote
                        ? `Nota guardada: ${supplier.lastContactNote}. Toca para actualizar.`
                        : "Sin nota guardada. Toca para registrar."
                    }
                    accessibilityRole="button"
                    className="mt-3 flex-row items-start gap-2 rounded-md bg-background p-3"
                    onPress={() => setRegisterContactSupplierId(supplier.id)}
                    style={({ pressed }) => [pressed && { opacity: 0.68 }]}
                  >
                    <MaterialCommunityIcons
                      color={supplier.lastContactNote ? color.forest : color.inkMuted}
                      name="note-text-outline"
                      size={17}
                    />
                    <View className="min-w-0 flex-1">
                      <Text className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Nota / acuerdo guardado
                      </Text>
                      <Text
                        className="mt-1 text-xs leading-[18px]"
                        style={{
                          color: supplier.lastContactNote ? color.ink : color.inkMuted,
                        }}
                      >
                        {supplier.lastContactNote ?? "Sin nota — toca para agregar"}
                      </Text>
                    </View>
                    <MaterialCommunityIcons color={color.inkMuted} name="pencil-outline" size={15} />
                  </Pressable>
                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-xs text-muted-foreground">
                      {supplied.length}{" "}
                      {supplied.length === 1 ? "material" : "materiales"}
                    </Text>
                    <View className="flex-row gap-2">
                      <Button
                        icon="pencil-outline"
                        onPress={() => {
                          setEditSupplier(supplier);
                          setSupplierComposerOpen(true);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        Editar
                      </Button>
                      <Button
                        icon="delete-outline"
                        onPress={() =>
                          handleDeleteSupplier(supplier.id, supplier.name)
                        }
                        size="sm"
                        variant="ghost"
                      />
                      <Button
                        icon="whatsapp"
                        onPress={() => void sendSupplierWhatsApp(supplier)}
                        size="sm"
                        variant="secondary"
                      >
                        Escribir
                      </Button>
                    </View>
                  </View>
                </CardContent>
              </Card>
            );
          })}
        </View>
      )}
    </>
  );

  // ── Desktop path ─────────────────────────────────────────────────────────────

  if (isDesktop && activeProject) {
    return (
      <View className="flex-1" style={{ backgroundColor: color.canvas, paddingTop: insets.top }}>
        <DesktopWorkspace
          activeProject={activeProject}
          data={data}
          materials={materials}
          onAddMaterial={() => {
            setEditMaterial(undefined);
            setComposerOpen(true);
          }}
          onAddProject={() => {
            setEditProject(undefined);
            setProjectComposerOpen(true);
          }}
          onAddSupplier={() => openNewSupplier()}
          onChangeMaterialStatus={openStatusEditor}
          onEditMaterial={openMaterialEditor}
          onEditSupplier={(supplier) => {
            setEditSupplier(supplier);
            setSupplierComposerOpen(true);
          }}
          onOpenClientView={() => {
            if (activeProject) openClientView(activeProject.id);
          }}
          onOpenSupplierWhatsApp={(supplier) => void sendSupplierWhatsApp(supplier)}
          onSelectTab={(t) => {
            // Map "jobs" tab to set selectedJobId if needed
            setTab(t);
          }}
          onSwitchProject={() => setProjectSwitcherOpen(true)}
          sortedMaterials={sortedMaterials}
          tab={tab}
        />
        {renderSheets()}
      </View>
    );
  }

  // ── Mobile path ───────────────────────────────────────────────────────────────

  const addBtnLabel =
    tab === "suppliers"
      ? "Agregar proveedor"
      : tab === "jobs" && selectedJob
      ? "Agregar material"
      : tab === "jobs"
      ? "Nuevo trabajo"
      : "Agregar material";

  const handleAddBtn = () => {
    if (tab === "suppliers") {
      openNewSupplier();
    } else if (tab === "jobs" && selectedJob) {
      setEditMaterial(undefined);
      setComposerOpen(true);
    } else if (tab === "jobs") {
      setEditProject(undefined);
      setProjectComposerOpen(true);
    } else {
      // Hoy tab — adds to activeProject or prompts
      setEditMaterial(undefined);
      setComposerOpen(true);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: color.canvas }}>
      {/* Safe area top */}
      <View style={{ height: insets.top, backgroundColor: color.canvas }} />

      {/* Demo banner */}
      {isDemo ? (
        <View className="mx-4 mb-1 flex-row items-center gap-2 rounded-xl bg-sun-wash px-3 py-2">
          <MaterialCommunityIcons color={color.sun} name="eye-outline" size={15} />
          <Text className="flex-1 text-xs font-bold text-marigold">
            Ejemplo · los datos no se mezclan con los tuyos
          </Text>
          <Pressable
            accessibilityLabel="Salir del modo ejemplo"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => void leaveDemo()}
            style={({ pressed }) => [pressed && { opacity: 0.68 }]}
          >
            <Text className="text-xs font-bold text-primary">Salir</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Save state indicator */}
      {saveState === "saving" ? (
        <View className="mx-4 mb-1 flex-row items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
          <MaterialCommunityIcons color={color.inkMuted} name="cloud-sync-outline" size={14} />
          <Text className="text-[11px] text-muted-foreground">Guardando…</Text>
        </View>
      ) : savedVisible ? (
        <View className="mx-4 mb-1 flex-row items-center gap-1.5 rounded-lg bg-forest-wash px-3 py-1.5">
          <MaterialCommunityIcons color={color.forest} name="cloud-check-outline" size={14} />
          <Text className="text-[11px] font-bold text-forest">Guardado</Text>
        </View>
      ) : saveState === "failed" ? (
        <View className="mx-4 mb-1 flex-row items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5">
          <MaterialCommunityIcons color={color.destructive} name="cloud-alert-outline" size={14} />
          <Text className="text-[11px] font-bold text-destructive">
            Error al guardar. Revisa tu conexión.
          </Text>
        </View>
      ) : null}

      {/* Info notice (migration, etc.) */}
      {infoNotice ? (
        <View className="mx-4 mb-1 flex-row items-center gap-2 rounded-xl bg-muted px-3 py-2">
          <MaterialCommunityIcons color={color.inkMuted} name="information-outline" size={15} />
          <Text className="flex-1 text-xs text-muted-foreground">{infoNotice}</Text>
          <Pressable
            accessibilityLabel="Cerrar aviso"
            accessibilityRole="button"
            hitSlop={10}
            onPress={clearInfoNotice}
          >
            <MaterialCommunityIcons color={color.inkMuted} name="close" size={15} />
          </Pressable>
        </View>
      ) : null}

      {/* Header bar */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <Pressable
          accessibilityLabel={`En Obra. Trabajo activo: ${activeProject?.name ?? "ninguno"}`}
          accessibilityRole="button"
          className="min-h-[48px] flex-1 flex-row items-center"
          onPress={() => setProjectSwitcherOpen(true)}
          style={({ pressed }) => [pressed && { opacity: 0.68 }]}
        >
          <View
            className="h-9 w-9 items-center justify-center rounded-md"
            style={{ backgroundColor: color.primary }}
          >
            <MaterialCommunityIcons color={color.surface} name="hammer-wrench" size={20} />
          </View>
          <View className="ml-2 min-w-0 flex-1">
            <Text className="text-lg font-extrabold tracking-tight text-foreground">En Obra</Text>
            {activeProject ? (
              <Text
                className="mt-0.5 text-[11px] font-bold text-muted-foreground"
                numberOfLines={1}
              >
                {activeProject.name}
              </Text>
            ) : null}
          </View>
          <MaterialCommunityIcons color={color.inkMuted} name="chevron-down" size={19} />
        </Pressable>
        <Button
          accessibilityLabel={addBtnLabel}
          className="h-11 w-11"
          icon="plus"
          onPress={handleAddBtn}
          size="icon"
        />
      </View>

      {/* Tab content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "home" ? renderHoy() : null}
        {tab === "jobs" ? renderJobs() : null}
        {tab === "suppliers" ? renderSuppliers() : null}
      </ScrollView>

      {/* Snackbar notice */}
      {notice ? (
        <View
          accessibilityLiveRegion="polite"
          className="absolute left-4 right-4 z-[2] flex-row items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            backgroundColor: color.forestDark,
            bottom: 74 + insets.bottom,
          }}
        >
          <MaterialCommunityIcons color={color.surface} name="check" size={16} />
          <Text className="flex-1 text-xs font-bold" style={{ color: color.primaryForeground }}>
            {notice}
          </Text>
          <Pressable
            accessibilityLabel="Cerrar mensaje"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setNotice(null)}
          >
            <MaterialCommunityIcons color={color.surface} name="close" size={17} />
          </Pressable>
        </View>
      ) : null}

      {/* Undo delete snackbar */}
      {deletedMaterial ? (
        <View
          accessibilityLiveRegion="assertive"
          className="absolute left-4 right-4 z-[3] flex-row items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            backgroundColor: color.forestDark,
            bottom: notice ? 116 + insets.bottom : 74 + insets.bottom,
          }}
        >
          <MaterialCommunityIcons color={color.surface} name="trash-can-outline" size={16} />
          <Text
            className="flex-1 text-xs font-bold"
            style={{ color: color.primaryForeground }}
          >
            "{deletedMaterial.name}" borrado
          </Text>
          <Pressable
            accessibilityLabel="Deshacer borrado"
            accessibilityRole="button"
            className="rounded-md bg-white/20 px-2 py-1"
            hitSlop={8}
            onPress={handleUndoDelete}
          >
            <Text className="text-xs font-extrabold" style={{ color: color.primaryForeground }}>
              Deshacer
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Bottom tab bar */}
      <View
        className="flex-row border-t border-border bg-card px-1 pt-1"
        style={{ paddingBottom: Math.max(insets.bottom, 4) }}
      >
        {tabs.map((item) => {
          const selected = tab === item.id;
          return (
            <Pressable
              accessibilityLabel={item.label}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              className="min-h-[52px] flex-1 items-center"
              key={item.id}
              onPress={() => {
                setTab(item.id);
                if (item.id !== "jobs") setSelectedJobId(undefined);
              }}
              style={({ pressed }) => [pressed && { opacity: 0.68 }]}
            >
              <View
                className={`h-7 w-[38px] items-center justify-center rounded-md ${selected ? "bg-forest-wash" : ""}`}
              >
                <MaterialCommunityIcons
                  color={selected ? color.forest : color.inkMuted}
                  name={item.icon}
                  size={21}
                />
              </View>
              <Text
                className={`mt-0.5 text-[10px] font-bold ${selected ? "text-primary" : "text-muted-foreground"}`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {renderSheets()}
    </View>
  );

  // ── Sheets (shared between mobile and desktop) ────────────────────────────────

  function renderSheets() {
    return (
      <>
        <ProjectSwitcher
          activeProjectId={activeProject?.id}
          onClose={() => setProjectSwitcherOpen(false)}
          onCreateProject={() => {
            setEditProject(undefined);
            setProjectComposerOpen(true);
          }}
          onEditProject={(project) => {
            setEditProject(project);
            setProjectComposerOpen(true);
          }}
          onSelectProject={setActiveProject}
          projects={projects}
          visible={projectSwitcherOpen}
        />
        <ProjectComposer
          onClose={() => {
            setProjectComposerOpen(false);
            setEditProject(undefined);
          }}
          onSave={saveProject}
          onUpdate={saveProjectEdits}
          project={editProject}
          visible={projectComposerOpen}
        />
        <SupplierComposer
          onClose={() => {
            setSupplierComposerOpen(false);
            setEditSupplier(undefined);
          }}
          onSave={saveSupplier}
          onUpdate={saveSupplierEdits}
          supplier={editSupplier}
          visible={supplierComposerOpen}
        />
        <MaterialComposer
          draft={
            newSupplierId
              ? { ...(materialDraft ?? { name: "", quantity: "" }), supplierId: newSupplierId }
              : materialDraft
          }
          material={editMaterial}
          onClose={() => {
            setComposerOpen(false);
            setEditMaterial(undefined);
            setMaterialDraft(undefined);
            setNewSupplierId(undefined);
          }}
          onNewSupplier={(currentDraft) => openNewSupplier(currentDraft)}
          onSave={(input) => {
            const projectId = selectedJobId ?? activeProject?.id;
            if (!projectId) return false;
            return addMaterial(input, projectId);
          }}
          onUpdate={saveMaterialDetails}
          suppliers={suppliers}
          visible={composerOpen || Boolean(editMaterial)}
        />
        {statusEditorMaterial ? (
          <MaterialStatusComposer
            material={statusEditorMaterial}
            onClose={() => setStatusEditorMaterial(undefined)}
            onSave={saveMaterialStatus}
            visible
          />
        ) : null}
        <RegisterContactSheet
          onClose={() => setRegisterContactSupplierId(undefined)}
          onSave={handleRegisterContact}
          supplier={registerContactSupplier}
          visible={Boolean(registerContactSupplierId)}
        />
        <ClientViewSheet
          isDemo={isDemo}
          materials={clientViewMaterials}
          onClose={() => setClientViewJobId(undefined)}
          onWhatsApp={() => void sendClientWhatsApp()}
          project={clientViewProject}
          visible={Boolean(clientViewJobId)}
        />
        <SettingsSheet
          onClose={() => setSettingsOpen(false)}
          onEraseAll={async () => {
            await eraseAll();
          }}
          onExportJson={handleExportJson}
          visible={settingsOpen}
        />
      </>
    );
  }
}

const shadowStyles = StyleSheet.create({
  nextAction: Platform.select({
    web: { boxShadow: `0px 3px 7px ${color.shadow}` },
    default: {},
  }),
});
