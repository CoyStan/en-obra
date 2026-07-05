import { Text, View } from "react-native";
import { Amount, Avatar, Button, Card, IconButton, Pill } from "../reusables";
import { colors } from "../../theme/theme";

export function CoreReusablesProof() {
  return (
    <Card className="hidden h-0 w-0 gap-ccSm" testID="core-reusables-proof-card">
      <View className="flex-row items-center gap-ccSm">
        <Avatar color={colors.primary} label="Ana" testID="core-reusables-proof-avatar" />
        <View>
          <Text className="text-ccSmall font-bold text-ink">Core Reusables ready</Text>
          <Amount cents={451190} tone="success" testID="core-reusables-proof-amount" />
        </View>
      </View>
      <Pill label="Sin pagos reales" tone="success" testID="core-reusables-proof-pill" />
      <Button icon="receipt-text-plus" testID="core-reusables-proof-button">Agregar gasto</Button>
      <IconButton
        accessibilityLabel="Core reusable icon proof"
        icon="bell-outline"
        testID="core-reusables-proof-icon-button"
      />
    </Card>
  );
}
