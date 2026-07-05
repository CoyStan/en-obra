import { View } from "react-native";
import { AuditRow, Button, GroupRow, MoneyCard, PersonRow } from "../reusables";
import { colors } from "../../theme/theme";

export function SurfaceRowsProof() {
  return (
    <View className="hidden h-0 w-0 gap-ccSm" testID="surface-rows-proof">
      <MoneyCard
        action={<Button testID="surface-rows-proof-money-action">Resolver</Button>}
        cents={451190}
        label="Tu balance"
        meta="Oaxaca · 5 integrantes"
        pill="Sin pagos reales"
        testID="surface-rows-proof-money-card"
        title="Te deben"
        tone="success"
      />
      <PersonRow
        amountCents={451190}
        amountTone="success"
        avatarColor={colors.primary}
        badge="Debe recibir"
        meta="Pagó MXN 6,200.00"
        name="Ana"
        testID="surface-rows-proof-person-row"
      />
      <GroupRow
        amountCents={92810}
        meta="Viaje · 5 integrantes"
        rightLabel="Activo"
        testID="surface-rows-proof-group-row"
        title="Viaje a Oaxaca"
      />
      <AuditRow
        amountCents={168810}
        amountTone="due"
        icon="receipt-text-outline"
        meta="Hoy · agregado por Luis"
        testID="surface-rows-proof-audit-row"
        title="Cena en el centro"
      />
    </View>
  );
}
