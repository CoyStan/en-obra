import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { DatePickerField } from "../components/tracker/DatePickerField";
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
import {
  attentionMaterialCount,
  deliveryMeta,
  formatTrackerDate as formatDate,
  nextMaterialForAction,
  projectDescriptor,
  readyMaterialCount,
  statusMeta,
  supplierFor,
  trackerTabs as tabs,
} from "../tracker/presentation";
import { trackerColors as color } from "../tracker/theme";
import type { Material, MaterialDetailsUpdateInput, MaterialStatus, NewMaterialInput, Project, Supplier, TrackerTab as TabId } from "../tracker/types";
import { useTrackerData } from "../tracker/useTrackerData";

function MaterialsProgress({ materials, inverse = false }: { materials: Material[]; inverse?: boolean }) {
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
    <View className="h-7 flex-row items-center gap-1 self-start rounded-full px-2" style={{ backgroundColor: meta.wash }}>
      <MaterialCommunityIcons color={meta.color} name={meta.icon} size={15} />
      <Text className="text-[11px] font-extrabold" style={{ color: meta.color }}>
        {meta.label}
      </Text>
    </View>
  );
}

function MaterialRow({
  material,
  onChangeStatus,
  onEdit,
  clientView = false,
}: {
  material: Material;
  supplier?: Supplier;
  onChangeStatus?: () => void;
  onEdit?: () => void;
  clientView?: boolean;
}) {
  const meta = statusMeta[material.status];
  const delivery = deliveryMeta(material);
  const detail = `${material.quantity} · ${delivery.label}`;

  const body = (
    <>
      <View className="h-[42px] w-[42px] items-center justify-center rounded-md" style={{ backgroundColor: meta.wash }}>
        <MaterialCommunityIcons color={meta.color} name={meta.icon} size={21} />
      </View>
      <View className="mx-3 min-w-0 flex-1">
        <Text className="text-sm font-extrabold text-foreground" numberOfLines={1}>
          {material.name}
        </Text>
        <Text className="mt-0.5 text-xs" numberOfLines={1} style={{ color: delivery.color }}>
          {detail}
        </Text>
        {clientView && material.proofNote && (material.status === "received" || material.status === "installed") ? (
          <View className="mt-1 flex-row items-center gap-1">
            <MaterialCommunityIcons color={color.success} name="shield-check-outline" size={13} />
            <Text className="text-[11px] font-bold text-forest">Entrega confirmada</Text>
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
      {onChangeStatus ? (
        <Pressable
          accessibilityHint="Abre las opciones de estado y no cambia nada hasta guardar"
          accessibilityLabel={`Cambiar estado de ${material.name}. Estado actual: ${meta.label}`}
          accessibilityRole="button"
          className="min-h-[34px] flex-row items-center gap-0.5 rounded-full px-2"
          hitSlop={8}
          onPress={onChangeStatus}
          style={({ pressed }) => [{ backgroundColor: meta.wash }, pressed && { opacity: 0.68 }]}
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
  );
}

function EmptyMaterials({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="items-center px-6 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-forest-wash">
        <MaterialCommunityIcons color={color.forest} name="package-variant-plus" size={28} />
      </View>
      <Text className="mt-3 text-base font-extrabold text-foreground">Todavía no hay materiales</Text>
      <Text className="mt-1 text-center text-[13px] leading-[19px] text-muted-foreground">
        Agrega lo primero que vas a pedir para que el cliente pueda seguir el avance.
      </Text>
      <Button className="mt-4" icon="arrow-right" onPress={onAdd} variant="ghost">
        Agregar material
      </Button>
    </View>
  );
}

function MaterialComposer({
  visible,
  suppliers,
  initialSupplierId,
  material,
  onClose,
  onNewSupplier,
  onSave,
  onUpdate,
}: {
  visible: boolean;
  suppliers: Supplier[];
  initialSupplierId?: string;
  material?: Material;
  onClose: () => void;
  onNewSupplier: () => void;
  onSave: (input: NewMaterialInput) => boolean;
  onUpdate?: (input: MaterialDetailsUpdateInput) => boolean;
}) {
  const isEdit = Boolean(material);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expectedOn, setExpectedOn] = useState<string | undefined>();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const saveLock = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (material) {
        setName(material.name);
        setQuantity(material.quantity);
        setExpectedOn(material.expectedOn);
        setSupplierId(initialSupplierId ?? material.supplierId);
      } else {
        setName("");
        setQuantity("");
        setExpectedOn(undefined);
        setSupplierId(initialSupplierId ?? suppliers[0]?.id ?? "");
      }
      saveLock.current = false;
      setIsSaving(false);
    }
  }, [initialSupplierId, material, suppliers, visible]);

  const dismiss = () => {
    setError(null);
    onClose();
  };
  const save = () => {
    if (saveLock.current) {
      return;
    }
    saveLock.current = true;
    setIsSaving(true);
    const details = { name, quantity, expectedOn, supplierId };
    const saved = isEdit && onUpdate ? onUpdate(details) : onSave({ ...details, price: "" });
    if (!saved) {
      setError("Escribe el material, la cantidad y el proveedor.");
      saveLock.current = false;
      setIsSaving(false);
      return;
    }
    if (!isEdit) {
      setName("");
      setQuantity("");
      setExpectedOn(undefined);
    }
    setError(null);
    onClose();
  };

  return (
    <Sheet onClose={dismiss} visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SheetHeader
          onClose={dismiss}
          subtitle={isEdit ? "Ajusta nombre, cantidad o proveedor." : "Solo lo necesario para este trabajo."}
          title={isEdit ? "Editar material" : "Nuevo material"}
        />
        <ScrollView keyboardShouldPersistTaps="handled">
          <SheetContent>
            <Field label="Material">
              <Input autoComplete="off" onChangeText={setName} placeholder="Ej. Plantas de sombra…" value={name} />
            </Field>
            <Field label="Cantidad">
              <Input autoComplete="off" onChangeText={setQuantity} placeholder="Ej. 18 piezas…" value={quantity} />
            </Field>
            <DatePickerField clearable label="Entrega estimada" onChange={setExpectedOn} optional value={expectedOn} />
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-[13px] font-extrabold text-foreground">Proveedor</Text>
              <Button className="h-auto min-h-[44px] px-1" icon="plus" onPress={onNewSupplier} size="sm" variant="ghost">
                Nuevo proveedor
              </Button>
            </View>
            <View className="gap-2">
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
                      selected ? { backgroundColor: color.forestWash, borderColor: color.forest } : undefined,
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
                      <Text className="text-[13px] font-extrabold text-foreground">{supplier.name}</Text>
                      <Text className="mt-0.5 text-[11px] text-muted-foreground">{supplier.category}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {error ? (
              <Text accessibilityLiveRegion="polite" className="text-sm font-bold text-destructive">
                {error}
              </Text>
            ) : null}
          </SheetContent>
        </ScrollView>
        <SheetFooter>
          <Button className="flex-1" disabled={isSaving} icon="arrow-right" onPress={save}>
            {isSaving ? "Guardando…" : isEdit ? "Guardar cambios" : "Agregar al trabajo"}
          </Button>
        </SheetFooter>
      </KeyboardAvoidingView>
    </Sheet>
  );
}

