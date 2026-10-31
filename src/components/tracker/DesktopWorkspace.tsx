import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button } from "../reusables";
import { DesktopOverview } from "./desktop/DesktopOverview";
import { DesktopSidebar } from "./desktop/DesktopSidebar";
import { MaterialTable, SupplierTable } from "./desktop/DesktopTables";
import type { SaveState } from "../../persistence/enObraRepository";
import { projectDescriptor } from "../../tracker/presentation";
import type { Material, Project, Supplier, TrackerDataV2, TrackerTab } from "../../tracker/types";

const pageCopy: Record<TrackerTab, { title: string; subtitle: string }> = {
  home: { title: "Control del trabajo", subtitle: "Lo pendiente de este trabajo, de un vistazo." },
  jobs: { title: "Materiales del trabajo", subtitle: "Pedidos y entregas claros, sin mezclar pagos." },
  suppliers: { title: "Proveedores", subtitle: "El último acuerdo y la siguiente conversación, sin buscar en chats." },
};

type DesktopWorkspaceProps = {
  activeProject: Project;
  data: TrackerDataV2;
  /** Materials of the active project. */
  materials: Material[];
  /** Same materials, most recently updated first. */
  sortedMaterials: Material[];
  tab: TrackerTab;
  saveState: SaveState;
  /** Demo and info notices shown above the page title. */
  banner?: ReactNode;
  onAddMaterial: () => void;
  onAddProject: () => void;
  onAddSupplier: () => void;
  onChangeMaterialStatus: (material: Material) => void;
  onEditMaterial: (material: Material) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onOpenClientView: () => void;
  onOpenSupplierWhatsApp: (supplier: Supplier) => void;
  onSelectTab: (tab: TrackerTab) => void;
  onSwitchProject: () => void;
};

/** Wide-screen layout: sidebar navigation plus tables instead of stacked cards. */
export function DesktopWorkspace({
  activeProject,
  data,
  materials,
  sortedMaterials,
  tab,
  saveState,
  banner,
  onAddMaterial,
  onAddProject,
  onAddSupplier,
  onChangeMaterialStatus,
  onEditMaterial,
  onEditSupplier,
  onOpenClientView,
  onOpenSupplierWhatsApp,
  onSelectTab,
  onSwitchProject,
}: DesktopWorkspaceProps) {
  const page = pageCopy[tab];
  const headerAction =
    tab === "suppliers"
      ? { label: "Agregar proveedor", onPress: onAddSupplier }
      : { label: "Agregar material", onPress: onAddMaterial };

  return (
    <View className="mx-auto w-full max-w-[1440px] flex-1 flex-row self-center bg-card">
      <DesktopSidebar
        activeProject={activeProject}
        onAddProject={onAddProject}
        onOpenClientView={onOpenClientView}
        onSelectTab={onSelectTab}
        onSwitchProject={onSwitchProject}
        saveState={saveState}
        tab={tab}
      />
      <View className="flex-1 bg-card">
        <ScrollView
          contentContainerClassName="mx-auto w-full max-w-[1120px] px-8 pb-14 pt-8"
          showsVerticalScrollIndicator={false}
        >
          {banner ? <View className="-mx-4 mb-4">{banner}</View> : null}
          <View className="mb-9 flex-row items-start justify-between">
            <View>
              <Text className="text-[13px] font-bold text-muted-foreground">{projectDescriptor(activeProject)}</Text>
              <Text className="mt-1 text-[30px] font-extrabold leading-[37px] tracking-tight text-foreground">
                {page.title}
              </Text>
              <Text className="mt-1 text-sm leading-5 text-muted-foreground">{page.subtitle}</Text>
            </View>
            {tab !== "home" ? (
              <Button className="ml-4" icon="plus" onPress={headerAction.onPress} size="sm">
                {headerAction.label}
              </Button>
            ) : null}
          </View>
          {tab === "home" ? (
            <DesktopOverview
              activeProject={activeProject}
              materials={materials}
              onChangeMaterialStatus={onChangeMaterialStatus}
              onEditMaterial={onEditMaterial}
              onOpenClientView={onOpenClientView}
              onShowAll={() => onSelectTab("jobs")}
              recentMaterials={sortedMaterials.slice(0, 5)}
              suppliers={data.suppliers}
            />
          ) : null}
          {tab === "jobs" ? (
            <MaterialTable
              materials={sortedMaterials}
              onChangeMaterialStatus={onChangeMaterialStatus}
              onEditMaterial={onEditMaterial}
              suppliers={data.suppliers}
            />
          ) : null}
          {tab === "suppliers" ? (
            <SupplierTable
              materials={data.materials}
              onEditSupplier={onEditSupplier}
              onOpenSupplierWhatsApp={onOpenSupplierWhatsApp}
              suppliers={data.suppliers}
            />
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}
