import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button, Sheet, SheetContent, SheetFooter, SheetHeader } from "../reusables";
import { trackerColors as color } from "../../tracker/theme";
import type { Project } from "../../tracker/types";

type ProjectSwitcherProps = {
  activeProjectId: string;
  onClose: () => void;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onSelectProject: (projectId: string) => void;
  projects: Project[];
  visible: boolean;
};

export function ProjectSwitcher({
  activeProjectId,
  onClose,
  onCreateProject,
  onEditProject,
  onSelectProject,
  projects,
  visible,
}: ProjectSwitcherProps) {
  const chooseProject = (projectId: string) => {
    onSelectProject(projectId);
    onClose();
  };

  return (
    <Sheet onClose={onClose} visible={visible}>
      <SheetHeader onClose={onClose} subtitle="Elige el que vas a mover ahora." title="Mis trabajos" />
      <ScrollView>
        <SheetContent className="gap-2 pb-2">
          {projects.map((project) => {
            const selected = project.id === activeProjectId;
            return (
              <Pressable
                accessibilityHint="Activa este trabajo"
                accessibilityLabel={`${project.name}. Cliente: ${project.clientName}${project.address ? `. ${project.address}` : ""}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                className="min-h-[72px] flex-row items-center rounded-lg border p-3"
                key={project.id}
                onPress={() => chooseProject(project.id)}
                style={({ pressed }) => [
                  selected ? { backgroundColor: color.forestWash, borderColor: color.forest } : undefined,
                  pressed && { opacity: 0.68 },
                ]}
              >
                <View
                  className="h-[42px] w-[42px] items-center justify-center rounded-md"
                  style={{ backgroundColor: selected ? color.forest : color.forestWash }}
                >
                  <MaterialCommunityIcons
                    color={selected ? color.surface : color.forest}
                    name="briefcase-variant-outline"
                    size={21}
                  />
                </View>
                <View className="mx-3 min-w-0 flex-1">
                  <Text className="text-[15px] font-bold text-foreground" numberOfLines={1}>
                    {project.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
                    {project.clientName}
                    {project.address ? ` · ${project.address}` : ""}
                  </Text>
                </View>
                <Button
                  accessibilityLabel={`Editar ${project.name}`}
                  className="mr-1 h-8 min-h-0 px-2"
                  icon="pencil-outline"
                  onPress={() => {
                    onClose();
                    onEditProject(project);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Editar
                </Button>
                {selected ? (
                  <MaterialCommunityIcons color={color.forest} name="check-circle" size={21} />
                ) : (
                  <MaterialCommunityIcons color={color.inkMuted} name="chevron-right" size={21} />
                )}
              </Pressable>
            );
          })}
        </SheetContent>
      </ScrollView>
      <SheetFooter>
        <Button
          className="flex-1"
          icon="plus"
          onPress={() => {
            onClose();
            onCreateProject();
          }}
        >
          Nuevo trabajo
        </Button>
      </SheetFooter>
    </Sheet>
  );
}
