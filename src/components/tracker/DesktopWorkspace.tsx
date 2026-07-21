import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, CardContent } from "../reusables";
import {
  attentionMaterialCount,
  deliveryMeta,
  formatTrackerDate,
  nextMaterialForAction,
  projectDescriptor,
  readyMaterialCount,
  statusMeta,
  supplierFor,
  trackerTabs,
} from "../../tracker/presentation";
import { trackerColors as color, trackerRadius as radius, trackerSpacing as space } from "../../tracker/theme";
import type { Material, Project, Supplier, TrackerData, TrackerTab } from "../../tracker/types";

type DesktopWorkspaceProps = {
  activeProject: Project;
  data: TrackerData;
  materials: Material[];
  sortedMaterials: Material[];
  tab: TrackerTab;
  onAddMaterial: () => void;
  onAddProject: () => void;
  onAddSupplier: () => void;
  onChangeMaterialStatus: (material: Material) => void;
  onEditMaterial: (material: Material) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onOpenSupplier: (supplier: Supplier) => void;
  onSelectTab: (tab: TrackerTab) => void;
  onSendClientUpdate: () => void;
  onSwitchProject: () => void;
};

const pageCopy: Record<TrackerTab, { title: string; subtitle: string }> = {
  home: { title: "Control del trabajo", subtitle: "Una vista clara antes de volver al jardín." },
  materials: { title: "Materiales del trabajo", subtitle: "Pedidos y entregas claros, sin mezclar pagos." },
  suppliers: { title: "Proveedores", subtitle: "El último acuerdo y la siguiente conversación, sin buscar en chats." },
  client: { title: "Vista previa para cliente", subtitle: "Así se ve la actualización que puedes enviar sin mostrar costos internos." },
};

function StatusChip({ material, onChangeStatus }: { material: Material; onChangeStatus?: () => void }) {
  const meta = statusMeta[material.status];
  if (onChangeStatus) {
    return (
      <Pressable
        accessibilityHint="Abre las opciones de estado y no cambia nada hasta guardar"
        accessibilityLabel={`Cambiar estado de ${material.name}. Estado actual: ${meta.label}`}
        accessibilityRole="button"
        className="min-h-[40px] flex-row items-center gap-0.5 rounded-full px-2"
        onPress={onChangeStatus}
        style={({ pressed }) => [{ backgroundColor: meta.wash }, pressed && styles.pressed]}
      >
        <Text className="text-[11px] font-extrabold" style={{ color: meta.color }}>
          {meta.label}
        </Text>
        <MaterialCommunityIcons color={meta.color} name="chevron-down" size={16} />
      </Pressable>
    );
  }
  return (
    <View className="flex-row items-center gap-1 rounded-full px-2 py-1.5" style={{ backgroundColor: meta.wash }}>
      <MaterialCommunityIcons color={meta.color} name={meta.icon} size={14} />
      <Text className="text-[11px] font-extrabold" style={{ color: meta.color }}>
        {meta.label}
      </Text>
    </View>
  );
}

