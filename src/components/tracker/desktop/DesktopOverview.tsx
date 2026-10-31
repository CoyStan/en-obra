import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Button, Card, CardContent } from "../../reusables";
import { MaterialTable } from "./DesktopTables";
import {
  attentionMaterialCount,
  deliveryMeta,
  nextMaterialForAction,
  readyMaterialCount,
  supplierFor,
} from "../../../tracker/presentation";
import { trackerColors as color } from "../../../tracker/theme";
import type { Material, Project, Supplier } from "../../../tracker/types";

function SectionHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <View className="mb-3 mt-8 flex-row items-end justify-between">
      <View>
        <Text className="text-lg font-extrabold tracking-tight text-foreground">{title}</Text>
        <Text className="mt-1 text-[13px] text-muted-foreground">{subtitle}</Text>
      </View>
      {action}
    </View>
  );
}

/** The "Hoy" tab on wide screens: job summary, next action and recent materials. */
export function DesktopOverview({
  activeProject,
  materials,
  recentMaterials,
  suppliers,
  onOpenClientView,
  onChangeMaterialStatus,
  onEditMaterial,
  onShowAll,
}: {
  activeProject: Project;
  materials: Material[];
  recentMaterials: Material[];
  suppliers: Supplier[];
  onOpenClientView: () => void;
  onChangeMaterialStatus: (material: Material) => void;
  onEditMaterial: (material: Material) => void;
  onShowAll: () => void;
}) {
  const ready = readyMaterialCount(materials);
  const attention = attentionMaterialCount(materials);
  const outstanding = nextMaterialForAction(materials);
  const nextDelivery = outstanding ? deliveryMeta(outstanding) : undefined;

  return (
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
              {attention ? "requieren seguimiento" : "sin pendientes urgentes"}
            </Text>
          </View>
          <Button className="ml-6" icon="whatsapp" onPress={onOpenClientView} size="sm" variant="secondary">
            Actualización cliente
          </Button>
        </CardContent>
      </Card>

      <SectionHeader subtitle="La acción que evita que el trabajo se detenga." title="Siguiente movimiento" />
      {outstanding && nextDelivery ? (
        <Card className="min-h-[78px] flex-row items-center bg-background">
          <CardContent className="flex-1 flex-row items-center">
            <View
              className="h-11 w-11 items-center justify-center rounded-md"
              style={{ backgroundColor: nextDelivery.wash }}
            >
              <MaterialCommunityIcons color={nextDelivery.color} name={nextDelivery.icon} size={21} />
            </View>
            <View className="ml-3 min-w-0 flex-1">
              <Text className="text-[11px] font-bold" style={{ color: nextDelivery.color }}>
                {nextDelivery.label}
              </Text>
              <Text className="mt-0.5 text-[15px] font-extrabold text-foreground">{outstanding.name}</Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                {supplierFor(suppliers, outstanding.supplierId)?.name ?? "Proveedor por definir"}
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

      <SectionHeader
        action={
          <Button icon="arrow-right" onPress={onShowAll} size="sm" variant="ghost">
            Ver todos
          </Button>
        }
        subtitle="Actualiza el estado directamente desde la tabla."
        title="Materiales recientes"
      />
      <MaterialTable
        materials={recentMaterials}
        onChangeMaterialStatus={onChangeMaterialStatus}
        onEditMaterial={onEditMaterial}
        suppliers={suppliers}
      />
    </>
  );
}
