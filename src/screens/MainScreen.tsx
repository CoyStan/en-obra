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
  describeBalance,
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

const shortMoneyFormatter = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

function findMember(members: Member[], id: string) {
  return members.find((member) => member.id === id);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatShortMoney(cents: number) {
  return shortMoneyFormatter.format(cents / 100);
}

function activityIconForTitle(title: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const normalized = title.toLowerCase();

  if (normalized.includes("hospedaje") || normalized.includes("hotel")) {
    return "bed-king-outline";
  }
  if (normalized.includes("taxi") || normalized.includes("uber") || normalized.includes("gasolina")) {
    return "car-outline";
  }
  if (normalized.includes("super") || normalized.includes("súper")) {
    return "cart-outline";
  }
  if (normalized.includes("tlayuda") || normalized.includes("cena") || normalized.includes("taco")) {
    return "food-outline";
  }

  return "receipt-text";
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
      accessibilityHint="Selecciona este grupo y abre su balance."
      accessibilityLabel={`${group.name}. Gastado ${formatMoney(
        summary.totalSpentCents,
      )}. Balance abierto ${formatMoney(summary.openBalanceCents)}. ${members.length} integrantes.`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      hitSlop={4}
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
        accessibilityLabel={label}
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
          name={isSettlement ? "check-circle-outline" : activityIconForTitle(item.title)}
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

function QuickActionTile({
  disabled = false,
  detail,
  icon,
  label,
  onPress,
  primary = false,
}: {
  disabled?: boolean;
  detail?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        primary && styles.quickActionPrimary,
        disabled && styles.quickActionDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={[styles.quickActionIcon, primary && styles.quickActionIconPrimary]}>
        <MaterialCommunityIcons
          color={primary ? colors.surface : colors.primaryDark}
          name={icon}
          size={19}
        />
      </View>
      <View style={styles.quickActionCopy}>
        <Text style={[styles.quickActionLabel, primary && styles.quickActionLabelPrimary]}>
          {label}
        </Text>
        {detail ? <Text style={styles.quickActionDetail}>{detail}</Text> : null}
      </View>
    </Pressable>
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

  const [activeTab, setActiveTab] = useState<TabId>("balance");
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

  const selectedPreview = useMemo(
    () => (selectedGroup ? getBalancePreview(data, selectedGroup.id) : { creditor: null, debtor: null }),
    [data, selectedGroup],
  );

  const primarySettlement = selectedSummary?.settlements[0] ?? null;
  const primarySettlementFrom = primarySettlement
    ? findMember(data.members, primarySettlement.fromMemberId)
    : null;
  const primarySettlementTo = primarySettlement
    ? findMember(data.members, primarySettlement.toMemberId)
    : null;
  const highlightedMembers = selectedMembers.slice(0, 5);
  const extraMembers = Math.max(selectedMembers.length - highlightedMembers.length, 0);

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

  const renderSettlementCard = (settlement: SettlementSuggestion) => {
    const from = findMember(data.members, settlement.fromMemberId);
    const to = findMember(data.members, settlement.toMemberId);

    return (
      <View key={`${settlement.fromMemberId}-${settlement.toMemberId}`} style={styles.settlementCard}>
        <View style={styles.settlementCompactTop}>
          <View style={styles.settlementRouteIcon}>
            <MaterialCommunityIcons color={colors.primaryDark} name="arrow-decision-outline" size={18} />
          </View>
          <View style={styles.settlementCompactCopy}>
            <Text style={styles.settlementTitle}>
              {from?.name ?? "Integrante"} le debe a {to?.name ?? "integrante"}
            </Text>
            <Text style={styles.settlementInstruction}>
              Registra un pago externo cuando lo hayan liquidado.
            </Text>
            <View style={styles.demoChip}>
              <MaterialCommunityIcons color={colors.mutedInk} name="shield-alert-outline" size={14} />
              <Text style={styles.demoOnly}>Sin pagos reales</Text>
            </View>
          </View>
          <Text style={styles.settlementAmountText}>
            {formatMoney(settlement.amountCents)}
          </Text>
        </View>
        <View style={styles.settlementActions}>
          <ActionButton
            icon="check"
            label="Marcar pagado"
            onPress={() => setPendingSettlement(settlement)}
            tone="secondary"
          />
        </View>
      </View>
    );
  };

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
          <View style={styles.quickActionRail}>
            <QuickActionTile
              icon="plus"
              label="Agregar gasto"
              onPress={() => setShowExpenseForm(true)}
              primary
            />
            <QuickActionTile
              icon="account-plus-outline"
              label="Integrante"
              onPress={() => setShowMemberForm(true)}
            />
            <QuickActionTile
              detail="Sin pagos reales"
              disabled={!primarySettlement}
              icon="swap-horizontal"
              label="Liquidar"
              onPress={() => {
                if (primarySettlement) {
                  setPendingSettlement(primarySettlement);
                }
              }}
            />
          </View>

          <Section
            action={
              selectedSummary.settlements.length > 1 ? (
                <Pill label={`+${selectedSummary.settlements.length - 1} más`} tone="neutral" />
              ) : undefined
            }
            title="Quién le debe a quién"
          >
            {selectedSummary.settlements.length === 0 ? (
              <EmptyState
                body="No hay pagos pendientes para este grupo."
                icon="check-decagram"
                title="Todo en paz por ahora"
              />
            ) : (
              selectedSummary.settlements.slice(0, 1).map(renderSettlementCard)
            )}
          </Section>

          <Section
            action={<ActionButton icon="history" label="Ver todo" onPress={() => setActiveTab("activity")} tone="ghost" />}
            title="Actividad reciente"
          >
            {activity.length === 0 ? (
              <EmptyState
                body="Los gastos y arreglos aparecerán aquí."
                icon="receipt-text-plus"
                title="Sin movimientos"
              />
            ) : (
              activity.slice(0, 3).map((item) => <ActivityRow item={item} key={item.id} />)
            )}
          </Section>

          {selectedSummary.settlements.length > 1 ? (
            <Section title="Otros arreglos">
              {selectedSummary.settlements.slice(1).map(renderSettlementCard)}
            </Section>
          ) : null}

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
                      <View style={styles.balanceStatusLine}>
                        <Pill label={status.label} tone={status.tone} />
                        <Text style={styles.balanceExplanation}>{describeBalance(balance)}</Text>
                      </View>
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
                accessibilityHint="Selecciona quién pagó este gasto."
                accessibilityLabel={`Pagó ${member.name}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: payerId === member.id }}
                hitSlop={4}
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
          <View style={styles.appBar}>
            <Text style={styles.appTitle}>Cuentas Claras</Text>
            <View style={styles.appActions}>
              <Pressable
                accessibilityLabel="Ver actividad"
                accessibilityRole="button"
                hitSlop={4}
                onPress={() => setActiveTab("activity")}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons color={colors.primaryDark} name="bell-outline" size={22} />
              </Pressable>
              <Pressable
                accessibilityLabel="Abrir perfil"
                accessibilityRole="button"
                hitSlop={4}
                onPress={() => setActiveTab("account")}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons color={colors.primaryDark} name="dots-vertical" size={22} />
              </Pressable>
            </View>
          </View>

          {error || accountError ? (
            <Pressable
              accessibilityHint="Toca para cerrar el mensaje de error."
              accessibilityLabel={`Error: ${error ?? accountError}`}
              accessibilityRole="button"
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
            <View style={styles.activeGroupCard}>
              <View style={styles.warmAccentLine} />
              <View style={styles.activeGroupTop}>
                <View style={styles.groupBadge}>
                  <MaterialCommunityIcons color={colors.primaryDark} name="home-city-outline" size={24} />
                </View>
                <View style={styles.activeGroupCopy}>
                  <Text style={styles.summaryTitle}>{selectedGroup.name}</Text>
                  <Text style={styles.summaryDescription}>
                    {selectedMembers.length} integrantes · {selectedGroup.description}
                  </Text>
                </View>
                <Pill label="MXN local" tone="gold" />
              </View>

              <View style={styles.memberStrip}>
                {highlightedMembers.map((member) => (
                  <Avatar color={member.avatarColor} key={member.id} label={member.name} />
                ))}
                {extraMembers > 0 ? (
                  <View style={styles.extraMembersBadge}>
                    <Text style={styles.extraMembersText}>+{extraMembers}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.balancePanel}>
                <View style={styles.balanceColumn}>
                  <View style={styles.balanceIconSuccess}>
                    <MaterialCommunityIcons color={colors.primaryDark} name="arrow-down" size={18} />
                  </View>
                  <Text style={styles.balanceKicker}>Recibe</Text>
                  <Text style={styles.balancePerson}>
                    {selectedPreview.creditor?.member.name ?? "Grupo"}
                  </Text>
                  <Text style={[styles.balanceAmount, styles.balanceAmountSuccess]}>
                    {formatShortMoney(selectedPreview.creditor?.netCents ?? 0)}
                  </Text>
                  <Text style={styles.balanceCaption}>MXN por cobrar</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceColumn}>
                  <View style={styles.balanceIconDue}>
                    <MaterialCommunityIcons color={colors.terracotta} name="arrow-up" size={18} />
                  </View>
                  <Text style={styles.balanceKicker}>Debe</Text>
                  <Text style={styles.balancePerson}>
                    {selectedPreview.debtor?.member.name ?? "Nadie"}
                  </Text>
                  <Text style={[styles.balanceAmount, selectedPreview.debtor ? styles.balanceAmountDue : styles.balanceAmountSuccess]}>
                    {formatShortMoney(Math.abs(selectedPreview.debtor?.netCents ?? 0))}
                  </Text>
                  <Text style={styles.balanceCaption}>MXN por pagar</Text>
                </View>
              </View>

              <View style={styles.summaryInsight}>
                <MaterialCommunityIcons color={colors.primaryDark} name="shield-check-outline" size={18} />
                <Text style={styles.summaryInsightText}>
                  {primarySettlement
                    ? `${primarySettlementFrom?.name ?? "Alguien"} le debe a ${
                        primarySettlementTo?.name ?? "alguien"
                      } ${formatMoney(primarySettlement.amountCents)} · Sin pagos reales`
                    : "Todo en paz · Datos guardados en este dispositivo"}
                </Text>
              </View>
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
                accessibilityLabel={tab.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                hitSlop={4}
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.navItem, active && styles.navItemActive]}
              >
                <MaterialCommunityIcons
                  color={colors.primaryDark}
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
  activeGroupCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
  },
  activeGroupCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  activeGroupTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
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
  appActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  appBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
  },
  appTitle: {
    color: colors.primaryDark,
    fontSize: typography.title,
    fontWeight: "700",
    lineHeight: 31,
  },
  actionGrid: {
    flexWrap: "wrap",
    flexDirection: "row",
    gap: spacing.sm,
  },
  balanceCaption: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 24,
    textAlign: "center",
  },
  balanceAmountDue: {
    color: colors.due,
  },
  balanceAmountSuccess: {
    color: colors.primary,
  },
  balanceColumn: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minWidth: 0,
  },
  balanceDivider: {
    alignSelf: "stretch",
    backgroundColor: colors.border,
    width: 1,
  },
  balanceExplanation: {
    color: colors.mutedInk,
    flexShrink: 1,
    fontSize: typography.micro,
    fontWeight: "500",
    lineHeight: 16,
  },
  balanceIconDue: {
    alignItems: "center",
    backgroundColor: colors.dueWash,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  balanceIconSuccess: {
    alignItems: "center",
    backgroundColor: colors.surfaceTinted,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  balanceKicker: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
  },
  balancePanel: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 142,
    padding: spacing.md,
  },
  balancePerson: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "700",
    textAlign: "center",
  },
  balanceStatusLine: {
    gap: spacing.xs,
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
    backgroundColor: colors.warmWash,
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
    minHeight: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    gap: spacing.sm,
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
    backgroundColor: colors.surfaceTinted,
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
  extraMembersBadge: {
    alignItems: "center",
    backgroundColor: colors.surfaceTinted,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  extraMembersText: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: "800",
  },
  groupBadge: {
    alignItems: "center",
    backgroundColor: colors.surfaceTinted,
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  memberStrip: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
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
    backgroundColor: colors.surfaceTinted,
  },
  navLabel: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "500",
  },
  navLabelActive: {
    color: colors.primaryDark,
    fontWeight: "700",
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
  quickAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "column",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 78,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  quickActionCopy: {
    alignItems: "center",
    gap: 2,
    minWidth: 0,
  },
  quickActionDetail: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "500",
    lineHeight: 14,
    textAlign: "center",
  },
  quickActionDisabled: {
    opacity: 0.52,
  },
  quickActionIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceTinted,
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  quickActionIconPrimary: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  quickActionLabel: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  quickActionLabelPrimary: {
    color: colors.surface,
  },
  quickActionPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickActionRail: {
    flexDirection: "row",
    gap: spacing.sm,
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
    gap: spacing.sm,
    padding: spacing.md,
  },
  settlementActions: {
    alignItems: "flex-start",
  },
  settlementAmountText: {
    color: colors.due,
    fontSize: typography.heading,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    textAlign: "right",
  },
  settlementCompactCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  settlementCompactTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
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
  settlementInstruction: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "500",
    lineHeight: 16,
  },
  settlementPeople: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  settlementRouteIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceTinted,
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  settlementTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "700",
    lineHeight: 19,
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
    backgroundColor: colors.surfaceTinted,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  warmAccentLine: {
    backgroundColor: colors.marigold,
    height: 3,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
