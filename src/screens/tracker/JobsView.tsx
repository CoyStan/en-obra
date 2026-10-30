import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Button, Card, CardContent, Separator } from "../../components/reusables";
import { EmptyMaterials, MaterialRow, MaterialsProgress } from "../../components/tracker/MaterialRow";
import { formatDisplayDate } from "../../domain/en-obra/dates";
import { clientReadyCount, latestReceiptDate } from "../../domain/en-obra/status";
import {
  attentionMaterialCount,
  deliveryMeta,
  nextMaterialForAction,
  projectDescriptor,
  supplierFor,
} from "../../tracker/presentation";
import { trackerColors as color } from "../../tracker/theme";
import type { Material, Project, ProjectLifecycle, Supplier } from "../../tracker/types";

const lifecycleLabel: Record<ProjectLifecycle, string> = {
  active: "Trabajo activo",
  completed: "Completado",
  archived: "Archivado",
};

export function JobDetail({
  job,
  materials,
  suppliers,
  onBack,
  onOpenClientView,
  onAddMaterial,
  onChangeStatus,
  onEditMaterial,
  onDeleteMaterial,
  onSetLifecycle,
}: {
  job: Project;
  /** Materials of this job, most recently updated first. */
  materials: Material[];
  suppliers: Supplier[];
  onBack: () => void;
  onOpenClientView: () => void;
  onAddMaterial: () => void;
  onChangeStatus: (material: Material) => void;
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (material: Material) => void;
  onSetLifecycle: (lifecycle: ProjectLifecycle) => void;
}) {
  const editable = job.lifecycle === "active";
  const outstanding = nextMaterialForAction(materials);
  const nextDelivery = outstanding ? deliveryMeta(outstanding) : undefined;
  const attentionCount = attentionMaterialCount(materials);
  const lastReceipt = latestReceiptDate(materials);

  return (
    <>
      <View className="flex-row items-center gap-2 pb-3 pt-4">
        <Pressable
          accessibilityLabel="Volver a Mis trabajos"
          accessibilityRole="button"
          className="min-h-[44px] flex-row items-center gap-1"
          onPress={onBack}
          style={({ pressed }) => [pressed && { opacity: 0.68 }]}
        >
          <MaterialCommunityIcons color={color.forest} name="chevron-left" size={22} />
          <Text className="text-sm font-bold text-primary">Mis trabajos</Text>
        </Pressable>
      </View>

      <View className="mb-5">
        <View className="mb-1 flex-row items-center gap-1.5">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: editable ? color.success : color.inkMuted }}
          />
          <Text className="text-xs font-bold text-muted-foreground">{lifecycleLabel[job.lifecycle]}</Text>
        </View>
        <Text className="text-[27px] font-extrabold tracking-tight text-foreground">{job.name}</Text>
        <Text className="mt-1 text-sm text-muted-foreground">{projectDescriptor(job)}</Text>
        {lastReceipt ? (
          <Text className="mt-1 text-xs text-muted-foreground">
            Última recepción: {formatDisplayDate(lastReceipt)}
          </Text>
        ) : null}
      </View>

      <Card className="mb-4 border-0 py-4" style={{ backgroundColor: color.primary }}>
        <CardContent>
          <View className="flex-row items-center">
            <View
              className="h-[38px] w-[38px] items-center justify-center rounded-full"
              style={{ backgroundColor: color.sunWash }}
            >
              <Text className="text-[15px] font-extrabold" style={{ color: color.forestDark }}>
                {job.clientName.charAt(0)}
              </Text>
            </View>
            <View className="ml-3 min-w-0 flex-1">
              <Text className="text-[11px] font-bold" style={{ color: color.secondary }}>
                Cliente
              </Text>
              <Text className="mt-0.5 text-[15px] font-bold" style={{ color: color.primaryForeground }}>
                {job.clientName}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Vista cliente y WhatsApp"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onOpenClientView}
              style={({ pressed }) => [pressed && { opacity: 0.68 }]}
            >
              <Badge
                className="border-0 bg-white/15"
                labelClassName="text-[11px] font-bold text-primary-foreground"
                variant="ghost"
              >
                Vista cliente
              </Badge>
            </Pressable>
          </View>
          <MaterialsProgress inverse materials={materials} />
        </CardContent>
      </Card>

      {outstanding && nextDelivery ? (
        <>
          <Text className="mb-2 text-[15px] font-extrabold tracking-tight text-foreground">
            Lo siguiente
          </Text>
          <View className="mb-6 flex-row items-center rounded-xl bg-card p-3" style={styles.nextAction}>
            <View
              className="h-[46px] w-[46px] items-center justify-center rounded-md"
              style={{ backgroundColor: nextDelivery.wash }}
            >
              <MaterialCommunityIcons color={nextDelivery.color} name={nextDelivery.icon} size={22} />
            </View>
            <View className="mx-3 min-w-0 flex-1">
              <Text className="text-xs font-bold" style={{ color: nextDelivery.color }}>
                {nextDelivery.label}
              </Text>
              <Text className="mt-0.5 text-[15px] font-extrabold text-foreground">{outstanding.name}</Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                {supplierFor(suppliers, outstanding.supplierId)?.name ?? "Proveedor por definir"}
              </Text>
            </View>
            {editable ? (
              <Button
                accessibilityLabel={`Cambiar estado de ${outstanding.name}`}
                className="h-[42px] w-[42px]"
                icon="pencil-outline"
                onPress={() => onChangeStatus(outstanding)}
                size="icon"
              />
            ) : null}
          </View>
        </>
      ) : materials.length > 0 ? (
        <View className="mb-6 flex-row items-center gap-2 rounded-xl bg-forest-wash p-4">
          <MaterialCommunityIcons color={color.success} name="check-decagram-outline" size={21} />
          <Text className="flex-1 text-sm font-bold text-forest">Todo el material está recibido o usado.</Text>
        </View>
      ) : null}

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[17px] font-extrabold tracking-tight text-foreground">Materiales</Text>
        <Text className="text-xs text-muted-foreground">
          {attentionCount ? `${attentionCount} requieren seguimiento` : "sin pendientes urgentes"}
        </Text>
      </View>
      <Card className="overflow-hidden py-0">
        {materials.length ? (
          materials.map((material, index) => (
            <View key={material.id}>
              {index > 0 ? <Separator /> : null}
              <MaterialRow
                material={material}
                onChangeStatus={editable ? () => onChangeStatus(material) : undefined}
                onDelete={editable ? () => onDeleteMaterial(material) : undefined}
                onEdit={editable ? () => onEditMaterial(material) : undefined}
              />
            </View>
          ))
        ) : (
          <EmptyMaterials onAdd={onAddMaterial} />
        )}
      </Card>

      {job.lifecycle === "active" ? (
        <View className="mt-6 gap-2">
          <Button icon="check-circle-outline" onPress={() => onSetLifecycle("completed")} variant="outline">
            Marcar como completado
          </Button>
          <Button icon="archive-outline" onPress={() => onSetLifecycle("archived")} variant="ghost">
            Archivar
          </Button>
        </View>
      ) : job.lifecycle === "completed" ? (
        <View className="mt-6">
          <Button icon="restore" onPress={() => onSetLifecycle("active")} variant="outline">
            Reactivar trabajo
          </Button>
        </View>
      ) : null}
    </>
  );
}

