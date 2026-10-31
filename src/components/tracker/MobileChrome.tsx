import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "../reusables";
import type { SaveState } from "../../persistence/enObraRepository";
import { trackerTabs } from "../../tracker/presentation";
import { trackerColors as color } from "../../tracker/theme";
import type { Project, TrackerTab } from "../../tracker/types";

type SaveStatus = { icon: "cloud-sync-outline" | "cloud-check-outline" | "cloud-alert-outline"; text: string; fg: string; bg: string };

/**
 * What to show for the current save state, or null when there's nothing to say.
 * "Guardado" fades after 2 s; "Guardando…" and errors stay until the state changes.
 */
function useSaveStatus(saveState: SaveState): SaveStatus | null {
  const [savedVisible, setSavedVisible] = useState(false);
  useEffect(() => {
    if (saveState !== "saved") {
      setSavedVisible(false);
      return;
    }
    setSavedVisible(true);
    const timer = setTimeout(() => setSavedVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [saveState]);

  if (saveState === "saving") {
    return { icon: "cloud-sync-outline", text: "Guardando…", fg: color.inkMuted, bg: color.surfaceMuted };
  }
  if (savedVisible) {
    return { icon: "cloud-check-outline", text: "Guardado", fg: color.forest, bg: color.forestWash };
  }
  if (saveState === "failed") {
    return { icon: "cloud-alert-outline", text: "Error al guardar", fg: color.destructive, bg: color.clayWash };
  }
  return null;
}

/** Save state as a small pill, for the desktop sidebar. On phones the header shows it. */
export function SaveBadge({ saveState }: { saveState: SaveState }) {
  const status = useSaveStatus(saveState);
  if (!status) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      className="flex-row items-center gap-1 rounded-full px-2 py-1"
      style={{ backgroundColor: status.bg }}
    >
      <MaterialCommunityIcons color={status.fg} name={status.icon} size={13} />
      <Text className="text-[10px] font-bold" style={{ color: status.fg }}>
        {status.text}
      </Text>
    </View>
  );
}

/** Demo banner and one-off info notices, stacked under the status bar. */
export function StatusStrip({
  isDemo,
  infoNotice,
  onLeaveDemo,
  onDismissInfo,
}: {
  isDemo: boolean;
  infoNotice: string | null;
  onLeaveDemo: () => void;
  onDismissInfo: () => void;
}) {
  return (
    <>
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
            onPress={onLeaveDemo}
            style={({ pressed }) => [pressed && { opacity: 0.68 }]}
          >
            <Text className="text-xs font-bold text-primary">Salir</Text>
          </Pressable>
        </View>
      ) : null}

      {infoNotice ? (
        <View className="mx-4 mb-1 flex-row items-center gap-2 rounded-xl bg-muted px-3 py-2">
          <MaterialCommunityIcons color={color.inkMuted} name="information-outline" size={15} />
          <Text className="flex-1 text-xs text-muted-foreground">{infoNotice}</Text>
          <Pressable accessibilityLabel="Cerrar aviso" accessibilityRole="button" hitSlop={10} onPress={onDismissInfo}>
            <MaterialCommunityIcons color={color.inkMuted} name="close" size={15} />
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

export function AppHeader({
  activeProject,
  addLabel,
  saveState,
  onSwitchProject,
  onAdd,
}: {
  activeProject?: Project;
  addLabel: string;
  saveState: SaveState;
  onSwitchProject: () => void;
  onAdd: () => void;
}) {
  // The subtitle line briefly shows the save state instead of the job name,
  // so saving never shifts the screen.
  const status = useSaveStatus(saveState);
  return (
    <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
      <Pressable
        accessibilityLabel={`En Obra. Trabajo activo: ${activeProject?.name ?? "ninguno"}`}
        accessibilityRole="button"
        className="min-h-[48px] flex-1 flex-row items-center"
        onPress={onSwitchProject}
        style={({ pressed }) => [pressed && { opacity: 0.68 }]}
      >
        <View className="h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: color.primary }}>
          <MaterialCommunityIcons color={color.surface} name="hammer-wrench" size={20} />
        </View>
        <View className="ml-2 min-w-0 flex-1">
          <Text className="text-lg font-extrabold tracking-tight text-foreground">En Obra</Text>
          {status ? (
            <View accessibilityLiveRegion="polite" className="mt-0.5 flex-row items-center gap-1">
              <MaterialCommunityIcons color={status.fg} name={status.icon} size={12} />
              <Text className="text-[11px] font-bold" numberOfLines={1} style={{ color: status.fg }}>
                {status.text}
              </Text>
            </View>
          ) : activeProject ? (
            <Text className="mt-0.5 text-[11px] font-bold text-muted-foreground" numberOfLines={1}>
              {activeProject.name}
            </Text>
          ) : null}
        </View>
        <MaterialCommunityIcons color={color.inkMuted} name="chevron-down" size={19} />
      </Pressable>
      <Button accessibilityLabel={addLabel} className="h-11 w-11" icon="plus" onPress={onAdd} size="icon" />
    </View>
  );
}

export function Snackbar({
  icon,
  message,
  bottom,
  left = 16,
  right = 16,
  actionLabel,
  onAction,
  onDismiss,
  assertive = false,
}: {
  icon: "check" | "trash-can-outline";
  message: string;
  bottom: number;
  left?: number;
  right?: number;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  assertive?: boolean;
}) {
  return (
    <View
      accessibilityLiveRegion={assertive ? "assertive" : "polite"}
      className="absolute z-[2] flex-row items-center gap-2 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: color.forestDark, bottom, left, right }}
    >
      <MaterialCommunityIcons color={color.surface} name={icon} size={16} />
      <Text className="flex-1 text-xs font-bold" style={{ color: color.primaryForeground }}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          className="rounded-md bg-white/20 px-2 py-1"
          hitSlop={8}
          onPress={onAction}
        >
          <Text className="text-xs font-extrabold" style={{ color: color.primaryForeground }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
      {onDismiss ? (
        <Pressable accessibilityLabel="Cerrar mensaje" accessibilityRole="button" hitSlop={10} onPress={onDismiss}>
          <MaterialCommunityIcons color={color.surface} name="close" size={17} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function BottomTabBar({
  tab,
  bottomInset,
  onSelect,
}: {
  tab: TrackerTab;
  bottomInset: number;
  onSelect: (tab: TrackerTab) => void;
}) {
  return (
    <View
      className="flex-row border-t border-border bg-card px-1 pt-1"
      style={{ paddingBottom: Math.max(bottomInset, 4) }}
    >
      {trackerTabs.map((item) => {
        const selected = tab === item.id;
        return (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className="min-h-[52px] flex-1 items-center"
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => [pressed && { opacity: 0.68 }]}
          >
            <View
              className={`h-7 w-[38px] items-center justify-center rounded-md ${selected ? "bg-forest-wash" : ""}`}
            >
              <MaterialCommunityIcons color={selected ? color.forest : color.inkMuted} name={item.icon} size={21} />
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
  );
}
