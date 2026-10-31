import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card } from "../../reusables";
import { deliveryMeta, statusMeta, supplierFor } from "../../../tracker/presentation";
import { trackerColors as color } from "../../../tracker/theme";
import type { Material, Supplier } from "../../../tracker/types";

function StatusChip({ material, onChangeStatus }: { material: Material; onChangeStatus?: () => void }) {
  const meta = statusMeta[material.status];
  if (onChangeStatus) {
    return (
      <Pressable
        accessibilityHint="Abre las opciones de estado y no cambia nada hasta guardar"
        accessibilityLabel={`Cambiar estado de ${material.name}. Estado actual: ${meta.label}`}
        accessibilityRole="button"
        className="min-h-[40px] flex-row items-center gap-0.5 rounded-full pl-2.5 pr-1.5"
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

function EmptyTable({ icon, title, hint }: { icon: "package-variant-plus" | "store-outline"; title: string; hint: string }) {
  return (
    <Card className="flex-row items-center gap-3 bg-background">
      <MaterialCommunityIcons color={color.forest} name={icon} size={24} />
      <View>
        <Text className="text-sm font-extrabold text-foreground">{title}</Text>
        <Text className="mt-0.5 text-xs text-muted-foreground">{hint}</Text>
      </View>
    </Card>
  );
}

function HeaderCell({ children, flex, right = false }: { children: string; flex: number; right?: boolean }) {
  return (
    <Text
      className={`text-[11px] font-extrabold text-muted-foreground ${right ? "text-right" : ""}`}
      style={{ flex }}
    >
      {children}
    </Text>
  );
}

export function MaterialTable({
  materials,
  suppliers,
  onChangeMaterialStatus,
  onEditMaterial,
}: {
  materials: Material[];
  suppliers: Supplier[];
  onChangeMaterialStatus?: (material: Material) => void;
  onEditMaterial?: (material: Material) => void;
}) {
  if (!materials.length) {
    return (
      <EmptyTable
        hint="Agrega el primero cuando tengas el próximo pedido."
        icon="package-variant-plus"
        title="Aún no hay materiales"
      />
    );
  }

  return (
    <Card className="overflow-hidden py-0">
      <View className="min-h-[42px] flex-row items-center bg-background px-4">
        <HeaderCell flex={1.55}>Material</HeaderCell>
        <HeaderCell flex={1.15}>Proveedor</HeaderCell>
        <HeaderCell flex={0.95}>Entrega</HeaderCell>
        <HeaderCell flex={0.85} right>
          Estado
        </HeaderCell>
      </View>
      {materials.map((material, index) => {
        const supplier = supplierFor(suppliers, material.supplierId);
        const meta = statusMeta[material.status];
        const delivery = deliveryMeta(material);
        const nameCell = (
          <>
            <View className="h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: meta.wash }}>
              <MaterialCommunityIcons color={meta.color} name={meta.icon} size={18} />
            </View>
            <View className="ml-2 min-w-0 flex-1">
              <Text className="text-[13px] font-extrabold text-foreground" numberOfLines={1}>
                {material.name}
              </Text>
              {material.quantity ? (
                <Text className="mt-0.5 text-[11px] text-muted-foreground" numberOfLines={1}>
                  {material.quantity}
                </Text>
              ) : null}
            </View>
          </>
        );
        return (
          <View
            className="min-h-[68px] flex-row items-center px-4"
            key={material.id}
            style={index > 0 ? styles.tableDivider : undefined}
          >
            {onEditMaterial ? (
              <Pressable
                accessibilityHint="Abre el editor de material"
                accessibilityLabel={`Editar ${material.name}`}
                accessibilityRole="button"
                className="flex-[1.55] flex-row items-center pr-3"
                onPress={() => onEditMaterial(material)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                {nameCell}
              </Pressable>
            ) : (
              <View className="flex-[1.55] flex-row items-center pr-3">{nameCell}</View>
            )}
            <Text className="flex-[1.15] pr-3 text-xs leading-[17px] text-muted-foreground" numberOfLines={1}>
              {supplier?.name ?? "Proveedor por definir"}
            </Text>
            <View className="flex-[0.95] pr-3">
              <Text className="text-xs leading-[17px]" numberOfLines={1} style={{ color: delivery.color }}>
                {delivery.label}
              </Text>
              {material.proofNote && (material.status === "received" || material.status === "installed") ? (
                <Text className="mt-0.5 text-[10px] font-bold text-forest" numberOfLines={1}>
                  Marcado como recibido por el prestador
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

export function SupplierTable({
  suppliers,
  materials,
  onEditSupplier,
  onOpenSupplierWhatsApp,
}: {
  suppliers: Supplier[];
  materials: Material[];
  onEditSupplier: (supplier: Supplier) => void;
  onOpenSupplierWhatsApp: (supplier: Supplier) => void;
}) {
  if (!suppliers.length) {
    return <EmptyTable hint="Agrega el primero con el botón de arriba." icon="store-outline" title="Sin proveedores aún" />;
  }

  return (
    <Card className="overflow-hidden py-0">
      <View className="min-h-[42px] flex-row items-center bg-background px-4">
        <HeaderCell flex={1.25}>Proveedor</HeaderCell>
        <HeaderCell flex={2.1}>Nota / acuerdo guardado</HeaderCell>
        <HeaderCell flex={0.75}>Materiales</HeaderCell>
        <HeaderCell flex={0.9} right>
          Acción
        </HeaderCell>
      </View>
      {suppliers.map((supplier, index) => {
        const supplied = materials.filter((material) => material.supplierId === supplier.id);
        return (
          <View
            className="min-h-[68px] flex-row items-center px-4"
            key={supplier.id}
            style={index > 0 ? styles.tableDivider : undefined}
          >
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
              {supplier.lastContactNote ?? "Sin nota guardada"}
            </Text>
            <Text className="flex-[0.75] pr-3 text-xs text-muted-foreground">{supplied.length}</Text>
            <View className="flex-[0.9] flex-row items-center justify-end gap-1">
              <Button icon="pencil-outline" onPress={() => onEditSupplier(supplier)} size="sm" variant="ghost">
                Editar
              </Button>
              <Button icon="whatsapp" onPress={() => onOpenSupplierWhatsApp(supplier)} size="sm" variant="secondary">
                Escribir
              </Button>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  tableDivider: { borderTopColor: color.line, borderTopWidth: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.68 },
});