export function TrackerScreen() {
  const {
    activeProject,
    addMaterial,
    addProject,
    addSupplier,
    data,
    isLoading,
    materials,
    persistenceError,
    selectProject,
    updateMaterialDetails,
    updateMaterialStatus,
    updateProject,
    updateSupplier,
  } = useTrackerData();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<TabId>("home");
  const [composerOpen, setComposerOpen] = useState(false);
  const [projectComposerOpen, setProjectComposerOpen] = useState(false);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [supplierComposerOpen, setSupplierComposerOpen] = useState(false);
  const [returnToMaterial, setReturnToMaterial] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | undefined>();
  const [statusEditorMaterial, setStatusEditorMaterial] = useState<Material | undefined>();
  const [editMaterial, setEditMaterial] = useState<Material | undefined>();
  const [editProject, setEditProject] = useState<Project | undefined>();
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>();
  const [notice, setNotice] = useState<string | null>(null);

  const sortedMaterials = useMemo(
    () => [...materials].sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1)),
    [materials],
  );
  const supplierName = (id: string) => supplierFor(data.suppliers, id);
  const outstanding = nextMaterialForAction(materials);
  const nextDelivery = outstanding ? deliveryMeta(outstanding) : undefined;
  const attentionCount = attentionMaterialCount(materials);
  const isDesktop = width >= 960;

  const openStatusEditor = (material: Material) => {
    setStatusEditorMaterial(material);
  };
  const openMaterialEditor = (material: Material) => {
    setEditMaterial(material);
  };
  const saveMaterialDetails = (input: MaterialDetailsUpdateInput) => {
    if (!editMaterial) {
      return false;
    }
    const saved = updateMaterialDetails(editMaterial.id, input);
    if (saved) {
      setNotice(`${input.name.trim()}: cambios guardados.`);
      setEditMaterial(undefined);
    }
    return saved;
  };
  const saveMaterialStatus = (input: Parameters<typeof updateMaterialStatus>[1]) => {
    if (!statusEditorMaterial) {
      return;
    }
    updateMaterialStatus(statusEditorMaterial.id, input);
    setNotice(`${statusEditorMaterial.name}: ${statusMeta[input.status].label.toLowerCase()}.`);
    setStatusEditorMaterial(undefined);
  };
  const openWhatsApp = async (supplier: Supplier) => {
    if (!supplier.phone) {
      setNotice(`Agrega el WhatsApp de ${supplier.name} para escribirle desde aquí.`);
      return;
    }
    const message = encodeURIComponent(`Hola ${supplier.name}, te escribo por el trabajo “${activeProject?.name ?? ""}”.`);
    try {
      await Linking.openURL(`https://wa.me/${supplier.phone}?text=${message}`);
    } catch {
      setNotice("No se pudo abrir WhatsApp en este dispositivo.");
    }
  };
  const sendClientUpdate = async () => {
    if (!activeProject.clientPhone) {
      setNotice(`Agrega el WhatsApp de ${activeProject.clientName} para enviarle el avance.`);
      return;
    }
    const readyMaterials = materials.filter((material) => material.status === "received" || material.status === "installed").length;
    const latestProof = sortedMaterials.find(
      (material) => material.proofNote && (material.status === "received" || material.status === "installed"),
    );
    const message = encodeURIComponent(
      `Hola ${activeProject.clientName.split(" ")[0]}, actualización de “${activeProject.name}”: ${readyMaterials} de ${materials.length} materiales ya están recibidos. ${latestProof ? `Último confirmado: ${latestProof.name}.` : "Seguimos confirmando las próximas entregas."}`,
    );
    try {
      await Linking.openURL(`https://wa.me/${activeProject.clientPhone}?text=${message}`);
    } catch {
      setNotice("No se pudo abrir WhatsApp en este dispositivo.");
    }
  };
  const openNewSupplier = (resumeMaterial = false) => {
    setEditSupplier(undefined);
    setReturnToMaterial(resumeMaterial);
    setComposerOpen(false);
    setSupplierComposerOpen(true);
  };
  const saveSupplier = (input: Parameters<typeof addSupplier>[0]) => {
    const supplierId = addSupplier(input);
    if (supplierId && returnToMaterial) {
      setSelectedSupplierId(supplierId);
      setReturnToMaterial(false);
      setComposerOpen(true);
    }
    return supplierId;
  };
  const saveProject = (input: Parameters<typeof addProject>[0]) => {
    const saved = addProject(input);
    if (saved) {
      setTab("home");
      setNotice(`Trabajo de ${input.clientName.trim()} listo para empezar.`);
    }
    return saved;
  };
  const saveProjectEdits = (input: Parameters<typeof updateProject>[1]) => {
    if (!editProject) {
      return false;
    }
    const saved = updateProject(editProject.id, input);
    if (saved) {
      setNotice(`Trabajo actualizado: ${input.name.trim()}.`);
      setEditProject(undefined);
    }
    return saved;
  };
  const saveSupplierEdits = (input: Parameters<typeof updateSupplier>[1]) => {
    if (!editSupplier) {
      return false;
    }
    const saved = updateSupplier(editSupplier.id, input);
    if (saved) {
      setNotice(`${input.name.trim()}: proveedor actualizado.`);
      setEditSupplier(undefined);
    }
    return saved;
  };

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timeoutId = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    if (persistenceError) {
      setNotice(persistenceError);
    }
  }, [persistenceError]);

  if (!activeProject || isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: color.canvas }}>
        <View className="flex-1 gap-4 p-4 pt-[70px]">
          <View className="h-7 w-[62%] rounded-md bg-muted" />
          <View className="h-4 w-[44%] rounded-md bg-muted" />
          <View className="h-[132px] rounded-xl bg-muted" />
          <View className="h-[132px] rounded-xl bg-muted" />
        </View>
      </SafeAreaView>
    );
  }

  const renderHome = () => (
    <>
      <View className="pb-6 pt-6">
          <View className="mb-2 flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full bg-forest" />
            <Text className="text-xs font-bold tracking-wide text-muted-foreground">Trabajo en curso</Text>
            <MaterialCommunityIcons color={color.forest} name="hard-hat" size={14} />
          </View>
        <Text className="text-[30px] font-extrabold leading-9 tracking-tight text-foreground">{activeProject.name}</Text>
        <Text className="mt-2 text-sm leading-[21px] text-muted-foreground">{projectDescriptor(activeProject)}</Text>
      </View>
      <Card className="border-0 py-4" style={{ backgroundColor: color.primary }}>
        <CardContent>
          <View className="flex-row items-center">
            <View
              className="h-[38px] w-[38px] items-center justify-center rounded-full"
              style={{ backgroundColor: color.sunWash }}
            >
              <Text className="text-[15px] font-extrabold" style={{ color: color.forestDark }}>
                {activeProject.clientName.charAt(0)}
              </Text>
            </View>
            <View className="ml-3 min-w-0 flex-1">
              <Text className="text-[11px] font-bold" style={{ color: color.secondary }}>
                Cliente
              </Text>
              <Text className="mt-0.5 text-[15px] font-bold" style={{ color: color.primaryForeground }}>
                {activeProject.clientName}
              </Text>
            </View>
            <Pressable
              accessibilityHint="Abre la vista previa para el cliente"
              accessibilityLabel="Vista previa para cliente"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setTab("client")}
              style={({ pressed }) => [pressed && { opacity: 0.68 }]}
            >
              <Badge className="border-0 bg-white/10" labelClassName="text-[11px] font-bold text-primary-foreground" variant="ghost">
                Vista previa
              </Badge>
            </Pressable>
          </View>
          <MaterialsProgress inverse materials={materials} />
        </CardContent>
      </Card>
      <View className="mb-3 mt-8 flex-row items-center justify-between">
        <Text className="text-[17px] font-extrabold tracking-tight text-foreground">Lo siguiente</Text>
        <Text className="text-xs text-muted-foreground">Un paso a la vez</Text>
      </View>
      {outstanding && nextDelivery ? (
        <View className="flex-row items-center rounded-xl bg-card p-3" style={shadowStyles.nextAction}>
          <View className="h-[46px] w-[46px] items-center justify-center rounded-md" style={{ backgroundColor: nextDelivery.wash }}>
            <MaterialCommunityIcons color={nextDelivery.color} name={nextDelivery.icon} size={22} />
          </View>
          <View className="mx-3 min-w-0 flex-1">
            <Text className="text-xs font-bold" style={{ color: nextDelivery.color }}>
              {nextDelivery.label}
            </Text>
            <Text className="mt-0.5 text-[15px] font-extrabold text-foreground">{outstanding.name}</Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              {supplierName(outstanding.supplierId)?.name ?? "Proveedor por confirmar"}
            </Text>
          </View>
          <Button
            accessibilityHint="Abre las opciones de estado"
            accessibilityLabel={`Cambiar estado de ${outstanding.name}`}
            className="h-[42px] w-[42px]"
            icon="pencil-outline"
            onPress={() => openStatusEditor(outstanding)}
            size="icon"
          />
        </View>
      ) : (
        <View className="flex-row items-center gap-2 rounded-xl bg-forest-wash p-4">
          <MaterialCommunityIcons color={color.success} name="check-decagram-outline" size={21} />
          <Text className="flex-1 text-sm font-bold text-forest">Todo el material está recibido o usado.</Text>
        </View>
      )}
      <View className="mb-3 mt-8 flex-row items-center justify-between">
        <Text className="text-[17px] font-extrabold tracking-tight text-foreground">Movimiento reciente</Text>
        <Button className="h-auto min-h-0 px-0" onPress={() => setTab("materials")} size="sm" variant="ghost">
          Ver todo
        </Button>
      </View>
      <Card className="overflow-hidden py-0">
        {sortedMaterials.slice(0, 3).map((material, index) => (
          <View key={material.id}>
            {index > 0 ? <Separator /> : null}
            <MaterialRow
              material={material}
              onChangeStatus={() => openStatusEditor(material)}
              onEdit={() => openMaterialEditor(material)}
              supplier={supplierName(material.supplierId)}
            />
          </View>
        ))}
      </Card>
    </>
  );

  const renderMaterials = () => (
    <>
      <View className="pb-6 pt-6">
        <Text className="text-[27px] font-extrabold tracking-tight text-foreground">Materiales</Text>
        <Text className="mt-2 text-sm leading-5 text-muted-foreground">
          Cada cambio queda claro para ti y para {activeProject.clientName.split(" ")[0]}.
        </Text>
      </View>
      <Card className="mb-4 border-0 bg-forest-wash py-4">
        <CardContent>
          <View className="mb-3 flex-row items-center gap-2">
            <MaterialCommunityIcons color={color.forest} name="chart-timeline-variant" size={18} />
            <Text className="text-xs font-bold text-primary-dark">Avance del material</Text>
          </View>
          <MaterialsProgress materials={materials} />
          <Text className="mt-3 text-xs leading-[18px] text-primary-dark">
            {materials.length} materiales en este trabajo ·{" "}
            {attentionCount ? `${attentionCount} requieren seguimiento` : "sin pendientes urgentes"}
          </Text>
        </CardContent>
      </Card>
      <Card className="overflow-hidden py-0">
        {sortedMaterials.length ? (
          sortedMaterials.map((material, index) => (
            <View key={material.id}>
              {index > 0 ? <Separator /> : null}
              <MaterialRow
              material={material}
              onChangeStatus={() => openStatusEditor(material)}
              onEdit={() => openMaterialEditor(material)}
              supplier={supplierName(material.supplierId)}
            />
            </View>
          ))
        ) : (
          <EmptyMaterials onAdd={() => setComposerOpen(true)} />
        )}
      </Card>
    </>
  );

  const renderSuppliers = () => (
    <>
      <View className="pb-6 pt-6">
        <Text className="text-[27px] font-extrabold tracking-tight text-foreground">Proveedores</Text>
        <Text className="mt-2 text-sm leading-5 text-muted-foreground">
          Guarda solo el contacto y el último acuerdo de cada compra.
        </Text>
      </View>
      <View className="gap-3">
        {data.suppliers.map((supplier) => {
          const supplied = materials.filter((material) => material.supplierId === supplier.id);
          return (
            <Card key={supplier.id}>
              <CardContent>
                <View className="flex-row items-center">
                  <View className="h-11 w-11 items-center justify-center rounded-md bg-forest-wash">
                    <MaterialCommunityIcons color={color.forest} name="store-outline" size={22} />
                  </View>
                  <View className="ml-3 min-w-0 flex-1">
                    <Text className="text-[15px] font-extrabold text-foreground">{supplier.name}</Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">{supplier.category}</Text>
                  </View>
                </View>
                <View className="mt-3 flex-row gap-2 rounded-md bg-background p-3">
                  <MaterialCommunityIcons color={color.inkMuted} name="message-text-outline" size={17} />
                  <Text className="flex-1 text-xs leading-[18px] text-muted-foreground">{supplier.lastContactNote}</Text>
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-xs text-muted-foreground">
                    {supplied.length} {supplied.length === 1 ? "material" : "materiales"} en este trabajo
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
                    <Button icon="whatsapp" onPress={() => openWhatsApp(supplier)} size="sm" variant="secondary">
                      Escribir
                    </Button>
                  </View>
                </View>
              </CardContent>
            </Card>
          );
        })}
      </View>
    </>
  );

  const renderClient = () => {
    const latestProof = sortedMaterials.find(
      (material) => material.proofNote && (material.status === "received" || material.status === "installed"),
    );
    return (
      <>
        <Card className="mt-6 border-0 bg-sun-wash">
          <CardContent className="flex-row items-center">
            <View className="h-[42px] w-[42px] items-center justify-center rounded-md bg-sun-wash">
              <MaterialCommunityIcons color={color.forestDark} name="account-heart-outline" size={24} />
            </View>
            <View className="ml-3 min-w-0 flex-1">
              <Text className="text-[11px] font-extrabold text-marigold">Vista previa para cliente</Text>
              <Text className="mt-0.5 text-[13px] font-bold leading-[18px] text-primary-dark">
                Claro, sin costos ni pendientes internos.
              </Text>
            </View>
          </CardContent>
        </Card>
        <View className="pb-6 pt-6">
          <Text className="text-[27px] font-extrabold tracking-tight text-foreground">Avance de {activeProject.name}</Text>
          <Text className="mt-2 text-sm leading-5 text-muted-foreground">
            {activeProject.address || "Dirección por confirmar"} · Actualizado hoy
          </Text>
        </View>
        <Card>
          <CardContent>
            <Text className="text-[17px] font-extrabold text-foreground">Hola, {activeProject.clientName.split(" ")[0]}.</Text>
            <Text className="mt-1.5 text-[13px] leading-[19px] text-muted-foreground">
              Aquí puedes ver los materiales que vamos recibiendo para tu trabajo.
            </Text>
            <View className="mt-3">
              <MaterialsProgress materials={materials} />
            </View>
          </CardContent>
        </Card>
        {latestProof ? (
          <Card className="mt-4 border-0 bg-forest-wash">
            <CardContent className="flex-row items-start">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-card">
                <MaterialCommunityIcons color={color.success} name="shield-check-outline" size={20} />
              </View>
              <View className="ml-2 min-w-0 flex-1">
                <Text className="text-[11px] font-extrabold text-forest">Última recepción confirmada</Text>
                <Text className="mt-0.5 text-[13px] font-extrabold text-primary-dark">
                  {latestProof.name} · {formatDate(latestProof.receivedOn)}
                </Text>
                <Text className="mt-1 text-xs leading-[17px] text-primary-dark">{latestProof.proofNote}</Text>
              </View>
            </CardContent>
          </Card>
        ) : null}
        <Text className="mb-3 mt-8 text-base font-extrabold text-foreground">Materiales del trabajo</Text>
        <Card className="overflow-hidden py-0">
          {sortedMaterials.length ? (
            sortedMaterials.map((material, index) => (
              <View key={material.id}>
                {index > 0 ? <Separator /> : null}
                <MaterialRow clientView material={material} supplier={supplierName(material.supplierId)} />
              </View>
            ))
          ) : (
            <View className="items-center p-6">
              <Text className="text-[15px] font-extrabold text-foreground">Preparando la lista de materiales</Text>
              <Text className="mt-1 text-center text-[13px] leading-[19px] text-muted-foreground">
                Aquí aparecerán las entregas cuando las registres en el trabajo.
              </Text>
            </View>
          )}
        </Card>
        <View className="mx-2 mt-4 flex-row items-center gap-2">
          <MaterialCommunityIcons color={color.inkMuted} name="shield-check-outline" size={17} />
          <Text className="flex-1 text-xs leading-[17px] text-muted-foreground">
            Esta vista solo informa el avance. No procesa pagos.
          </Text>
        </View>
        <Button className="mt-4" icon="whatsapp" onPress={sendClientUpdate}>
          Enviar actualización
        </Button>
      </>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: color.canvas }}>
      <View className={`flex-1 ${!isDesktop ? "mx-auto max-w-[680px]" : ""}`} style={{ backgroundColor: color.canvas }}>
        {isDesktop ? (
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
            onOpenSupplier={openWhatsApp}
            onSelectTab={setTab}
            onSendClientUpdate={sendClientUpdate}
            onSwitchProject={() => setProjectSwitcherOpen(true)}
            sortedMaterials={sortedMaterials}
            tab={tab}
          />
        ) : (
          <>
            <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
              <Pressable
                accessibilityLabel={`Cambiar trabajo. Activo: ${activeProject.name}`}
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
                  <Text className="mt-0.5 text-[11px] font-bold text-muted-foreground" numberOfLines={1}>
                    {activeProject.name}
                  </Text>
                </View>
                <MaterialCommunityIcons color={color.inkMuted} name="chevron-down" size={19} />
              </Pressable>
              {tab !== "client" ? (
                <Button
                  accessibilityLabel={tab === "suppliers" ? "Agregar proveedor" : "Agregar material"}
                  className="h-11 w-11"
                  icon="plus"
                  onPress={() => {
                    if (tab === "suppliers") {
                      openNewSupplier();
                    } else {
                      setEditMaterial(undefined);
                      setComposerOpen(true);
                    }
                  }}
                  size="icon"
                />
              ) : null}
            </View>
            <ScrollView className="flex-1" contentContainerClassName="px-4 pb-[118px] pt-1" showsVerticalScrollIndicator={false}>
              {tab === "home" ? renderHome() : null}
              {tab === "materials" ? renderMaterials() : null}
              {tab === "suppliers" ? renderSuppliers() : null}
              {tab === "client" ? renderClient() : null}
            </ScrollView>
          </>
        )}
        {notice ? (
          <View
            accessibilityLiveRegion="polite"
            className="absolute bottom-[74px] left-4 right-4 z-[2] flex-row items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: color.forestDark }}
          >
            <MaterialCommunityIcons color={color.surface} name="check" size={16} />
            <Text className="flex-1 text-xs font-bold" style={{ color: color.primaryForeground }}>
              {notice}
            </Text>
            <Pressable accessibilityLabel="Cerrar mensaje" accessibilityRole="button" hitSlop={10} onPress={() => setNotice(null)}>
              <MaterialCommunityIcons color={color.surface} name="close" size={17} />
            </Pressable>
          </View>
        ) : null}
        {!isDesktop ? (
          <View className="flex-row border-t border-border bg-card px-1 pb-1 pt-1">
            {tabs.map((item) => {
              const selected = tab === item.id;
              return (
                <Pressable
                  accessibilityLabel={item.label}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  className="min-h-[52px] flex-1 items-center"
                  key={item.id}
                  onPress={() => setTab(item.id)}
                  style={({ pressed }) => [pressed && { opacity: 0.68 }]}
                >
                  <View className={`h-7 w-[38px] items-center justify-center rounded-md ${selected ? "bg-forest-wash" : ""}`}>
                    <MaterialCommunityIcons color={selected ? color.forest : color.inkMuted} name={item.icon} size={21} />
                  </View>
                  <Text className={`mt-0.5 text-[10px] font-bold ${selected ? "text-primary" : "text-muted-foreground"}`}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <ProjectSwitcher
          activeProjectId={activeProject.id}
          onClose={() => setProjectSwitcherOpen(false)}
          onCreateProject={() => {
            setEditProject(undefined);
            setProjectComposerOpen(true);
          }}
          onEditProject={(project) => {
            setEditProject(project);
            setProjectComposerOpen(true);
          }}
          onSelectProject={selectProject}
          projects={data.projects}
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
          initialSupplierId={selectedSupplierId}
          material={editMaterial}
          onClose={() => {
            setComposerOpen(false);
            setEditMaterial(undefined);
            setSelectedSupplierId(undefined);
          }}
          onNewSupplier={() => openNewSupplier(true)}
          onSave={addMaterial}
          onUpdate={saveMaterialDetails}
          suppliers={data.suppliers}
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
      </View>
    </SafeAreaView>
  );
}

const shadowStyles = StyleSheet.create({
  nextAction: Platform.select({
    web: { boxShadow: `0px 3px 7px ${color.shadow}` },
    default: {},
  }),
});
