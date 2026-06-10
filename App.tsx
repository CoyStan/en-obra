import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow, spacing, typography } from "./src/theme/theme";

const previewGroups = [
  {
    name: "Viaje a Oaxaca",
    detail: "5 integrantes · 8 gastos",
    amount: "$3,842.50 MXN",
    status: "2 arreglos pendientes",
  },
  {
    name: "Depa Roma Norte",
    detail: "3 integrantes · Junio",
    amount: "$1,216.00 MXN",
    status: "1 persona debe pagar",
  },
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Cuentas Claras</Text>
            <Text style={styles.title}>Balance compartido en MXN</Text>
          </View>
          <View style={styles.brandMark}>
            <MaterialCommunityIcons name="scale-balance" color={colors.surface} size={26} />
          </View>
        </View>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>Abierto por cobrar</Text>
            <Text style={styles.summaryAmount}>$5,058.50 MXN</Text>
          </View>
          <Text style={styles.summaryNote}>Demo local · Sin pagos reales</Text>
        </View>

        <Text style={styles.sectionTitle}>Grupos recientes</Text>
        {previewGroups.map((group) => (
          <View key={group.name} style={styles.groupCard}>
            <View style={styles.groupIcon}>
              <MaterialCommunityIcons name="account-group" color={colors.primary} size={22} />
            </View>
            <View style={styles.groupBody}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupDetail}>{group.detail}</Text>
              <Text style={styles.groupStatus}>{group.status}</Text>
            </View>
            <Text style={styles.groupAmount}>{group.amount}</Text>
          </View>
        ))}

        <View style={styles.nextAction}>
          <MaterialCommunityIcons name="plus-circle" color={colors.primaryDark} size={22} />
          <View style={styles.nextActionCopy}>
            <Text style={styles.nextActionTitle}>Listo para registrar gastos</Text>
            <Text style={styles.nextActionText}>
              El siguiente ticket conectara datos locales, grupos, integrantes y arreglos.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "700",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: "800",
    lineHeight: 34,
    maxWidth: 280,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 52,
    justifyContent: "center",
    width: 52,
    ...shadow,
  },
  summary: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.md,
    gap: spacing.md,
    padding: spacing.lg,
  },
  summaryLabel: {
    color: colors.successWash,
    fontSize: typography.small,
    fontWeight: "700",
  },
  summaryAmount: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  summaryNote: {
    color: colors.successWash,
    fontSize: typography.small,
    fontWeight: "600",
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "800",
  },
  groupCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.md,
    ...shadow,
  },
  groupIcon: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: radius.sm,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  groupBody: {
    flex: 1,
    gap: spacing.xs,
  },
  groupName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "800",
  },
  groupDetail: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
  },
  groupStatus: {
    color: colors.due,
    fontSize: typography.small,
    fontWeight: "700",
  },
  groupAmount: {
    color: colors.financeBlue,
    fontSize: typography.small,
    fontWeight: "800",
    maxWidth: 92,
    textAlign: "right",
  },
  nextAction: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  nextActionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  nextActionTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "800",
  },
  nextActionText: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 18,
  },
});