function JobCard({
  project,
  materials,
  onOpen,
}: {
  project: Project;
  materials: Material[];
  onOpen: () => void;
}) {
  const active = project.lifecycle === "active";
  const jobMaterials = materials.filter((m) => m.projectId === project.id);
  const ready = clientReadyCount(jobMaterials);
  const progress = jobMaterials.length ? ready / jobMaterials.length : 0;
  const subtitle = active
    ? [project.clientName, project.address].filter(Boolean).join(" · ")
    : `${project.clientName} · ${lifecycleLabel[project.lifecycle]}`;

  return (
    <Pressable
      accessibilityHint="Abre el detalle de este trabajo"
      accessibilityLabel={`${project.name}. ${project.clientName}`}
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [!active && { opacity: 0.72 }, pressed && { opacity: 0.6 }]}
    >
      <Card className="py-3">
        <CardContent>
          <View className="flex-row items-center">
            <View
              className="h-10 w-10 items-center justify-center rounded-md"
              style={{ backgroundColor: active ? color.primary : color.surfaceMuted }}
            >
              <MaterialCommunityIcons
                color={active ? color.surface : color.inkMuted}
                name={active ? "hammer-wrench" : "briefcase-variant-outline"}
                size={20}
              />
            </View>
            <View className="ml-3 min-w-0 flex-1">
              <Text className="text-[15px] font-extrabold text-foreground" numberOfLines={1}>
                {project.name}
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
            <Text className="ml-2 text-xs font-bold tabular-nums text-muted-foreground">
              {ready}/{jobMaterials.length}
            </Text>
            <MaterialCommunityIcons color={color.inkMuted} name="chevron-right" size={20} />
          </View>
          {active && jobMaterials.length ? (
            <View className="ml-[52px] mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full"
                style={{ backgroundColor: color.forest, width: `${Math.round(progress * 100)}%` }}
              />
            </View>
          ) : null}
        </CardContent>
      </Card>
    </Pressable>
  );
}

