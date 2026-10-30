import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "../reusables";
import type { SaveState } from "../../persistence/enObraRepository";
import { trackerTabs } from "../../tracker/presentation";
import { trackerColors as color } from "../../tracker/theme";
import type { Project, TrackerTab } from "../../tracker/types";

/** Demo banner, save state and one-off info notices, stacked under the status bar. */
export function StatusStrip({
  isDemo,
  saveState,
  infoNotice,
  onLeaveDemo,
  onDismissInfo,
}: {
  isDemo: boolean;
  saveState: SaveState;
  infoNotice: string | null;
  onLeaveDemo: () => void;
  onDismissInfo: () => void;
}) {
  // "Guardado" fades after 2 s; "Guardando…" and errors stay until the state changes.
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

      {saveState === "saving" ? (
        <View className="mx-4 mb-1 flex-row items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
          <MaterialCommunityIcons color={color.inkMuted} name="cloud-sync-outline" size={14} />
          <Text className="text-[11px] text-muted-foreground">Guardando…</Text>
        </View>
      ) : savedVisible ? (
        <View className="mx-4 mb-1 flex-row items-center gap-1.5 rounded-lg bg-forest-wash px-3 py-1.5">
          <MaterialCommunityIcons color={color.forest} name="cloud-check-outline" size={14} />
          <Text className="text-[11px] font-bold text-forest">Guardado</Text>
        </View>
      ) : saveState === "failed" ? (
        <View className="mx-4 mb-1 flex-row items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5">
          <MaterialCommunityIcons color={color.destructive} name="cloud-alert-outline" size={14} />
          <Text className="text-[11px] font-bold text-destructive">
            Error al guardar. Tus últimos cambios no se guardaron.
          </Text>
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
  onSwitchProject,
  onAdd,
}: {
  activeProject?: Project;
  addLabel: string;
  onSwitchProject: () => void;
  onAdd: () => void;
}) {
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
          {activeProject ? (
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
  actionLabel,
  onAction,
  onDismiss,
  assertive = false,
}: {
  icon: "check" | "trash-can-outline";
  message: string;
  bottom: number;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  assertive?: boolean;
}) {
  return (
    <View
      accessibilityLiveRegion={assertive ? "assertive" : "polite"}
      className="absolute left-4 right-4 z-[2] flex-row items-center gap-2 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: color.forestDark, bottom }}
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
