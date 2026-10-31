import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { Button } from "../../reusables";
import { SaveBadge } from "../MobileChrome";
import type { SaveState } from "../../../persistence/enObraRepository";
import { trackerTabs } from "../../../tracker/presentation";
import { trackerColors as color } from "../../../tracker/theme";
import type { Project, TrackerTab } from "../../../tracker/types";

export const DESKTOP_SIDEBAR_WIDTH = 264;

const pressed = { opacity: 0.68 };

export function DesktopSidebar({
  activeProject,
  tab,
  saveState,
  onSelectTab,
  onSwitchProject,
  onAddProject,
  onOpenClientView,
}: {
  activeProject: Project;
  tab: TrackerTab;
  saveState: SaveState;
  onSelectTab: (tab: TrackerTab) => void;
  onSwitchProject: () => void;
  onAddProject: () => void;
  onOpenClientView: () => void;
}) {
  return (
    <View
      className="justify-between border-r border-border bg-background p-6"
      style={{ width: DESKTOP_SIDEBAR_WIDTH }}
    >
      <View>
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: color.primary }}>
            <MaterialCommunityIcons color={color.surface} name="hammer-wrench" size={21} />
          </View>
          <Text className="flex-1 text-[17px] font-extrabold tracking-tight text-foreground">En Obra</Text>
          <SaveBadge saveState={saveState} />
        </View>
        <Pressable
          accessibilityLabel={`Cambiar trabajo. Activo: ${activeProject.name}`}
          accessibilityRole="button"
          className="mt-8 rounded-xl border border-border bg-card p-3"
          onPress={onSwitchProject}
          style={({ pressed: isPressed }) => [isPressed && pressed]}
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
                style={({ pressed: isPressed }) => [isPressed && pressed]}
              >
                <MaterialCommunityIcons color={selected ? color.forest : color.inkMuted} name={item.icon} size={20} />
                <Text className={`text-sm font-bold ${selected ? "text-primary" : "text-muted-foreground"}`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Pressable
        accessibilityHint="Muestra la actualización para el cliente"
        accessibilityLabel={`Vista cliente para ${activeProject.clientName}`}
        accessibilityRole="button"
        className="flex-row items-center border-t border-border pt-4"
        onPress={onOpenClientView}
        style={({ pressed: isPressed }) => [isPressed && pressed]}
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
  );
}