function MaterialTable({
  materials,
  suppliers,
  onChangeMaterialStatus,
  onEditMaterial,
  clientView = false,
}: {
  materials: Material[];
  suppliers: Supplier[];
  onChangeMaterialStatus?: (material: Material) => void;
  onEditMaterial?: (material: Material) => void;
  clientView?: boolean;
}) {
  if (!materials.length) {
    return (
      <Card className="flex-row items-center gap-3 bg-background">
        <MaterialCommunityIcons color={color.forest} name="package-variant-plus" size={24} />
        <View>
          <Text className="text-sm font-extrabold text-foreground">Aún no hay materiales</Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">Agrega el primero cuando tengas el próximo pedido.</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden py-0">
      <View className="min-h-[42px] flex-row items-center bg-background px-4">
        <Text className="flex-[1.55] text-[11px] font-extrabold text-muted-foreground">Material</Text>
        <Text className="flex-[1.15] text-[11px] font-extrabold text-muted-foreground">Proveedor</Text>
        <Text className="flex-[0.95] text-[11px] font-extrabold text-muted-foreground">Entrega</Text>
        <Text className="flex-[0.85] text-right text-[11px] font-extrabold text-muted-foreground">Estado</Text>
      </View>
      {materials.map((material, index) => {
        const supplier = supplierFor(suppliers, material.supplierId);
        const meta = statusMeta[material.status];
        const delivery = deliveryMeta(material);
        return (
          <View className="min-h-[68px] flex-row items-center px-4" key={material.id} style={index > 0 ? styles.tableDivider : undefined}>
            {onEditMaterial && !clientView ? (
              <Pressable
                accessibilityHint="Abre el editor de material"
                accessibilityLabel={`Editar ${material.name}`}
                accessibilityRole="button"
                className="flex-[1.55] flex-row items-center pr-3"
                onPress={() => onEditMaterial(material)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <View className="h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: meta.wash }}>
                  <MaterialCommunityIcons color={meta.color} name={meta.icon} size={18} />
                </View>
                <View className="ml-2 min-w-0 flex-1">
                  <Text className="text-[13px] font-extrabold text-foreground" numberOfLines={1}>
                    {material.name}
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-muted-foreground" numberOfLines={1}>
                    {material.quantity}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View className="flex-[1.55] flex-row items-center pr-3">
                <View className="h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: meta.wash }}>
                  <MaterialCommunityIcons color={meta.color} name={meta.icon} size={18} />
                </View>
                <View className="ml-2 min-w-0 flex-1">
                  <Text className="text-[13px] font-extrabold text-foreground" numberOfLines={1}>
                    {material.name}
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-muted-foreground" numberOfLines={1}>
                    {material.quantity}
                  </Text>
                </View>
              </View>
            )}
            <Text className="flex-[1.15] pr-3 text-xs leading-[17px] text-muted-foreground" numberOfLines={1}>
              {supplier?.name ?? "Sin proveedor"}
            </Text>
            <View className="flex-[0.95] pr-3">
              <Text className="text-xs leading-[17px]" numberOfLines={1} style={{ color: delivery.color }}>
                {delivery.label}
              </Text>
              {clientView && material.proofNote ? (
                <Text className="mt-0.5 text-[10px] font-bold text-forest" numberOfLines={1}>
                  Entrega confirmada
                </Text>
              ) : null}
            </View>
            <View className="flex-[0.85] items-end">
              <StatusChip
                material={material}
                onChangeStatus={onChangeMaterialStatus ? () => onChangeMaterialStatus(material) : undefined}
              />
            </View>
          </View>
        );
      })}
    </Card>
  );
}

function SupplierTable({
  materials,
  onEditSupplier,
  onOpenSupplier,
  suppliers,
}: {
  materials: Material[];
  onEditSupplier: (supplier: Supplier) => void;
  onOpenSupplier: (supplier: Supplier) => void;
  suppliers: Supplier[];
}) {
  return (
    <Card className="overflow-hidden py-0">
      <View className="min-h-[42px] flex-row items-center bg-background px-4">
        <Text className="flex-[1.25] text-[11px] font-extrabold text-muted-foreground">Proveedor</Text>
        <Text className="flex-[2.1] text-[11px] font-extrabold text-muted-foreground">Último acuerdo</Text>
        <Text className="flex-[0.75] text-[11px] font-extrabold text-muted-foreground">Materiales</Text>
        <Text className="flex-[0.9] text-right text-[11px] font-extrabold text-muted-foreground">Acción</Text>
      </View>
      {suppliers.map((supplier, index) => {
        const supplied = materials.filter((material) => material.supplierId === supplier.id);
        return (
          <View className="min-h-[68px] flex-row items-center px-4" key={supplier.id} style={index > 0 ? styles.tableDivider : undefined}>
            <View className="flex-[1.25] flex-row items-center pr-3">
              <View className="h-9 w-9 items-center justify-center rounded-md bg-forest-wash">
                <MaterialCommunityIcons color={color.forest} name="store-outline" size={18} />
              </View>
              <View className="ml-2 min-w-0 flex-1">
                <Text className="text-[13px] font-extrabold text-foreground" numberOfLines={1}>
                  {supplier.name}
                </Text>
                <Text className="mt-0.5 text-[11px] text-muted-foreground" numberOfLines={1}>
                  {supplier.category}
                </Text>
              </View>
            </View>
            <Text className="flex-[2.1] pr-3 text-xs leading-[17px] text-muted-foreground" numberOfLines={2}>
              {supplier.lastContactNote}
            </Text>
            <Text className="flex-[0.75] pr-3 text-xs text-muted-foreground">{supplied.length}</Text>
            <View className="flex-[0.9] flex-row items-center justify-end gap-1">
              <Button icon="pencil-outline" onPress={() => onEditSupplier(supplier)} size="sm" variant="ghost">
                Editar
              </Button>
              <Button icon="whatsapp" onPress={() => onOpenSupplier(supplier)} size="sm" variant="secondary">
                Escribir
              </Button>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

export function DesktopWorkspace({
  activeProject,
  data,
  materials,
  sortedMaterials,
  tab,
  onAddMaterial,
  onAddProject,
  onAddSupplier,
  onChangeMaterialStatus,
  onEditMaterial,
  onEditSupplier,
  onOpenSupplier,
  onSelectTab,
  onSendClientUpdate,
  onSwitchProject,
}: DesktopWorkspaceProps) {
  const ready = readyMaterialCount(materials);
  const attention = attentionMaterialCount(materials);
  const outstanding = nextMaterialForAction(materials);
  const nextDelivery = outstanding ? deliveryMeta(outstanding) : undefined;
  const latestProof = sortedMaterials.find(
    (material) => material.proofNote && (material.status === "received" || material.status === "installed"),
  );
  const page = pageCopy[tab];
  const headerAction =
    tab === "suppliers" ? { label: "Agregar proveedor", onPress: onAddSupplier } : { label: "Agregar material", onPress: onAddMaterial };

  const renderOverview = () => (
    <>
      <Card className="min-h-[104px] flex-row items-center border-0 py-4" style={{ backgroundColor: color.primary }}>
        <CardContent className="flex-1 flex-row items-center">
          <View className="flex-[1.6] flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-md bg-white/15">
              <MaterialCommunityIcons color={color.surface} name="hammer-wrench" size={22} />
            </View>
            <View className="ml-3">
              <Text className="text-[11px] font-bold" style={{ color: color.secondary }}>
                Trabajo activo
              </Text>
              <Text className="mt-0.5 text-[17px] font-extrabold" style={{ color: color.primaryForeground }}>
                {activeProject.name}
              </Text>
            </View>
          </View>
          <View className="ml-6 min-w-[104px]">
            <Text className="text-xl font-extrabold tabular-nums" style={{ color: color.primaryForeground }}>
              {ready}/{materials.length}
            </Text>
            <Text className="mt-0.5 text-[11px]" style={{ color: color.secondary }}>
              materiales listos
            </Text>
          </View>
          <View className="ml-6 min-w-[104px]">
            <Text className="text-xl font-extrabold" style={{ color: color.primaryForeground }}>
              {attention || "Al día"}
            </Text>
            <Text className="mt-0.5 text-[11px]" style={{ color: color.secondary }}>
              {attention ? "requieren seguimiento" : "entregas en espera"}
            </Text>
          </View>
        </CardContent>
      </Card>
      <View className="mb-3 mt-8 flex-row items-end justify-between">
        <View>
          <Text className="text-lg font-extrabold tracking-tight text-foreground">Siguiente movimiento</Text>
          <Text className="mt-1 text-[13px] text-muted-foreground">La acción que evita que el trabajo se detenga.</Text>
        </View>
      </View>
      {outstanding && nextDelivery ? (
        <Card className="min-h-[78px] flex-row items-center bg-background">
          <CardContent className="flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-md" style={{ backgroundColor: nextDelivery.wash }}>
              <MaterialCommunityIcons color={nextDelivery.color} name={nextDelivery.icon} size={21} />
            </View>
            <View className="ml-3 min-w-0 flex-1">
              <Text className="text-[11px] font-bold" style={{ color: nextDelivery.color }}>
                {nextDelivery.label}
              </Text>
              <Text className="mt-0.5 text-[15px] font-extrabold text-foreground">{outstanding.name}</Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                {supplierFor(data.suppliers, outstanding.supplierId)?.name ?? "Proveedor por confirmar"}
              </Text>
            </View>
            <Button icon="pencil-outline" onPress={() => onChangeMaterialStatus(outstanding)} size="sm">
              Cambiar estado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="min-h-[66px] flex-row items-center gap-2 border-0 bg-forest-wash">
          <CardContent className="flex-row items-center gap-2">
            <MaterialCommunityIcons color={color.success} name="check-decagram-outline" size={20} />
            <Text className="text-sm font-extrabold text-forest">Todo el material está recibido o usado.</Text>
          </CardContent>
        </Card>
      )}
      <View className="mb-3 mt-8 flex-row items-end justify-between">
        <View>
          <Text className="text-lg font-extrabold tracking-tight text-foreground">Materiales recientes</Text>
          <Text className="mt-1 text-[13px] text-muted-foreground">Actualiza el estado directamente desde la tabla.</Text>
        </View>
        <Button icon="arrow-right" onPress={() => onSelectTab("materials")} size="sm" variant="ghost">
          Ver todos
        </Button>
      </View>
      <MaterialTable
        materials={sortedMaterials.slice(0, 5)}
        onChangeMaterialStatus={onChangeMaterialStatus}
        onEditMaterial={onEditMaterial}
        suppliers={data.suppliers}
      />
    </>
  );

  const renderClient = () => (
    <>
      <Card className="min-h-[86px] flex-row items-center border-0 bg-sun-wash">
        <CardContent className="flex-row items-center">
          <View className="h-[42px] w-[42px] items-center justify-center rounded-md bg-card">
            <MaterialCommunityIcons color={color.forest} name="account-heart-outline" size={22} />
          </View>
          <View className="mx-3 min-w-0 flex-1">
            <Text className="text-[15px] font-extrabold text-primary-dark">
              Así verá el avance {activeProject.clientName.split(" ")[0]}
            </Text>
            <Text className="mt-0.5 text-xs leading-[17px] text-primary-dark">
              Esta es una vista previa del mensaje: solo entregas y avance, nunca costos ni pagos.
            </Text>
          </View>
          <Button icon="whatsapp" onPress={onSendClientUpdate} size="sm">
            Enviar actualización
          </Button>
        </CardContent>
      </Card>
      {latestProof ? (
        <Card className="mt-4 flex-row items-start gap-2 border-0 bg-forest-wash">
          <CardContent className="flex-row items-start gap-2">
            <MaterialCommunityIcons color={color.success} name="shield-check-outline" size={20} />
            <View>
              <Text className="text-[11px] font-extrabold text-forest">Última recepción confirmada</Text>
              <Text className="mt-0.5 text-xs leading-[17px] text-primary-dark">
                {latestProof.name} · {latestProof.proofNote}
              </Text>
            </View>
          </CardContent>
        </Card>
      ) : null}
      <View className="mb-3 mt-8">
        <Text className="text-lg font-extrabold tracking-tight text-foreground">Materiales del trabajo</Text>
        <Text className="mt-1 text-[13px] text-muted-foreground">La misma información que verá el cliente, sin datos internos.</Text>
      </View>
      <MaterialTable clientView materials={sortedMaterials} suppliers={data.suppliers} />
    </>
  );

  return (
    <View className="mx-auto w-full max-w-[1440px] flex-1 flex-row self-center bg-card">
      <View className="w-[264px] justify-between border-r border-border bg-background p-6">
        <View>
          <View className="flex-row items-center gap-2">
            <View
              className="h-9 w-9 items-center justify-center rounded-md"
              style={{ backgroundColor: color.primary }}
            >
              <MaterialCommunityIcons color={color.surface} name="hammer-wrench" size={21} />
            </View>
            <Text className="text-[17px] font-extrabold tracking-tight text-foreground">En Obra</Text>
          </View>
          <Pressable
            accessibilityLabel={`Cambiar trabajo. Activo: ${activeProject.name}`}
            accessibilityRole="button"
            className="mt-8 rounded-xl border border-border bg-card p-3"
            onPress={onSwitchProject}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold text-muted-foreground">Trabajo activo</Text>
              <MaterialCommunityIcons color={color.inkMuted} name="chevron-down" size={17} />
            </View>
            <Text className="mt-0.5 text-[15px] font-extrabold leading-5 text-foreground" numberOfLines={2}>
              {activeProject.name}
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground" numberOfLines={1}>
              {activeProject.address || activeProject.clientName}
            </Text>
          </Pressable>
          <Button className="mt-2 self-start px-1" icon="plus" onPress={onAddProject} size="sm" variant="ghost">
            Nuevo trabajo
          </Button>
          <View className="mt-6 gap-1">
            {trackerTabs.map((item) => {
              const selected = tab === item.id;
              return (
                <Pressable
                  accessibilityLabel={item.label}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  className={`min-h-[44px] flex-row items-center gap-3 rounded-md px-3 ${selected ? "bg-forest-wash" : ""}`}
                  key={item.id}
                  onPress={() => onSelectTab(item.id)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons color={selected ? color.forest : color.inkMuted} name={item.icon} size={20} />
                  <Text className={`text-sm font-bold ${selected ? "text-primary" : "text-muted-foreground"}`}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Pressable
          accessibilityHint="Abre la vista previa para el cliente"
          accessibilityLabel={`Vista previa para ${activeProject.clientName}`}
          accessibilityRole="button"
          className="flex-row items-center border-t border-border pt-4"
          onPress={() => onSelectTab("client")}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-sun-wash">
            <Text className="text-[13px] font-extrabold text-primary-dark">{activeProject.clientName.charAt(0)}</Text>
          </View>
          <View className="ml-2 min-w-0 flex-1">
            <Text className="text-[10px] font-bold text-muted-foreground">Cliente</Text>
            <Text className="mt-0.5 text-xs font-extrabold text-foreground">{activeProject.clientName}</Text>
          </View>
          <MaterialCommunityIcons color={color.success} name="eye-check-outline" size={19} />
        </Pressable>
      </View>
      <View className="flex-1 bg-card">
        <ScrollView contentContainerClassName="mx-auto w-full max-w-[1120px] px-8 pb-14 pt-8" showsVerticalScrollIndicator={false}>
          <View className="mb-9 flex-row items-start justify-between">
            <View>
              <Text className="text-[13px] font-bold text-muted-foreground">{projectDescriptor(activeProject)}</Text>
              <Text className="mt-1 text-[30px] font-extrabold leading-[37px] tracking-tight text-foreground">{page.title}</Text>
              <Text className="mt-1 text-sm leading-5 text-muted-foreground">{page.subtitle}</Text>
            </View>
            {tab !== "client" ? (
              <Button className="ml-4" icon="plus" onPress={headerAction.onPress} size="sm">
                {headerAction.label}
              </Button>
            ) : null}
          </View>
          {tab === "home" ? renderOverview() : null}
          {tab === "materials" ? (
            <MaterialTable
              materials={sortedMaterials}
              onChangeMaterialStatus={onChangeMaterialStatus}
              onEditMaterial={onEditMaterial}
              suppliers={data.suppliers}
            />
          ) : null}
          {tab === "suppliers" ? (
            <SupplierTable materials={materials} onEditSupplier={onEditSupplier} onOpenSupplier={onOpenSupplier} suppliers={data.suppliers} />
          ) : null}
          {tab === "client" ? renderClient() : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableDivider: { borderTopColor: color.line, borderTopWidth: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.68 },
});
