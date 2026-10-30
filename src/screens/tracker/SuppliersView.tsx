import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { Button, Card, CardContent } from "../../components/reusables";
import { trackerColors as color } from "../../tracker/theme";
import type { Material, Supplier } from "../../tracker/types";

export function SuppliersView({
  suppliers,
  materials,
  onEditNote,
  onEditSupplier,
  onDeleteSupplier,
  onMessageSupplier,
}: {
  suppliers: Supplier[];
  materials: Material[];
  onEditNote: (supplier: Supplier) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplier: Supplier) => void;
  onMessageSupplier: (supplier: Supplier) => void;
}) {
  return (
    <>
      <View className="pb-4 pt-6">
        <Text className="text-[27px] font-extrabold tracking-tight text-foreground">Proveedores</Text>
        <Text className="mt-1 text-sm leading-5 text-muted-foreground">
          Guarda el contacto y el último acuerdo de cada compra.
        </Text>
      </View>
      {suppliers.length === 0 ? (
        <View className="items-center py-8">
          <MaterialCommunityIcons color={color.inkMuted} name="store-plus-outline" size={40} />
          <Text className="mt-3 text-base font-extrabold text-foreground">Todavía no hay proveedores</Text>
          <Text className="mt-1 text-center text-[13px] leading-[19px] text-muted-foreground">
            Agrega al primero con el botón de arriba.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {suppliers.map((supplier) => {
            const supplied = materials.filter((m) => m.supplierId === supplier.id);
            return (
              <Card key={supplier.id}>
                <CardContent>
                  <View className="flex-row items-center">
                    <View className="h-11 w-11 items-center justify-center rounded-md bg-forest-wash">
                      <MaterialCommunityIcons color={color.forest} name="store-outline" size={22} />
                    </View>
                    <View className="ml-3 min-w-0 flex-1">
                      <Text className="text-[15px] font-extrabold text-foreground">{supplier.name}</Text>
                      {supplier.category ? (
                        <Text className="mt-0.5 text-xs text-muted-foreground">{supplier.category}</Text>
                      ) : null}
                    </View>
                  </View>
                  <Pressable
                    accessibilityHint="Toca para registrar un nuevo acuerdo o nota"
                    accessibilityLabel={
                      supplier.lastContactNote
                        ? `Nota guardada: ${supplier.lastContactNote}. Toca para actualizar.`
                        : "Sin nota guardada. Toca para registrar."
                    }
                    accessibilityRole="button"
                    className="mt-3 flex-row items-start gap-2 rounded-md bg-background p-3"
                    onPress={() => onEditNote(supplier)}
                    style={({ pressed }) => [pressed && { opacity: 0.68 }]}
                  >
                    <MaterialCommunityIcons
                      color={supplier.lastContactNote ? color.forest : color.inkMuted}
                      name="note-text-outline"
                      size={17}
                    />
                    <View className="min-w-0 flex-1">
                      <Text className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Nota / acuerdo guardado
                      </Text>
                      <Text
                        className="mt-1 text-xs leading-[18px]"
                        style={{ color: supplier.lastContactNote ? color.ink : color.inkMuted }}
                      >
                        {supplier.lastContactNote ?? "Sin nota. Toca para agregar."}
                      </Text>
                    </View>
                    <MaterialCommunityIcons color={color.inkMuted} name="pencil-outline" size={15} />
                  </Pressable>
                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-xs text-muted-foreground">
                      {supplied.length} {supplied.length === 1 ? "material" : "materiales"}
                    </Text>
                    <View className="flex-row gap-2">
                      <Button icon="pencil-outline" onPress={() => onEditSupplier(supplier)} size="sm" variant="ghost">
                        Editar
                      </Button>
                      <Button
                        accessibilityLabel={`Borrar ${supplier.name}`}
                        icon="delete-outline"
                        onPress={() => onDeleteSupplier(supplier)}
                        size="sm"
                        variant="ghost"
                      />
                      <Button
                        icon="whatsapp"
                        onPress={() => onMessageSupplier(supplier)}
                        size="sm"
                        variant="secondary"
                      >
                        Escribir
                      </Button>
                    </View>
                  </View>
                </CardContent>
              </Card>
            );
          })}
        </View>
      )}
    </>
  );
}
