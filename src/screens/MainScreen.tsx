import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  buildActivity,
  calculateGroupSummary,
  getGroupMembers,
} from "../domain/balances";
import { formatMoney } from "../domain/money";
import type { ActivityItem, AppData, Group, Member, MemberBalance } from "../domain/types";
import { useAppData } from "../state/useAppData";
import { colors, radius, shadow, spacing, typography } from "../theme/theme";
import { ActionButton, Amount, Avatar, EmptyState, Pill, Section } from "../components/ui";

type TabId = "groups" | "balance" | "activity";

const tabs: { id: TabId; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: "groups", label: "Grupos", icon: "account-group" },
  { id: "balance", label: "Balance", icon: "scale-balance" },
  { id: "activity", label: "Actividad", icon: "history" },
];

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
});

function findMember(members: Member[], id: string) {
  return members.find((member) => member.id === id);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function balanceLabel(balance: MemberBalance) {
  if (balance.netCents > 0) {
    return { label: "Debe recibir", tone: "success" as const };
  }
  if (balance.netCents < 0) {
    return { label: "Debe pagar", tone: "due" as const };
  }
  return { label: "En paz", tone: "neutral" as const };
}

function GroupCard({
  data,
  group,
  isSelected,
  onPress,
}: {
  data: AppData;
  group: Group;
  isSelected: boolean;
  onPress: () => void;
}) {
  const members = getGroupMembers(data, group.id);
  const summary = calculateGroupSummary(data, group.id);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.groupCard, isSelected && styles.groupCardSelected, pressed && styles.pressed]}
    >
      <View style={styles.groupCardTop}>
        <View style={styles.groupTitleWrap}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupDescription} numberOfLines={2}>
            {group.description || "Grupo local"}
          </Text>
        </View>
        {isSelected ? <Pill label="Activo" tone="success" /> : null}
      </View>
      <View style={styles.groupStats}>
        <View>
          <Text style={styles.statLabel}>Gastado</Text>
          <Amount cents={summary.totalSpentCents} />
        </View>
        <View>
          <Text style={styles.statLabel}>Abierto</Text>
          <Amount cents={summary.openBalanceCents} tone={summary.openBalanceCents ? "due" : "success"} />
        </View>
        <View>
          <Text style={styles.statLabel}>Integrantes</Text>
          <Text style={styles.statValue}>{members.length}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Field({
  keyboardType = "default",
  label,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: "default" | "decimal-pad";
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedInk}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const isSettlement = item.type === "settlement";
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIcon, isSettlement ? styles.activitySettlement : styles.activityExpense]}>
        <MaterialCommunityIcons
          color={isSettlement ? colors.primary : colors.financeBlue}
          name={isSettlement ? "check-circle-outline" : "receipt-text"}
          size={20}
        />
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.activityAmount}>
        <Text style={styles.activityDate}>{formatDate(item.createdAt)}</Text>
        <Amount cents={item.amountCents} tone={isSettlement ? "success" : "neutral"} />
      </View>
    </View>
  );
}

