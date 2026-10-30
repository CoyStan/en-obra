import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { Button, Progress } from "../reusables";
import { deliveryMeta, readyMaterialCount, statusMeta } from "../../tracker/presentation";
import { trackerColors as color } from "../../tracker/theme";
import type { Material, MaterialStatus } from "../../tracker/types";

export function MaterialsProgress({
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

export function StatusBadge({ status }: { status: MaterialStatus }) {
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

type MaterialRowProps = {
  material: Material;
  /** Job name, shown on cross-job lists such as Hoy. */
  jobTag?: string;
  /** Draws a clay accent on the left edge for late or due-today items. */
  accent?: boolean;
  onChangeStatus?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** WhatsApp the supplier. Pass `null` to keep the slot empty so rows stay aligned. */
  onMessageSupplier?: (() => void) | null;
  supplierName?: string;
  clientView?: boolean;
};

export function MaterialRow({
  material,
  jobTag,
  accent = false,
  onChangeStatus,
  onEdit,
  onDelete,
  onMessageSupplier,
  supplierName,
  clientView = false,
}: MaterialRowProps) {
  const meta = statusMeta[material.status];
  const delivery = deliveryMeta(material);
  const secondary = [material.quantity, jobTag].filter(Boolean).join(" · ");

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
        <Text className="mt-0.5 text-xs font-semibold" numberOfLines={1} style={{ color: delivery.color }}>
          {delivery.label}
        </Text>
        {secondary ? (
          <Text className="mt-0.5 text-[11px] text-muted-foreground" numberOfLines={1}>
            {secondary}
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
    <View className="min-h-[76px] flex-row items-center py-3 pl-4 pr-3">
      {accent ? (
        <View
          className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full"
          style={{ backgroundColor: color.clay }}
        />
      ) : null}
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
            className="min-h-[34px] flex-row items-center gap-0.5 rounded-full pl-2.5 pr-1.5"
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
        {onMessageSupplier ? (
          <Pressable
            accessibilityLabel={`Escribir a ${supplierName ?? "el proveedor"} por WhatsApp`}
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center rounded-full"
            hitSlop={6}
            onPress={onMessageSupplier}
            style={({ pressed }) => [pressed && { opacity: 0.68 }]}
          >
            <MaterialCommunityIcons color={color.forest} name="whatsapp" size={20} />
          </Pressable>
        ) : onMessageSupplier === null ? (
          <View className="h-9 w-9" />
        ) : null}
      </View>
    </View>
  );
}

export function EmptyMaterials({ onAdd }: { onAdd: () => void }) {
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
