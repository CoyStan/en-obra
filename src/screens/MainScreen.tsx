import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
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
  getBalancePreview,
  getGroupMembers,
} from "../domain/balances";
import { useAccount } from "../auth/useAccount";
import { formatMoney } from "../domain/money";
import type {
  ActivityItem,
  AppData,
  Group,
  Member,
  MemberBalance,
  SettlementSuggestion,
} from "../domain/types";
import { useAppData } from "../state/useAppData";
import { colors, radius, spacing, typography } from "../theme/theme";
import { ActionButton, Amount, Avatar, EmptyState, Pill, Section } from "../components/ui";

type TabId = "groups" | "balance" | "activity" | "account";

const tabs: { id: TabId; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: "groups", label: "Grupos", icon: "account-group" },
  { id: "balance", label: "Balance", icon: "scale-balance" },
  { id: "activity", label: "Actividad", icon: "history" },
  { id: "account", label: "Perfil", icon: "account-circle" },
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
  const preview = getBalancePreview(data, group.id);
  const previewCopy =
    preview.creditor && preview.debtor
      ? `${preview.creditor.member.name} recibe ${formatMoney(preview.creditor.netCents)} · ${
          preview.debtor.member.name
        } debe ${formatMoney(Math.abs(preview.debtor.netCents))}`
      : "Todo en paz por ahora";

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
      <View style={styles.groupPreview}>
        <MaterialCommunityIcons color={summary.openBalanceCents ? colors.due : colors.primary} name="swap-horizontal" size={16} />
        <Text style={styles.groupPreviewText}>{previewCopy}</Text>
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
          color={isSettlement ? colors.primary : colors.mutedInk}
          name={isSettlement ? "check-circle-outline" : "receipt-text"}
          size={18}
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
    account,
    accountError,
    clearAccountError,
    createAccount,
    isAccountLoading,
    signOut,
  } = useAccount();

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
  const [accountName, setAccountName] = useState("Ana Martínez");
  const [accountEmail, setAccountEmail] = useState("ana@example.com");
  const [pendingSettlement, setPendingSettlement] = useState<SettlementSuggestion | null>(null);

  const selectedMembers = useMemo(
    () => (selectedGroup ? getGroupMembers(data, selectedGroup.id) : []),
    [data, selectedGroup],
  );

  const activity = useMemo(
    () => (selectedGroup ? buildActivity(data, selectedGroup.id) : []),
    [data, selectedGroup],
  );

  const primarySettlement = selectedSummary?.settlements[0] ?? null;
  const primarySettlementFrom = primarySettlement
    ? findMember(data.members, primarySettlement.fromMemberId)
    : null;
  const primarySettlementTo = primarySettlement
    ? findMember(data.members, primarySettlement.toMemberId)
    : null;

  useEffect(() => {
    if (!selectedMembers.some((member) => member.id === payerId)) {
      setPayerId(selectedMembers[0]?.id ?? "");
    }
  }, [payerId, selectedMembers]);

  const submitGroup = () => {
    const created = createGroup(groupName, groupDescription);
    if (!created) {
      return;
    }
    setGroupName("");
    setGroupDescription("");
    setShowGroupForm(false);
  };

  const submitMember = () => {
    if (!selectedGroup) {
      return;
    }
    const added = addMember(selectedGroup.id, memberName);
    if (!added) {
      return;
    }
    setMemberName("");
    setShowMemberForm(false);
  };

  const submitExpense = () => {
    if (!selectedGroup) {
      return;
    }
    const added = addExpense(selectedGroup.id, {
      amount: expenseAmount,
      note: expenseNote,
      payerId,
      title: expenseTitle,
    });
    if (!added) {
      return;
    }
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseNote("");
    setShowExpenseForm(false);
  };

  const submitAccount = async () => {
    const ok = await createAccount({
      displayName: accountName,
      email: accountEmail,
    });
    if (ok) {
      setAccountName("");
      setAccountEmail("");
    }
  };

  const confirmSettlementPaid = () => {
    if (!selectedGroup || !pendingSettlement) {
      return;
    }
    markSettlementPaid(selectedGroup.id, pendingSettlement);
    setPendingSettlement(null);
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
            <ActionButton
              disabled={!groupName.trim()}
              icon="check"
              label="Crear grupo"
              onPress={submitGroup}
            />
          </View>
        ) : null}

        {data.groups.length === 0 ? (
          <EmptyState
            action={<ActionButton icon="plus" label="Crear" onPress={() => setShowGroupForm(true)} />}
            body="Crea un grupo para empezar a dividir gastos en MXN."
            icon="account-plus"
            title="Aún no tienes grupos"
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
          body="Crea o selecciona un grupo para ver quién debe pagar."
          icon="scale-balance"
          title="Selecciona un grupo"
        />
      ) : (
        <>
          <View style={styles.actionGrid}>
            <ActionButton
              icon="plus-circle"
              label="Agregar gasto"
              onPress={() => setShowExpenseForm(true)}
            />
            <ActionButton
              icon="account-plus"
              label="Integrante"
              onPress={() => setShowMemberForm(true)}
              tone="secondary"
            />
          </View>

          <Section title="Arreglos sugeridos">
            {selectedSummary.settlements.length === 0 ? (
              <EmptyState
                body="No hay pagos pendientes para este grupo."
                icon="check-decagram"
                title="Todo en paz por ahora"
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
                      <MaterialCommunityIcons color={colors.mutedInk} name="arrow-right" size={18} />
                      <View style={styles.person}>
                        <Avatar color={to?.avatarColor ?? colors.primary} label={to?.name ?? "?"} />
                        <Text style={styles.personName}>{to?.name ?? "Integrante"}</Text>
                      </View>
                    </View>
                    <View style={styles.settlementFooter}>
                      <View>
                        <Amount cents={settlement.amountCents} emphasis tone="due" />
                        <View style={styles.demoChip}>
                          <MaterialCommunityIcons color={colors.mutedInk} name="shield-alert-outline" size={14} />
                          <Text style={styles.demoOnly}>Sin pagos reales</Text>
                        </View>
                      </View>
                      <ActionButton
                        icon="check"
                        label="Marcar como pagado"
                        onPress={() => setPendingSettlement(settlement)}
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
                title="Aún no hay integrantes"
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
            body="Cuando agregues gastos o marques arreglos, aparecerán aquí."
            icon="receipt-text-plus"
            title="Aún no hay actividad"
          />
        ) : (
          activity.map((item) => <ActivityRow item={item} key={item.id} />)
        )}
      </Section>
    </View>
  );

  const renderAccount = () => (
    <View style={styles.tabContent}>
      <Section title="Perfil">
        {isAccountLoading ? (
          <View style={styles.loadingBand}>
            <MaterialCommunityIcons color={colors.primary} name="progress-clock" size={18} />
            <Text style={styles.loadingText}>Cargando cuenta local...</Text>
          </View>
        ) : account.profile && account.mode === "signed-in" ? (
          <View style={styles.accountPanel}>
            <View style={styles.accountTop}>
              <Avatar color={colors.primary} label={account.profile.displayName} />
              <View style={styles.accountCopy}>
                <Text style={styles.accountName}>{account.profile.displayName}</Text>
                <Text style={styles.accountEmail}>{account.profile.email}</Text>
              </View>
              <Pill label="Demostración local" tone="gold" />
            </View>
            <View style={styles.accountStatusGrid}>
              <Pill label="Datos locales" tone="success" />
              <Pill label="Sin sincronización" tone="neutral" />
              <Pill label="Sin pagos reales" tone="gold" />
            </View>
            <View style={styles.accountNotice}>
              <MaterialCommunityIcons color={colors.mutedInk} name="cloud-off-outline" size={18} />
              <Text style={styles.accountNoticeText}>
                Este perfil no sube datos. Un proveedor real requiere decisión de privacidad e infraestructura.
              </Text>
            </View>
            <ActionButton icon="logout" label="Salir del perfil" onPress={signOut} tone="secondary" />
          </View>
        ) : (
          <View style={styles.formPanel}>
            <EmptyState
              body="Crea un perfil de prueba para validar identidad local y futura eliminación de datos."
              icon="account-circle"
              title="Perfil de demostración"
            />
            <Field
              label="Nombre"
              onChangeText={setAccountName}
              placeholder="Tu nombre"
              value={accountName}
            />
            <Field
              label="Correo"
              onChangeText={setAccountEmail}
              placeholder="nombre@correo.com"
              value={accountEmail}
            />
            <ActionButton icon="account-plus" label="Crear perfil de prueba" onPress={submitAccount} />
          </View>
        )}
      </Section>
    </View>
  );

  const renderMemberSheet = () => (
    <Modal
      animationType="slide"
      onRequestClose={() => setShowMemberForm(false)}
      transparent
      visible={showMemberForm}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Agregar integrante</Text>
              <Text style={styles.sheetSubtitle}>Se guardará solo en este dispositivo.</Text>
            </View>
            <ActionButton icon="close" label="Cerrar" onPress={() => setShowMemberForm(false)} tone="ghost" />
          </View>
          {error ? <Text style={styles.formError}>{error}</Text> : null}
          <Field
            label="Nombre"
            onChangeText={setMemberName}
            placeholder="Ej. Valeria"
            value={memberName}
          />
          <ActionButton
            disabled={!memberName.trim()}
            icon="account-check"
            label="Agregar integrante"
            onPress={submitMember}
          />
        </View>
      </View>
    </Modal>
  );

  const renderExpenseSheet = () => (
    <Modal
      animationType="slide"
      onRequestClose={() => setShowExpenseForm(false)}
      transparent
      visible={showExpenseForm}
    >
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Agregar gasto</Text>
              <Text style={styles.sheetSubtitle}>División igualitaria en MXN para el grupo activo.</Text>
            </View>
            <ActionButton icon="close" label="Cerrar" onPress={() => setShowExpenseForm(false)} tone="ghost" />
          </View>
          {error ? <Text style={styles.formError}>{error}</Text> : null}
          <Field
            label="Concepto"
            onChangeText={setExpenseTitle}
            placeholder="Ej. Tacos después del cine"
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
          <Text style={styles.fieldLabel}>¿Quién pagó?</Text>
          <View style={styles.payerOptions}>
            {selectedMembers.map((member) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: payerId === member.id }}
                key={member.id}
                onPress={() => setPayerId(member.id)}
                style={[styles.payerOption, payerId === member.id && styles.payerOptionActive]}
              >
                <Avatar color={member.avatarColor} label={member.name} />
                <Text style={styles.payerName}>{member.name}</Text>
                {payerId === member.id ? (
                  <MaterialCommunityIcons color={colors.primary} name="check-circle" size={18} />
                ) : null}
              </Pressable>
            ))}
          </View>
          <ActionButton
            disabled={
              selectedMembers.length === 0 ||
              !expenseTitle.trim() ||
              !expenseAmount.trim() ||
              !payerId
            }
            icon="receipt-text-plus"
            label="Guardar gasto"
            onPress={submitExpense}
          />
        </ScrollView>
      </View>
    </Modal>
  );

  const renderSettlementConfirmation = () => {
    const from = pendingSettlement ? findMember(data.members, pendingSettlement.fromMemberId) : null;
    const to = pendingSettlement ? findMember(data.members, pendingSettlement.toMemberId) : null;

    return (
      <Modal
        animationType="fade"
        onRequestClose={() => setPendingSettlement(null)}
        transparent
        visible={Boolean(pendingSettlement)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <MaterialCommunityIcons color={colors.mutedInk} name="shield-alert-outline" size={18} />
            </View>
            <Text style={styles.confirmTitle}>Confirmar arreglo local</Text>
            <Text style={styles.confirmBody}>
              Esto solo marca el arreglo como pagado en Cuentas Claras. No mueve dinero ni inicia pagos reales.
            </Text>
            {pendingSettlement ? (
              <View style={styles.confirmRoute}>
                <Text style={styles.confirmPerson}>{from?.name ?? "Integrante"}</Text>
                <MaterialCommunityIcons color={colors.mutedInk} name="arrow-right" size={20} />
                <Text style={styles.confirmPerson}>{to?.name ?? "Integrante"}</Text>
                <Amount cents={pendingSettlement.amountCents} emphasis tone="due" />
              </View>
            ) : null}
            <View style={styles.demoChipStrong}>
              <MaterialCommunityIcons color={colors.mutedInk} name="alert-decagram" size={14} />
              <Text style={styles.demoOnlyStrong}>Sin pagos reales</Text>
            </View>
            <View style={styles.sheetActions}>
              <ActionButton icon="close" label="Cancelar" onPress={() => setPendingSettlement(null)} tone="ghost" />
              <ActionButton icon="check" label="Marcar como pagado" onPress={confirmSettlementPaid} />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
              <Text style={styles.title}>Gastos compartidos, cuentas claras</Text>
            </View>
            <View style={styles.brandMark}>
              <MaterialCommunityIcons color={colors.surface} name="scale-balance" size={20} />
            </View>
          </View>

          {error || accountError ? (
            <Pressable
              onPress={() => {
                clearError();
                clearAccountError();
              }}
              style={styles.errorBanner}
            >
              <MaterialCommunityIcons color={colors.due} name="alert-circle" size={18} />
              <Text style={styles.errorText}>{error ?? accountError}</Text>
              <MaterialCommunityIcons color={colors.due} name="close" size={16} />
            </Pressable>
          ) : null}

          {isLoading ? (
            <View style={styles.loadingBand}>
              <MaterialCommunityIcons color={colors.primary} name="progress-clock" size={18} />
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
              <View style={styles.summaryInsight}>
                <MaterialCommunityIcons
                  color={primarySettlement ? colors.due : colors.primary}
                  name={primarySettlement ? "arrow-decision" : "check-decagram"}
                  size={18}
                />
                <Text style={styles.summaryInsightText}>
                  {primarySettlement
                    ? `${primarySettlementFrom?.name ?? "Alguien"} debe pagar a ${
                        primarySettlementTo?.name ?? "alguien"
                      } ${formatMoney(primarySettlement.amountCents)}`
                    : "Todo en paz: no hay arreglos pendientes."}
                </Text>
              </View>
              <Text style={styles.trustNote}>Demo sin pagos reales · Datos guardados en este dispositivo</Text>
            </View>
          ) : null}

          {activeTab === "groups" ? renderGroups() : null}
          {activeTab === "balance" ? renderBalance() : null}
          {activeTab === "activity" ? renderActivity() : null}
          {activeTab === "account" ? renderAccount() : null}
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
                  size={20}
                />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {renderMemberSheet()}
        {renderExpenseSheet()}
        {renderSettlementConfirmation()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accountCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  accountEmail: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "400",
  },
  accountName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "700",
  },
  accountNotice: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  accountNoticeText: {
    color: colors.mutedInk,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "400",
    lineHeight: 19,
  },
  accountPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  accountStatusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  accountTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  actionGrid: {
    flexWrap: "wrap",
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
    fontWeight: "400",
  },
  activityExpense: {
    backgroundColor: colors.surfaceStrong,
  },
  activityIcon: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  activityRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 64,
    padding: spacing.md,
  },
  activitySettlement: {
    backgroundColor: colors.surfaceTinted,
  },
  activitySubtitle: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "400",
    lineHeight: 18,
  },
  activityTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "600",
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
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  demoOnly: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "500",
  },
  demoChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  demoChipStrong: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 44,
    padding: spacing.sm,
  },
  demoOnlyStrong: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
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
    fontWeight: "500",
  },
  eyebrow: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "600",
  },
  formPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  formError: {
    backgroundColor: colors.dueWash,
    borderColor: colors.due,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.due,
    fontSize: typography.small,
    fontWeight: "700",
    lineHeight: 19,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    minHeight: 108,
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
    fontWeight: "400",
    lineHeight: 18,
  },
  groupName: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  groupStats: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  groupTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  groupPreview: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  groupPreviewText: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "500",
    lineHeight: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "400",
    minHeight: 44,
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
    minHeight: 44,
    padding: spacing.md,
  },
  loadingText: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: "500",
  },
  memberCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  memberName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "600",
  },
  memberRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 60,
    padding: spacing.md,
  },
  navItem: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
  navItemActive: {
    backgroundColor: colors.primary,
  },
  navLabel: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "500",
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
    minHeight: 46,
    padding: spacing.sm,
  },
  payerChipActive: {
    backgroundColor: colors.surfaceTinted,
    borderColor: colors.primary,
  },
  payerName: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "500",
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
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.86,
  },
  confirmBody: {
    color: colors.mutedInk,
    fontSize: typography.body,
    fontWeight: "400",
    lineHeight: 22,
    textAlign: "center",
  },
  confirmCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: spacing.md,
    margin: spacing.md,
    maxWidth: 460,
    padding: spacing.md,
    width: "92%",
  },
  confirmIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  confirmOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(23, 33, 31, 0.42)",
    flex: 1,
    justifyContent: "center",
  },
  confirmPerson: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "600",
  },
  confirmRoute: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.md,
  },
  confirmTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "700",
    textAlign: "center",
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
    flexWrap: "wrap",
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
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "600",
  },
  summaryBand: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  summaryDescription: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "400",
    lineHeight: 19,
  },
  summaryLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "500",
  },
  summaryMetricLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  summaryStats: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  summaryTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  tabContent: {
    gap: spacing.md,
  },
  summaryInsight: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    padding: spacing.md,
  },
  summaryInsightText: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "500",
    lineHeight: 18,
  },
  modalOverlay: {
    backgroundColor: "rgba(23, 33, 31, 0.36)",
    flex: 1,
    justifyContent: "flex-end",
  },
  payerOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    padding: spacing.sm,
  },
  payerOptionActive: {
    backgroundColor: colors.surfaceTinted,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  payerOptions: {
    gap: spacing.sm,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    gap: spacing.md,
    maxHeight: "88%",
    padding: spacing.md,
  },
  sheetActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    height: 4,
    width: 44,
  },
  sheetHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  sheetSubtitle: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "400",
    lineHeight: 18,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: "700",
    lineHeight: 30,
  },
  trustNote: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "400",
  },
});