export function MainScreen() {
  const {
    addExpense,
    addMember,
    clearError,
    createGroup,
    data,
    error,
    isLoading,
    markSettlementPaid,
    resetDemo,
    selectGroup,
    selectedGroup,
    selectedSummary,
  } = useAppData();

  const [activeTab, setActiveTab] = useState<TabId>("groups");
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [memberName, setMemberName] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [payerId, setPayerId] = useState("");

  const selectedMembers = useMemo(
    () => (selectedGroup ? getGroupMembers(data, selectedGroup.id) : []),
    [data, selectedGroup],
  );

  const activity = useMemo(
    () => (selectedGroup ? buildActivity(data, selectedGroup.id) : []),
    [data, selectedGroup],
  );

  useEffect(() => {
    if (!selectedMembers.some((member) => member.id === payerId)) {
      setPayerId(selectedMembers[0]?.id ?? "");
    }
  }, [payerId, selectedMembers]);

  const submitGroup = () => {
    createGroup(groupName, groupDescription);
    setGroupName("");
    setGroupDescription("");
    setShowGroupForm(false);
  };

  const submitMember = () => {
    if (!selectedGroup) {
      return;
    }
    addMember(selectedGroup.id, memberName);
    setMemberName("");
    setShowMemberForm(false);
  };

  const submitExpense = () => {
    if (!selectedGroup) {
      return;
    }
    addExpense(selectedGroup.id, {
      amount: expenseAmount,
      note: expenseNote,
      payerId,
      title: expenseTitle,
    });
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseNote("");
    setShowExpenseForm(false);
  };

  const renderGroups = () => (
    <View style={styles.tabContent}>
      <Section
        action={
          <ActionButton
            icon={showGroupForm ? "close" : "plus"}
            label={showGroupForm ? "Cerrar" : "Nuevo"}
            onPress={() => setShowGroupForm((current) => !current)}
            tone="secondary"
          />
        }
        title="Tus grupos"
      >
        {showGroupForm ? (
          <View style={styles.formPanel}>
            <Field
              label="Nombre del grupo"
              onChangeText={setGroupName}
              placeholder="Ej. Viaje a Guadalajara"
              value={groupName}
            />
            <Field
              label="Contexto"
              onChangeText={setGroupDescription}
              placeholder="Comidas, rides y hospedaje"
              value={groupDescription}
            />
            <ActionButton icon="check" label="Crear grupo" onPress={submitGroup} />
          </View>
        ) : null}

        {data.groups.length === 0 ? (
          <EmptyState
            action={<ActionButton icon="plus" label="Crear" onPress={() => setShowGroupForm(true)} />}
            body="Crea un grupo para empezar a dividir gastos en MXN."
            icon="account-plus"
            title="Sin grupos todavia"
          />
        ) : (
          data.groups.map((group) => (
            <GroupCard
              data={data}
              group={group}
              isSelected={group.id === selectedGroup?.id}
              key={group.id}
              onPress={() => {
                selectGroup(group.id);
                setActiveTab("balance");
              }}
            />
          ))
        )}
      </Section>
    </View>
  );

  const renderBalance = () => (
    <View style={styles.tabContent}>
      {!selectedGroup || !selectedSummary ? (
        <EmptyState
          body="Crea o selecciona un grupo para ver quien debe pagar."
          icon="scale-balance"
          title="Elige un grupo"
        />
      ) : (
        <>
          <View style={styles.actionGrid}>
            <ActionButton
              icon={showExpenseForm ? "close" : "plus-circle"}
              label={showExpenseForm ? "Cerrar gasto" : "Agregar gasto"}
              onPress={() => setShowExpenseForm((current) => !current)}
            />
            <ActionButton
              icon={showMemberForm ? "close" : "account-plus"}
              label={showMemberForm ? "Cerrar integrante" : "Integrante"}
              onPress={() => setShowMemberForm((current) => !current)}
              tone="secondary"
            />
          </View>

          {showMemberForm ? (
            <View style={styles.formPanel}>
              <Field
                label="Nombre"
                onChangeText={setMemberName}
                placeholder="Ej. Valeria"
                value={memberName}
              />
              <ActionButton icon="account-check" label="Agregar integrante" onPress={submitMember} />
            </View>
          ) : null}

          {showExpenseForm ? (
            <View style={styles.formPanel}>
              <Field
                label="Concepto"
                onChangeText={setExpenseTitle}
                placeholder="Ej. Tacos despues del cine"
                value={expenseTitle}
              />
              <Field
                keyboardType="decimal-pad"
                label="Monto MXN"
                onChangeText={setExpenseAmount}
                placeholder="850.00"
                value={expenseAmount}
              />
              <Field
                label="Nota"
                onChangeText={setExpenseNote}
                placeholder="Opcional"
                value={expenseNote}
              />
              <Text style={styles.fieldLabel}>Pago</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.payerRow}>
                  {selectedMembers.map((member) => (
                    <Pressable
                      key={member.id}
                      onPress={() => setPayerId(member.id)}
                      style={[styles.payerChip, payerId === member.id && styles.payerChipActive]}
                    >
                      <Avatar color={member.avatarColor} label={member.name} />
                      <Text style={styles.payerName}>{member.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <ActionButton
                disabled={selectedMembers.length === 0}
                icon="receipt-text-plus"
                label="Guardar gasto"
                onPress={submitExpense}
              />
            </View>
          ) : null}

          <Section title="Quien le debe a quien">
            {selectedSummary.settlements.length === 0 ? (
              <EmptyState
                body="Este grupo esta en paz por ahora."
                icon="check-decagram"
                title="Sin arreglos pendientes"
              />
            ) : (
              selectedSummary.settlements.map((settlement) => {
                const from = findMember(data.members, settlement.fromMemberId);
                const to = findMember(data.members, settlement.toMemberId);
                return (
                  <View key={`${settlement.fromMemberId}-${settlement.toMemberId}`} style={styles.settlementCard}>
                    <View style={styles.settlementPeople}>
                      <View style={styles.person}>
                        <Avatar color={from?.avatarColor ?? colors.due} label={from?.name ?? "?"} />
                        <Text style={styles.personName}>{from?.name ?? "Integrante"}</Text>
                      </View>
                      <MaterialCommunityIcons color={colors.mutedInk} name="arrow-right" size={22} />
                      <View style={styles.person}>
                        <Avatar color={to?.avatarColor ?? colors.primary} label={to?.name ?? "?"} />
                        <Text style={styles.personName}>{to?.name ?? "Integrante"}</Text>
                      </View>
                    </View>
                    <View style={styles.settlementFooter}>
                      <View>
                        <Amount cents={settlement.amountCents} emphasis tone="due" />
                        <Text style={styles.demoOnly}>Sin pagos reales</Text>
                      </View>
                      <ActionButton
                        icon="check"
                        label="Marcar pagado"
                        onPress={() => markSettlementPaid(selectedGroup.id, settlement)}
                        tone="secondary"
                      />
                    </View>
                  </View>
                );
              })
            )}
          </Section>

          <Section title="Balances por integrante">
            {selectedMembers.length === 0 ? (
              <EmptyState
                action={<ActionButton icon="account-plus" label="Agregar" onPress={() => setShowMemberForm(true)} />}
                body="Agrega integrantes antes de registrar gastos."
                icon="account-plus"
                title="Aun no hay integrantes"
              />
            ) : (
              selectedSummary.balances.map((balance) => {
                const status = balanceLabel(balance);
                return (
                  <View key={balance.member.id} style={styles.memberRow}>
                    <Avatar color={balance.member.avatarColor} label={balance.member.name} />
                    <View style={styles.memberCopy}>
                      <Text style={styles.memberName}>{balance.member.name}</Text>
                      <Pill label={status.label} tone={status.tone} />
                    </View>
                    <Amount
                      cents={Math.abs(balance.netCents)}
                      tone={balance.netCents < 0 ? "due" : "success"}
                    />
                  </View>
                );
              })
            )}
          </Section>
        </>
      )}
    </View>
  );

  const renderActivity = () => (
    <View style={styles.tabContent}>
      <Section
        action={<ActionButton icon="restore" label="Demo" onPress={resetDemo} tone="secondary" />}
        title="Historial"
      >
        {!selectedGroup ? (
          <EmptyState
            body="Selecciona un grupo para ver la actividad."
            icon="history"
            title="Sin grupo activo"
          />
        ) : activity.length === 0 ? (
          <EmptyState
            body="Cuando agregues gastos o marques arreglos, apareceran aqui."
            icon="receipt-text-plus"
            title="Sin actividad todavia"
          />
        ) : (
          activity.map((item) => <ActivityRow item={item} key={item.id} />)
        )}
      </Section>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Cuentas Claras</Text>
              <Text style={styles.title}>Gastos compartidos, sin vueltas</Text>
            </View>
            <View style={styles.brandMark}>
              <MaterialCommunityIcons color={colors.surface} name="scale-balance" size={26} />
            </View>
          </View>

          {error ? (
            <Pressable onPress={clearError} style={styles.errorBanner}>
              <MaterialCommunityIcons color={colors.due} name="alert-circle" size={20} />
              <Text style={styles.errorText}>{error}</Text>
              <MaterialCommunityIcons color={colors.due} name="close" size={18} />
            </Pressable>
          ) : null}

          {isLoading ? (
            <View style={styles.loadingBand}>
              <MaterialCommunityIcons color={colors.primary} name="progress-clock" size={22} />
              <Text style={styles.loadingText}>Cargando datos locales...</Text>
            </View>
          ) : null}

          {selectedGroup && selectedSummary ? (
            <View style={styles.summaryBand}>
              <View style={styles.summaryTop}>
                <View>
                  <Text style={styles.summaryLabel}>Grupo activo</Text>
                  <Text style={styles.summaryTitle}>{selectedGroup.name}</Text>
                </View>
                <Pill label="MXN local" tone="gold" />
              </View>
              <Text style={styles.summaryDescription}>{selectedGroup.description}</Text>
              <View style={styles.summaryStats}>
                <View>
                  <Text style={styles.summaryMetricLabel}>Gastado</Text>
                  <Amount cents={selectedSummary.totalSpentCents} emphasis />
                </View>
                <View>
                  <Text style={styles.summaryMetricLabel}>Abierto</Text>
                  <Amount
                    cents={selectedSummary.openBalanceCents}
                    emphasis
                    tone={selectedSummary.openBalanceCents ? "due" : "success"}
                  />
                </View>
              </View>
              <Text style={styles.trustNote}>Demo sin pagos reales · Datos guardados en este dispositivo</Text>
            </View>
          ) : null}

          {activeTab === "groups" ? renderGroups() : null}
          {activeTab === "balance" ? renderBalance() : null}
          {activeTab === "activity" ? renderActivity() : null}
        </ScrollView>

        <View style={styles.bottomNav}>
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                accessibilityRole="tab"
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.navItem, active && styles.navItemActive]}
              >
                <MaterialCommunityIcons
                  color={active ? colors.surface : colors.primaryDark}
                  name={tab.icon}
                  size={21}
                />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  activityAmount: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  activityCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  activityDate: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
  },
  activityExpense: {
    backgroundColor: "#E7EEF6",
  },
  activityIcon: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  activityRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 76,
    padding: spacing.md,
  },
  activitySettlement: {
    backgroundColor: colors.successWash,
  },
  activitySubtitle: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 18,
  },
  activityTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "800",
  },
  bottomNav: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
    paddingBottom: Platform.select({ android: spacing.sm, default: spacing.md }),
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
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  demoOnly: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  errorBanner: {
    alignItems: "center",
    backgroundColor: colors.dueWash,
    borderColor: colors.due,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    padding: spacing.md,
  },
  errorText: {
    color: colors.due,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "700",
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
  },
  formPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    minHeight: 126,
    padding: spacing.md,
  },
  groupCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  groupCardTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  groupDescription: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 18,
  },
  groupName: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "800",
  },
  groupStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  groupTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "700",
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  keyboard: {
    flex: 1,
  },
  loadingBand: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    padding: spacing.md,
  },
  loadingText: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: "800",
  },
  memberCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  memberName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "800",
  },
  memberRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md,
  },
  navItem: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 54,
    paddingVertical: spacing.sm,
  },
  navItemActive: {
    backgroundColor: colors.primary,
  },
  navLabel: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "800",
  },
  navLabelActive: {
    color: colors.surface,
  },
  payerChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    padding: spacing.sm,
  },
  payerChipActive: {
    backgroundColor: colors.successWash,
    borderColor: colors.primary,
  },
  payerName: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
  },
  payerRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  person: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
  },
  personName: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.86,
  },
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  settlementCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  settlementFooter: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  settlementPeople: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  statLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
  },
  summaryBand: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow,
  },
  summaryDescription: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 19,
  },
  summaryLabel: {
    color: colors.primary,
    fontSize: typography.micro,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryMetricLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    marginTop: spacing.xs,
  },
  summaryTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  tabContent: {
    gap: spacing.lg,
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: "900",
    lineHeight: 34,
  },
  trustNote: {
    color: colors.financeBlue,
    fontSize: typography.small,
    fontWeight: "800",
  },
});
