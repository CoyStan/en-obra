import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Button, Card, Separator } from "../../components/reusables";
import { MaterialRow } from "../../components/tracker/MaterialRow";
import { urgency } from "../../domain/en-obra/status";
import { todayIsoDate } from "../../tracker/dates";
import { sortByUrgency, supplierFor } from "../../tracker/presentation";
import { trackerColors as color } from "../../tracker/theme";
import type { Material, Project, Supplier } from "../../tracker/types";

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : word.endsWith("o") || word.endsWith("e") ? "s" : "es"}`;
}

function SummaryTile({ count, label, tone }: { count: number; label: string; tone: "late" | "today" | "todo" }) {
  const palette = {
    late: { bg: color.clayWash, fg: color.clay },
    today: { bg: color.sunWash, fg: color.sun },
    todo: { bg: color.surfaceMuted, fg: color.ink },
  }[tone];
  return (
    <View
      accessibilityLabel={`${count} ${label}`}
      className="flex-1 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: count ? palette.bg : color.surfaceMuted }}
    >
      <Text
        className="text-[22px] font-extrabold tabular-nums"
        style={{ color: count ? palette.fg : color.inkMuted }}
      >
        {count}
      </Text>
      <Text className="text-[11px] font-bold text-muted-foreground">{label}</Text>
    </View>
  );
}

export function TodayView({
  activeProjects,
  projects,
  suppliers,
  materials,
  onNewProject,
  onChangeStatus,
  onEditMaterial,
  onMessageSupplier,
}: {
  activeProjects: Project[];
  projects: Project[];
  suppliers: Supplier[];
  materials: Material[];
  onNewProject: () => void;
  onChangeStatus: (material: Material) => void;
  onEditMaterial: (material: Material) => void;
  onMessageSupplier: (supplier: Supplier, material: Material) => void;
}) {
  const today = todayIsoDate();
  const sorted = sortByUrgency(materials, today);
  const pending = sorted.filter((m) => m.status !== "installed");
  const used = sorted.filter((m) => m.status === "installed");

  if (activeProjects.length === 0) {
    return (
      <View className="items-center px-6 py-10">
        <MaterialCommunityIcons color={color.inkMuted} name="briefcase-outline" size={36} />
        <Text className="mt-3 text-base font-extrabold text-foreground">No hay trabajos activos</Text>
        <Text className="mt-1 text-center text-[13px] leading-[19px] text-muted-foreground">
          Los trabajos completados o archivados no aparecen aquí.
        </Text>
        <Button className="mt-4" icon="plus" onPress={onNewProject}>
          Nuevo trabajo
        </Button>
      </View>
    );
  }

  const lateCount = pending.filter((m) => urgency(m, today) === "late").length;
  const todayCount = pending.filter((m) => urgency(m, today) === "today").length;
  const toOrderCount = pending.filter((m) => m.status === "to_order").length;

  return (
    <>
      <View className="pb-4 pt-6">
        <Text className="text-[27px] font-extrabold tracking-tight text-foreground">Hoy</Text>
        <Text className="mt-1 text-sm leading-5 text-muted-foreground">
          {pending.length
            ? `${plural(pending.length, "material")} pendiente${pending.length === 1 ? "" : "s"} en ${plural(activeProjects.length, "trabajo")} activo${activeProjects.length === 1 ? "" : "s"}.`
            : "Todo el material está recibido o usado. ¡Buen trabajo!"}
        </Text>
      </View>
      {pending.length > 0 ? (
        <View className="mb-4 flex-row gap-2">
          <SummaryTile count={lateCount} label="Atrasados" tone="late" />
          <SummaryTile count={todayCount} label="Llegan hoy" tone="today" />
          <SummaryTile count={toOrderCount} label="Por pedir" tone="todo" />
        </View>
      ) : null}
      {pending.length === 0 && materials.length > 0 ? (
        <View className="flex-row items-center gap-2 rounded-xl bg-forest-wash p-4">
          <MaterialCommunityIcons color={color.success} name="check-decagram-outline" size={21} />
          <Text className="flex-1 text-sm font-bold text-forest">
            Todo el material está recibido o usado.
          </Text>
        </View>
      ) : null}
      {pending.length > 0 ? (
        <Card className="overflow-hidden py-0">
          {pending.map((material, index) => {
            const job = projects.find((p) => p.id === material.projectId);
            const supplier = supplierFor(suppliers, material.supplierId);
            const u = urgency(material, today);
            return (
              <View key={material.id}>
                {index > 0 ? <Separator /> : null}
                <MaterialRow
                  accent={u === "late" || u === "today"}
                  jobTag={job?.name}
                  material={material}
                  onChangeStatus={() => onChangeStatus(material)}
                  onEdit={job?.lifecycle === "active" ? () => onEditMaterial(material) : undefined}
                  onMessageSupplier={supplier ? () => onMessageSupplier(supplier, material) : null}
                  supplierName={supplier?.name}
                />
              </View>
            );
          })}
        </Card>
      ) : null}
      {used.length > 0 && pending.length > 0 ? (
        <Text className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Usados en este ciclo
        </Text>
      ) : null}
      {used.length > 0 ? (
        <Card className="mt-2 overflow-hidden py-0" style={{ opacity: 0.64 }}>
          {used.map((material, index) => {
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
}