export function JobsList({
  projects,
  materials,
  onOpenJob,
  onNewProject,
  onOpenSettings,
}: {
  projects: Project[];
  materials: Material[];
  onOpenJob: (projectId: string) => void;
  onNewProject: () => void;
  onOpenSettings: () => void;
}) {
  const activeJobs = projects.filter((p) => p.lifecycle === "active");
  const otherJobs = projects.filter((p) => p.lifecycle !== "active");

  return (
    <>
      <View className="pb-4 pt-6">
        <Text className="text-[27px] font-extrabold tracking-tight text-foreground">Mis trabajos</Text>
        <Text className="mt-1 text-sm leading-5 text-muted-foreground">
          {projects.length === 0
            ? "Empieza con tu primer trabajo."
            : `${activeJobs.length} activo${activeJobs.length !== 1 ? "s" : ""}, ${otherJobs.length} terminado${otherJobs.length !== 1 ? "s" : ""}.`}
        </Text>
      </View>
      {projects.length === 0 ? (
        <View className="items-center py-8">
          <MaterialCommunityIcons color={color.inkMuted} name="briefcase-plus-outline" size={40} />
          <Text className="mt-3 text-base font-extrabold text-foreground">Todavía no hay trabajos</Text>
          <Button className="mt-4" icon="plus" onPress={onNewProject}>
            Crear primer trabajo
          </Button>
        </View>
      ) : (
        <View className="gap-3">
          {activeJobs.map((project) => (
            <JobCard
              key={project.id}
              materials={materials}
              onOpen={() => onOpenJob(project.id)}
              project={project}
            />
          ))}
          {otherJobs.length > 0 ? (
            <>
              <Text className="mt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Completados / archivados
              </Text>
              {otherJobs.map((project) => (
                <JobCard
                  key={project.id}
                  materials={materials}
                  onOpen={() => onOpenJob(project.id)}
                  project={project}
                />
              ))}
            </>
          ) : null}
        </View>
      )}
      <View className="mt-8 border-t border-border pt-6">
        <Button icon="cog-outline" onPress={onOpenSettings} variant="ghost">
          Configuración y datos
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  nextAction: Platform.select({
    web: { boxShadow: `0px 3px 7px ${color.shadow}` },
    default: {},
  }),
});
