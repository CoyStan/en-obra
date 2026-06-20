import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
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
import { formatMoney, parseMoneyInput, splitEqual } from "../domain/money";
import type {
  ActivityItem,
  AppData,
  Group,
  Member,
  MemberBalance,
  SettlementSuggestion,
} from "../domain/types";
import { useAppData } from "../state/useAppData";
import { deleteLocalUserData, getLocalDataInventory, getRemoteDeletionStatus } from "../security/dataDeletion";
import { colors, radius, spacing, typography } from "../theme/theme";
import { ActionButton, Amount, Avatar, EmptyState, Pill, Section } from "../components/ui";

type TabId = "groups" | "balance" | "activity" | "account";
type ExpenseMenuId = "category" | "payer" | "participants";

const MONEY_FLOW_TRACK_WIDTH = 120;
const MONEY_FLOW_DOT_SIZE = 24;
const MONEY_FLOW_TRAVEL = MONEY_FLOW_TRACK_WIDTH - MONEY_FLOW_DOT_SIZE;

const tabs: { id: TabId; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: "groups", label: "Grupos", icon: "account-group" },
  { id: "activity", label: "Actividad", icon: "history" },
  { id: "balance", label: "Balance", icon: "scale-balance" },
  { id: "account", label: "Perfil", icon: "account-circle" },
];

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
});

const longDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
});

const heroMoneyFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const expenseCategories: {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone: "primary" | "blue" | "warm" | "due";
}[] = [
  { id: "food", label: "Comida", icon: "food-outline", tone: "warm" },
  { id: "travel", label: "Viaje", icon: "bag-suitcase-outline", tone: "blue" },
  { id: "transport", label: "Transporte", icon: "car-outline", tone: "primary" },
  { id: "groceries", label: "Súper", icon: "cart-outline", tone: "primary" },
  { id: "home", label: "Casa", icon: "home-outline", tone: "blue" },
  { id: "rent", label: "Renta", icon: "home-city-outline", tone: "blue" },
  { id: "utilities", label: "Servicios", icon: "flash-outline", tone: "primary" },
  { id: "lodging", label: "Hospedaje", icon: "bed-king-outline", tone: "blue" },
  { id: "fuel", label: "Gasolina", icon: "gas-station-outline", tone: "primary" },
  { id: "tickets", label: "Boletos", icon: "ticket-confirmation-outline", tone: "due" },
  { id: "health", label: "Salud", icon: "medical-bag", tone: "due" },
  { id: "shopping", label: "Compras", icon: "shopping-outline", tone: "warm" },
  { id: "fun", label: "Plan", icon: "glass-cocktail", tone: "due" },
  { id: "other", label: "Otro", icon: "dots-horizontal-circle-outline", tone: "primary" },
];

const defaultCategory = expenseCategories[0];

function findMember(members: Member[], id: string) {
  return members.find((member) => member.id === id);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatActivityDate(value: string) {
  return longDateFormatter.format(new Date(value));
}

function formatHeroMoney(cents: number) {
  return heroMoneyFormatter.format(cents / 100);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function densityForWidth(width: number) {
  if (width < 380) {
    return "compact" as const;
  }
  if (width >= 420) {
    return "roomy" as const;
  }
  return "regular" as const;
}

function categoryFor(id?: string) {
  return expenseCategories.find((category) => category.id === id) ?? defaultCategory;
}

function categoryToneStyle(tone: (typeof expenseCategories)[number]["tone"]) {
  if (tone === "blue") {
    return styles.objectToneBlue;
  }
  if (tone === "warm") {
    return styles.objectToneWarm;
  }
  if (tone === "due") {
    return styles.objectToneDue;
  }
  return styles.objectTonePrimary;
}

function groupGlyph(group: Group): keyof typeof MaterialCommunityIcons.glyphMap {
  const normalized = `${group.name} ${group.description}`.toLowerCase();
  if (normalized.includes("viaje") || normalized.includes("hotel") || normalized.includes("oaxaca")) {
    return "bag-suitcase-outline";
  }
  if (normalized.includes("depa") || normalized.includes("casa") || normalized.includes("roma")) {
    return "home-city-outline";
  }
  if (normalized.includes("asada") || normalized.includes("comida") || normalized.includes("taco")) {
    return "food-steak";
  }
  if (normalized.includes("oficina") || normalized.includes("trabajo")) {
    return "briefcase-outline";
  }
  return "account-group-outline";
}

function groupAccent(group: Group) {
  const normalized = `${group.name} ${group.description}`.toLowerCase();
  if (normalized.includes("viaje") || normalized.includes("oaxaca")) {
    return { color: colors.accentBlue, style: styles.objectToneBlue };
  }
  if (normalized.includes("asada") || normalized.includes("comida")) {
    return { color: colors.terracotta, style: styles.objectToneWarm };
  }
  return { color: colors.primaryDark, style: styles.objectTonePrimary };
}

function groupActivityByDate(items: ActivityItem[]) {
  return items.reduce<{ dateKey: string; label: string; items: ActivityItem[] }[]>((sections, item) => {
    const dateKey = item.createdAt.slice(0, 10);
    const existing = sections.find((section) => section.dateKey === dateKey);
    if (existing) {
      existing.items.push(item);
      return sections;
    }
    sections.push({ dateKey, label: formatActivityDate(item.createdAt), items: [item] });
    return sections;
  }, []);
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

function activityIcon(item: ActivityItem): keyof typeof MaterialCommunityIcons.glyphMap {
  if (item.type === "settlement") {
    return "check-circle-outline";
  }
  if (item.type === "member") {
    return "account-plus-outline";
  }
  if (item.type === "group") {
    return "account-group-outline";
  }
  return activityIconForTitle(item.title);
}

function activityTone(item: ActivityItem) {
  if (item.type === "settlement") {
    return styles.activitySettlement;
  }
  if (item.type === "member" || item.type === "group") {
    return styles.activityMember;
  }
  return styles.activityExpense;
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

function personalBalanceLabel(balance?: MemberBalance) {
  if (!balance || balance.netCents === 0) {
    return { label: "Estás en paz", amountCents: 0, tone: "success" as const };
  }
  if (balance.netCents > 0) {
    return { label: "Te deben", amountCents: balance.netCents, tone: "success" as const };
  }
  return { label: "Debes", amountCents: Math.abs(balance.netCents), tone: "due" as const };
}

function settlementCue(
  settlement: SettlementSuggestion | null,
  activeMemberId: string,
  from?: Member | null,
  to?: Member | null,
) {
  if (!settlement) {
    return "Todo en paz · Registro local";
  }

  const perspective = settlementPerspective(settlement, activeMemberId, from, to);
  return `${perspective.title} ${formatMoney(settlement.amountCents)}`;
}

function settlementPerspective(
  settlement: SettlementSuggestion,
  activeMemberId: string,
  from?: Member | null,
  to?: Member | null,
) {
  const fromName = from?.name ?? "Integrante";
  const toName = to?.name ?? "integrante";
  const isActivePayer = activeMemberId === settlement.fromMemberId;
  const isActiveReceiver = activeMemberId === settlement.toMemberId;

  if (isActivePayer) {
    return {
      actionLabel: "Registrar pago",
      badge: "Pago pendiente",
      confirmBody:
        "Confirma si ya pagaste fuera de la app. No se mueve dinero.",
      confirmTitle: `¿Registrar pago a ${toName}?`,
      title: `Tú pagas a ${toName}`,
    };
  }

  if (isActiveReceiver) {
    return {
      actionLabel: "Marcar recibido",
      badge: "Por recibir",
      confirmBody:
        "Confirma si ya recibiste el pago fuera de la app. Solo actualiza el registro local.",
      confirmTitle: `¿Marcar como recibido de ${fromName}?`,
      title: `${fromName} te paga`,
    };
  }

  return {
    actionLabel: "Registrar acuerdo",
    badge: "Grupo",
    confirmBody:
      "Confirma si el grupo ya liquidó fuera de la app. No se mueve dinero.",
    confirmTitle: "Confirmar registro local",
    title: `Vista de grupo: ${fromName} paga a ${toName}`,
  };
}

function GroupObject({ group, size = "regular" }: { group: Group; size?: "regular" | "large" }) {
  const accent = groupAccent(group);
  return (
    <View style={[styles.groupObject, accent.style, size === "large" && styles.groupObjectLarge]}>
      <MaterialCommunityIcons
        color={accent.color}
        name={groupGlyph(group)}
        size={size === "large" ? 24 : 20}
      />
    </View>
  );
}

function AvatarStack({ members, limit = 4 }: { members: Member[]; limit?: number }) {
  const visible = members.slice(0, limit);
  const remaining = Math.max(0, members.length - visible.length);

  return (
    <View accessibilityLabel={`${members.length} integrantes`} style={styles.avatarStack}>
      {visible.map((member, index) => (
        <View key={member.id} style={[styles.avatarStackItem, index > 0 && styles.avatarStackOverlap]}>
          <Avatar color={member.avatarColor} label={member.name} />
        </View>
      ))}
      {remaining ? (
        <View style={[styles.avatarStackMore, visible.length > 0 && styles.avatarStackOverlap]}>
          <Text style={styles.avatarStackMoreText}>+{remaining}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CategoryObject({ categoryId, size = "regular" }: { categoryId?: string; size?: "regular" | "small" }) {
  const category = categoryFor(categoryId);
  return (
    <View style={[styles.categoryObject, categoryToneStyle(category.tone), size === "small" && styles.categoryObjectSmall]}>
      <MaterialCommunityIcons
        color={category.tone === "due" ? colors.due : category.tone === "blue" ? colors.accentBlue : category.tone === "warm" ? colors.terracotta : colors.primaryDark}
        name={category.icon}
        size={size === "small" ? 16 : 19}
      />
    </View>
  );
}

function AnimatedDropdown({
  children,
  open,
}: {
  children: ReactNode;
  open: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
      toValue: open ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  if (!open) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.dropdownPanel,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-6, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function SelectTrigger({
  icon,
  label,
  meta,
  onPress,
  open,
  value,
}: {
  icon?: ReactNode;
  label: string;
  meta?: string;
  onPress: () => void;
  open: boolean;
  value: string;
}) {
  const { width } = useWindowDimensions();
  const density = densityForWidth(width);
  const compact = density === "compact";
  return (
    <Pressable
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectTrigger,
        compact && styles.selectTriggerCompact,
        open && styles.selectTriggerOpen,
        pressed && styles.pressed,
      ]}
    >
      {icon ? <View style={styles.selectTriggerIcon}>{icon}</View> : null}
      <View style={styles.selectTriggerCopy}>
        <Text style={[styles.selectTriggerLabel, compact && styles.selectTriggerLabelCompact]}>{label}</Text>
        <Text numberOfLines={1} style={[styles.selectTriggerValue, compact && styles.selectTriggerValueCompact]}>{value}</Text>
        {meta ? <Text numberOfLines={1} style={styles.selectTriggerMeta}>{meta}</Text> : null}
      </View>
      <MaterialCommunityIcons
        color={colors.primaryDark}
        name={open ? "chevron-up" : "chevron-down"}
        size={22}
      />
    </Pressable>
  );
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
      accessibilityHint="Selecciona este grupo y abre su actividad."
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
        <GroupObject group={group} />
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
      <View style={styles.groupPeopleRow}>
        <AvatarStack members={members} />
        <Text style={styles.groupPeopleText}>
          {members.map((member) => member.name).slice(0, 3).join(", ")}
          {members.length > 3 ? ` y ${members.length - 3} más` : ""}
        </Text>
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
  const hasAmount = item.amountCents > 0;
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityRail}>
        <View style={[styles.activityRailDot, item.type === "settlement" && styles.activityRailDotSettlement]} />
      </View>
      {item.type === "expense" ? (
        <CategoryObject categoryId={item.categoryId} size="small" />
      ) : (
        <View style={[styles.activityIcon, activityTone(item)]}>
        <MaterialCommunityIcons
          color={item.type === "settlement" ? colors.primary : colors.mutedInk}
          name={activityIcon(item)}
          size={18}
        />
        </View>
      )}
      <View style={styles.activityCopy}>
        <View style={styles.activityMetaLine}>
          {item.label ? <Pill label={item.label} tone={item.type === "settlement" ? "gold" : "neutral"} /> : null}
          {item.actorName ? <Text style={styles.activityActor}>{item.actorName}</Text> : null}
        </View>
        <Text numberOfLines={2} style={styles.activityTitle}>{item.title}</Text>
        <Text numberOfLines={2} style={styles.activitySubtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.activityAmount}>
        <Text style={styles.activityDate}>{formatDate(item.createdAt)}</Text>
        {hasAmount ? <Amount cents={item.amountCents} tone={item.type === "settlement" ? "success" : "neutral"} /> : null}
      </View>
    </View>
  );
}

function MoneyFlowFigure({
  amountCents,
  from,
  progress,
  reduceMotion,
  to,
}: {
  amountCents: number;
  from?: Member | null;
  progress: Animated.Value;
  reduceMotion: boolean;
  to?: Member | null;
}) {
  const dotTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MONEY_FLOW_TRAVEL],
  });
  const dotOpacity = progress.interpolate({
    inputRange: [0, 0.12, 0.88, 1],
    outputRange: [0.35, 1, 1, 0.35],
  });
  return (
    <View
      accessibilityLabel={`Flujo visual: ${from?.name ?? "Alguien"} paga ${formatMoney(amountCents)} a ${to?.name ?? "alguien"}. Registro local, sin pagos reales.`}
      style={styles.moneyFlowFigure}
    >
      <View style={styles.moneyFlowPeople}>
        <View style={styles.moneyFlowPerson}>
          <Avatar color={from?.avatarColor ?? colors.primary} label={from?.name ?? "A"} />
          <Text numberOfLines={1} style={styles.moneyFlowName}>{from?.name ?? "Alguien"}</Text>
        </View>
        <View style={styles.moneyFlowTrackWrap}>
          <Text style={styles.moneyFlowAmount}>{formatMoney(amountCents)}</Text>
          <View style={styles.moneyFlowTrack}>
            {reduceMotion ? (
              <View pointerEvents="none" style={[styles.moneyFlowDot, styles.moneyFlowDotStatic]}>
                <MaterialCommunityIcons color={colors.surface} name="cash" size={12} />
              </View>
            ) : (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.moneyFlowDot,
                  {
                    opacity: dotOpacity,
                    transform: [{ translateX: dotTranslate }],
                  },
                ]}
              >
                <MaterialCommunityIcons color={colors.surface} name="cash" size={12} />
              </Animated.View>
            )}
          </View>
        </View>
        <View style={styles.moneyFlowPerson}>
          <Avatar color={to?.avatarColor ?? colors.accentBlue} label={to?.name ?? "B"} />
          <Text numberOfLines={1} style={styles.moneyFlowName}>{to?.name ?? "Alguien"}</Text>
        </View>
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
  const { width: viewportWidth } = useWindowDimensions();
  const {
    account,
    accountError,
    clearLocalAccount,
    clearAccountError,
    createAccount,
    isAccountLoading,
    setActiveGroupMember,
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
  const [expenseCategoryId, setExpenseCategoryId] = useState(defaultCategory.id);
  const [expenseNote, setExpenseNote] = useState("");
  const [payerId, setPayerId] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [openExpenseMenu, setOpenExpenseMenu] = useState<ExpenseMenuId | null>(null);
  const [showActiveMemberSheet, setShowActiveMemberSheet] = useState(false);
  const [showDeleteLocalDataConfirm, setShowDeleteLocalDataConfirm] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [dataControlMessage, setDataControlMessage] = useState("");
  const [dataControlTone, setDataControlTone] = useState<"success" | "error">("success");
  const [pendingSettlement, setPendingSettlement] = useState<SettlementSuggestion | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [balancePanelWidth, setBalancePanelWidth] = useState(0);
  const moneyFlowProgress = useRef(new Animated.Value(0)).current;
  const density = densityForWidth(viewportWidth);
  const compact = density === "compact";
  const roomy = density === "roomy";

  const selectedMembers = useMemo(
    () => (selectedGroup ? getGroupMembers(data, selectedGroup.id) : []),
    [data, selectedGroup],
  );

  const activity = useMemo(
    () => (selectedGroup ? buildActivity(data, selectedGroup.id) : []),
    [data, selectedGroup],
  );
  const localDataInventory = useMemo(() => getLocalDataInventory(), []);
  const remoteDeletionStatus = useMemo(() => getRemoteDeletionStatus(), []);

  const primarySettlement = selectedSummary?.settlements[0] ?? null;
  const activeMemberIdForGroup = useMemo(
    () => account.profile?.activeMemberByGroupId?.[selectedGroup?.id ?? ""] ?? "",
    [account.profile?.activeMemberByGroupId, selectedGroup?.id],
  );
  const activeGroupMember = useMemo(
    () => findMember(selectedMembers, activeMemberIdForGroup),
    [activeMemberIdForGroup, selectedMembers],
  );
  const displayMember = activeGroupMember ?? selectedMembers[0] ?? null;
  const displayMemberId = displayMember?.id ?? "";
  const activeActorUserId = activeGroupMember?.userId ?? displayMember?.userId ?? data.selectedUserId;
  const personalBalance = useMemo(
    () => selectedSummary?.balances.find((balance) => balance.member.id === displayMemberId),
    [displayMemberId, selectedSummary?.balances],
  );
  const personalBalanceState = personalBalanceLabel(personalBalance);
  const heroAmountText = formatHeroMoney(personalBalanceState.amountCents);
  const measuredAmountArea = balancePanelWidth
    ? balancePanelWidth - (compact ? 154 : roomy ? 164 : 152)
    : compact
      ? 132
      : roomy
        ? 210
        : 178;
  const heroAmountFontSize = clamp(
    Math.floor(measuredAmountArea / Math.max(heroAmountText.length * 0.9, 1)),
    compact ? 18 : 20,
    roomy ? 28 : 25,
  );
  const personalSettlement = useMemo(
    () =>
      selectedSummary?.settlements.find(
        (settlement) =>
          settlement.fromMemberId === displayMemberId || settlement.toMemberId === displayMemberId,
      ) ??
      primarySettlement ??
      null,
    [displayMemberId, primarySettlement, selectedSummary?.settlements],
  );
  const personalSettlementFrom = personalSettlement
    ? findMember(data.members, personalSettlement.fromMemberId)
    : null;
  const personalSettlementTo = personalSettlement
    ? findMember(data.members, personalSettlement.toMemberId)
    : null;
  const personalCue = settlementCue(
    personalSettlement,
    displayMemberId,
    personalSettlementFrom,
    personalSettlementTo,
  );
  const identityLabel = displayMember
    ? `Tú eres ${displayMember.name}`
    : account.profile
      ? `Tú eres ${account.profile.displayName}`
      : "Elige tu persona";
  const identityMeta = account.profile && account.mode === "signed-in" ? "Perfil local" : "Demo local";
  const expenseAmountCents = useMemo(() => parseMoneyInput(expenseAmount), [expenseAmount]);
  const participantShares = useMemo(() => {
    if (!expenseAmountCents || participantIds.length === 0) {
      return [];
    }
    return splitEqual(expenseAmountCents, participantIds);
  }, [expenseAmountCents, participantIds]);
  const selectedCategory = categoryFor(expenseCategoryId);
  const payer = selectedMembers.find((member) => member.id === payerId);
  const participantNames = selectedMembers
    .filter((member) => participantIds.includes(member.id))
    .map((member) => member.name);
  const participantSummary =
    participantNames.length === selectedMembers.length
      ? "Todos los integrantes"
      : participantNames.length
        ? participantNames.join(", ")
        : "Selecciona participantes";
  const toggleExpenseMenu = (menu: ExpenseMenuId) => {
    setOpenExpenseMenu((current) => (current === menu ? null : menu));
  };
  const openIdentity = () => {
    if (account.profile && account.mode === "signed-in" && selectedGroup) {
      openActiveMemberPicker();
      return;
    }
    setActiveTab("account");
  };
  const openTab = (tab: TabId) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    if (!showExpenseForm) {
      return;
    }
    const targetPayerId = activeGroupMember?.id ?? selectedMembers[0]?.id;
    if (payerId && selectedMembers.some((member) => member.id === payerId)) {
      return;
    }
    if (targetPayerId) {
      setPayerId(targetPayerId);
    } else if (payerId) {
      setPayerId("");
    }
  }, [activeGroupMember?.id, payerId, selectedMembers, showExpenseForm]);

  useEffect(() => {
    if (!showExpenseForm) {
      return;
    }
    setParticipantIds((current) => {
      const currentIds = new Set(selectedMembers.map((member) => member.id));
      const filtered = current.filter((id) => currentIds.has(id));
      return filtered.length ? filtered : selectedMembers.map((member) => member.id);
    });
  }, [selectedMembers, showExpenseForm]);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      moneyFlowProgress.stopAnimation();
      moneyFlowProgress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(moneyFlowProgress, {
        duration: 2800,
        easing: Easing.inOut(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [moneyFlowProgress, reduceMotion]);

  const openActiveMemberPicker = () => {
    if (!account.profile || account.mode !== "signed-in" || !selectedGroup) {
      return;
    }
    setShowActiveMemberSheet(true);
  };

  const saveActiveGroupMember = async (memberId: string) => {
    if (!selectedGroup) {
      return;
    }
    const saved = await setActiveGroupMember(selectedGroup.id, memberId);
    if (saved) {
      setShowActiveMemberSheet(false);
    }
  };

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
      actorUserId: activeActorUserId,
      amount: expenseAmount,
      categoryId: expenseCategoryId,
      note: expenseNote,
      participantIds,
      payerId,
      title: expenseTitle,
    });
    if (!added) {
      return;
    }
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseCategoryId(defaultCategory.id);
    setExpenseNote("");
    setParticipantIds([]);
    setOpenExpenseMenu(null);
    setShowExpenseForm(false);
  };

  const chooseExpensePayer = (memberId: string) => {
    setPayerId(memberId);
    setParticipantIds((current) => (current.includes(memberId) ? current : [memberId, ...current]));
    setOpenExpenseMenu(null);
  };

  const toggleExpenseParticipant = (memberId: string) => {
    setParticipantIds((current) => {
      if (current.includes(memberId)) {
        if (memberId === payerId) {
          return current;
        }
        return current.filter((id) => id !== memberId);
      }
      return [...current, memberId];
    });
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
    markSettlementPaid(selectedGroup.id, pendingSettlement, activeActorUserId);
    setPendingSettlement(null);
  };

  const resetLocalDemo = () => {
    setDataControlTone("success");
    resetDemo();
    setDataControlMessage("Demo local restaurado en este dispositivo.");
  };

  const confirmDeleteLocalData = async () => {
    setDataControlMessage("");
    try {
      const result = await deleteLocalUserData();
      const accountCleared = await clearLocalAccount();
      resetDemo();
      setShowDeleteLocalDataConfirm(false);
      setDataControlTone(accountCleared ? "success" : "error");
      setDataControlMessage(
        accountCleared
          ? `Datos locales borrados. ${result.remoteDeletion.reason} Se cargó un demo limpio para seguir probando.`
          : "Se borraron los datos locales, pero no se pudo refrescar el perfil en pantalla. Cierra y abre la app para confirmar.",
      );
    } catch {
      setShowDeleteLocalDataConfirm(false);
      setDataControlTone("error");
      setDataControlMessage("No se pudieron borrar los datos locales. Intenta de nuevo desde Perfil.");
    }
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
                setActiveTab("activity");
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
    const perspective = settlementPerspective(settlement, displayMemberId, from, to);

    return (
      <View key={`${settlement.fromMemberId}-${settlement.toMemberId}`} style={styles.settlementCard}>
        <View style={styles.settlementCompactTop}>
          <View style={styles.settlementRoutePeople}>
            <Avatar color={from?.avatarColor ?? colors.due} label={from?.name ?? "A"} />
            <View style={styles.settlementRouteIcon}>
              <MaterialCommunityIcons color={colors.primaryDark} name="arrow-right" size={16} />
            </View>
            <Avatar color={to?.avatarColor ?? colors.primary} label={to?.name ?? "B"} />
          </View>
          <View style={styles.settlementCompactCopy}>
            <View style={styles.settlementTitleRow}>
              <Text style={styles.settlementTitle}>{perspective.title}</Text>
              <View style={styles.settlementPerspectiveBadge}>
                <Text style={styles.settlementPerspectiveText}>{perspective.badge}</Text>
              </View>
            </View>
            <View style={styles.settlementMetaRow}>
              <View style={styles.settlementAmountInline}>
                <Text style={styles.settlementAmountLabel}>Monto MXN</Text>
                <Text style={styles.settlementAmountText}>
                  {formatMoney(settlement.amountCents)}
                </Text>
              </View>
              <View style={styles.demoChip}>
                <MaterialCommunityIcons color={colors.mutedInk} name="shield-alert-outline" size={14} />
                <Text style={styles.demoOnly}>Sin pagos reales</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.settlementActions}>
          <ActionButton
            icon="check"
            label={perspective.actionLabel}
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
          action={<ActionButton icon="account-group" label="Elegir grupo" onPress={() => openTab("groups")} />}
          body="Crea o selecciona un grupo para ver quién debe pagar."
          icon="scale-balance"
          title="Selecciona un grupo"
        />
      ) : (
        <>
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
                const amountTone = balance.netCents < 0 ? "due" : "success";
                return (
                  <View key={balance.member.id} style={[styles.memberRow, compact && styles.memberRowCompact]}>
                    <Avatar color={balance.member.avatarColor} label={balance.member.name} />
                    <View style={styles.memberBody}>
                      <View style={styles.memberHeaderLine}>
                        <View style={styles.memberIdentity}>
                          <Text style={styles.memberName}>{balance.member.name}</Text>
                          <Pill label={status.label} tone={status.tone} />
                        </View>
                        <View style={[styles.memberAmountRail, compact && styles.memberAmountRailCompact]}>
                          <Text
                            style={[
                              styles.memberAmountText,
                              amountTone === "due" ? styles.memberAmountDue : styles.memberAmountSuccess,
                              compact && styles.memberAmountTextCompact,
                            ]}
                          >
                            {formatMoney(Math.abs(balance.netCents))}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.balanceExplanation}>{describeBalance(balance)}</Text>
                    </View>
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
            action={<ActionButton icon="account-group" label="Elegir grupo" onPress={() => openTab("groups")} />}
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
          groupActivityByDate(activity).map((section) => (
            <View key={section.dateKey} style={styles.activitySection}>
              <Text style={styles.activitySectionLabel}>{section.label}</Text>
              {section.items.map((item) => <ActivityRow item={item} key={item.id} />)}
            </View>
          ))
        )}
      </Section>
    </View>
  );

  const renderAccount = () => (
    <View style={styles.tabContent}>
      {selectedGroup ? (
        <Section title="Grupo activo">
          <View style={styles.groupContextPanel}>
            <View style={styles.groupContextTop}>
              <GroupObject group={selectedGroup} />
              <View style={styles.groupContextCopy}>
                <Text style={styles.groupContextName}>{selectedGroup.name}</Text>
                <Text style={styles.groupContextMeta}>
                  {selectedMembers.length} integrantes · Perfil usado para este grupo
                </Text>
              </View>
              <ActionButton icon="swap-horizontal" label="Cambiar" onPress={() => openTab("groups")} tone="ghost" />
            </View>
            <View style={styles.groupContextPeople}>
              {selectedMembers.map((member) => (
                <View
                  key={member.id}
                  style={[
                    styles.groupContextPerson,
                    activeGroupMember?.id === member.id && styles.groupContextPersonActive,
                  ]}
                >
                  <Avatar color={member.avatarColor} label={member.name} />
                  <Text style={styles.groupContextPersonName}>{member.name}</Text>
                  {activeGroupMember?.id === member.id ? <Pill label="Tú" tone="success" /> : null}
                </View>
              ))}
            </View>
          </View>
        </Section>
      ) : (
        <EmptyState
          action={<ActionButton icon="account-group" label="Elegir grupo" onPress={() => openTab("groups")} />}
          body="Primero elige un grupo. Después este perfil se usará dentro de ese grupo."
          icon="account-circle"
          title="Perfil sin grupo"
        />
      )}
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
            {renderLocalDataControls()}
            {selectedGroup ? (
              <View style={styles.accountMemberSection}>
                <Text style={styles.fieldLabel}>¿Quién eres en este grupo?</Text>
                <Text style={styles.accountSectionText}>
                  {activeGroupMember
                    ? `${activeGroupMember.name} · Puedes cambiarlo para registrar gastos.`
                    : "Selecciona tu persona en el grupo para registrar gastos con tu identidad."}
                </Text>
                <ActionButton
                  disabled={!selectedGroup || selectedMembers.length === 0}
                  icon="account-switch"
                  label={activeGroupMember ? "Cambiar integrante" : "Elegir integrante"}
                  onPress={openActiveMemberPicker}
                />
              </View>
            ) : null}
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
            {renderLocalDataControls()}
          </View>
        )}
      </Section>
    </View>
  );

  const renderLocalDataControls = () => (
    <View style={styles.dataControls}>
      <View style={styles.sheetSectionHeader}>
        <View style={styles.dataControlsTitleWrap}>
          <Text style={styles.fieldLabel}>Datos en este dispositivo</Text>
          <Text style={styles.accountSectionText}>
            Control local para pruebas. No hay backend ni eliminación remota configurada.
          </Text>
        </View>
        <Pill label="Local" tone="neutral" />
      </View>
      {dataControlMessage ? (
        <View style={[styles.dataStatus, dataControlTone === "error" && styles.dataStatusError]}>
          <MaterialCommunityIcons
            color={dataControlTone === "error" ? colors.due : colors.primary}
            name={dataControlTone === "error" ? "alert-circle-outline" : "check-circle-outline"}
            size={17}
          />
          <Text style={[styles.dataStatusText, dataControlTone === "error" && styles.dataStatusTextError]}>
            {dataControlMessage}
          </Text>
        </View>
      ) : null}
      <View style={styles.dataInventory}>
        {localDataInventory.map((target) => (
          <View key={target.id} style={styles.dataInventoryRow}>
            <MaterialCommunityIcons
              color={target.containsUserInput ? colors.primaryDark : colors.mutedInk}
              name={target.containsUserInput ? "database-lock-outline" : "database-outline"}
              size={17}
            />
            <Text style={styles.dataInventoryText}>{target.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.dataRemoteNote}>
        <MaterialCommunityIcons color={colors.mutedInk} name="cloud-off-outline" size={17} />
        <Text style={styles.dataRemoteText}>{remoteDeletionStatus.reason}</Text>
      </View>
      <View style={styles.dataActions}>
        <ActionButton icon="restore" label="Reiniciar demo" onPress={resetLocalDemo} tone="secondary" />
        <ActionButton
          icon="delete-outline"
          label="Borrar datos locales"
          onPress={() => {
            setDataControlMessage("");
            setShowDeleteLocalDataConfirm(true);
          }}
          tone="danger"
        />
      </View>
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

  const renderActiveGroupMemberSheet = () => (
    <Modal
      animationType="slide"
      onRequestClose={() => setShowActiveMemberSheet(false)}
      transparent
      visible={showActiveMemberSheet}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Selecciona tu integrante</Text>
              <Text style={styles.sheetSubtitle}>Vincula tu sesión a este grupo.</Text>
            </View>
            <ActionButton icon="close" label="Cerrar" onPress={() => setShowActiveMemberSheet(false)} tone="ghost" />
          </View>
          <Text style={styles.accountSectionText}>Con esto, al abrir un gasto empezará con tu integrante.</Text>
          <View style={styles.payerOptions}>
            {selectedMembers.map((member) => (
              <Pressable
                accessibilityHint="Selecciona quién eres en este grupo."
                accessibilityLabel={`Eres ${member.name}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: activeGroupMember?.id === member.id }}
                hitSlop={4}
                key={member.id}
                onPress={() => {
                  void saveActiveGroupMember(member.id);
                }}
                style={[styles.payerOption, activeGroupMember?.id === member.id && styles.payerOptionActive]}
              >
                <Avatar color={member.avatarColor} label={member.name} />
                <Text style={styles.payerName}>{member.name}</Text>
                {activeGroupMember?.id === member.id ? (
                  <MaterialCommunityIcons color={colors.primary} name="check-circle" size={18} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderExpenseSheet = () => (
    <Modal
      animationType="slide"
      onRequestClose={() => {
        setOpenExpenseMenu(null);
        setShowExpenseForm(false);
      }}
      transparent
      visible={showExpenseForm}
    >
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Agregar gasto</Text>
              <Text style={styles.sheetSubtitle}>Quién pagó, quién participa y cuánto toca.</Text>
            </View>
            <ActionButton
              icon="close"
              label="Cerrar"
              onPress={() => {
                setOpenExpenseMenu(null);
                setShowExpenseForm(false);
              }}
              tone="ghost"
            />
          </View>
          <View style={styles.expenseIdentityBand}>
            <Avatar color={displayMember?.avatarColor ?? colors.primary} label={displayMember?.name ?? "Yo"} />
            <View style={styles.expenseIdentityCopy}>
              <Text style={styles.expenseIdentityLabel}>{identityLabel}</Text>
              <Text style={styles.expenseIdentityMeta}>
                Registro local en {selectedGroup?.name ?? "tu grupo"} · MXN
              </Text>
            </View>
            <View style={styles.sheetTrustChip}>
              <MaterialCommunityIcons color={colors.mutedInk} name="shield-check-outline" size={14} />
              <Text style={styles.sheetTrustText}>Sin pagos reales</Text>
            </View>
          </View>
          {error ? <Text style={styles.formError}>{error}</Text> : null}
          <View style={styles.amountFirstPanel}>
            <View style={styles.amountFirstTop}>
              <CategoryObject categoryId={expenseCategoryId} />
              <View style={styles.amountFirstCopy}>
                <Text style={styles.fieldLabel}>Monto MXN</Text>
                <TextInput
                  accessibilityLabel="Monto MXN"
                  keyboardType="decimal-pad"
                  onChangeText={setExpenseAmount}
                  placeholder="850.00"
                  placeholderTextColor={colors.mutedInk}
                  style={styles.amountInput}
                  value={expenseAmount}
                />
              </View>
            </View>
            <Field
              label="Concepto"
              onChangeText={setExpenseTitle}
              placeholder="Ej. Tacos después del cine"
              value={expenseTitle}
            />
          </View>
          <View style={styles.sheetSectionHeader}>
            <View>
              <Text style={styles.fieldLabel}>Categoría</Text>
              <Text style={styles.accountSectionText}>Más opciones, sin llenar la pantalla.</Text>
            </View>
          </View>
          <SelectTrigger
            icon={<CategoryObject categoryId={expenseCategoryId} size="small" />}
            label="Categoría"
            meta={`${expenseCategories.length} categorías disponibles`}
            onPress={() => toggleExpenseMenu("category")}
            open={openExpenseMenu === "category"}
            value={selectedCategory.label}
          />
          <AnimatedDropdown open={openExpenseMenu === "category"}>
            {expenseCategories.map((category) => {
              const selected = category.id === expenseCategoryId;
              return (
                <Pressable
                  accessibilityLabel={`Categoría ${category.label}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  hitSlop={4}
                  key={category.id}
                  onPress={() => {
                    setExpenseCategoryId(category.id);
                    setOpenExpenseMenu(null);
                  }}
                  style={({ pressed }) => [
                    styles.dropdownRow,
                    selected && styles.dropdownRowActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <CategoryObject categoryId={category.id} size="small" />
                  <View style={styles.dropdownRowCopy}>
                    <Text style={styles.dropdownRowTitle}>{category.label}</Text>
                    <Text style={styles.dropdownRowMeta}>Para ordenar el historial</Text>
                  </View>
                  {selected ? (
                    <MaterialCommunityIcons color={colors.primary} name="check-circle" size={20} />
                  ) : null}
                </Pressable>
              );
            })}
          </AnimatedDropdown>
          <Field
            label="Nota"
            onChangeText={setExpenseNote}
            placeholder="Opcional"
            value={expenseNote}
          />
          <View style={styles.sheetSectionHeader}>
            <View>
              <Text style={styles.fieldLabel}>¿Quién pagó?</Text>
              <Text style={styles.accountSectionText}>
                {activeGroupMember
                  ? `Tu sesión empieza como ${activeGroupMember.name}.`
                  : "Selecciona un integrante para registrar este gasto."}
              </Text>
            </View>
            {payerId ? <Pill label="Pagó" tone="success" /> : null}
          </View>
          <SelectTrigger
            icon={payer ? <Avatar color={payer.avatarColor} label={payer.name} /> : undefined}
            label="Pagó"
            meta={activeGroupMember ? `Tu sesión empieza como ${activeGroupMember.name}` : "Elige una persona"}
            onPress={() => toggleExpenseMenu("payer")}
            open={openExpenseMenu === "payer"}
            value={payer?.name ?? "Selecciona quién pagó"}
          />
          <AnimatedDropdown open={openExpenseMenu === "payer"}>
            {selectedMembers.map((member) => (
              <Pressable
                accessibilityHint="Selecciona quién pagó este gasto."
                accessibilityLabel={`Pagó ${member.name}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: payerId === member.id }}
                hitSlop={4}
                key={member.id}
                onPress={() => chooseExpensePayer(member.id)}
                style={({ pressed }) => [
                  styles.dropdownRow,
                  payerId === member.id && styles.dropdownRowActive,
                  pressed && styles.pressed,
                ]}
              >
                <Avatar color={member.avatarColor} label={member.name} />
                <View style={styles.dropdownRowCopy}>
                  <Text style={styles.dropdownRowTitle}>{member.name}</Text>
                  <Text style={styles.dropdownRowMeta}>
                    {activeGroupMember?.id === member.id ? "Tu integrante activo" : "Integrante del grupo"}
                  </Text>
                </View>
                {payerId === member.id ? (
                  <MaterialCommunityIcons color={colors.primary} name="check-circle" size={20} />
                ) : null}
              </Pressable>
            ))}
          </AnimatedDropdown>
          <View style={styles.sheetSectionHeader}>
            <View>
              <Text style={styles.fieldLabel}>Quién participa</Text>
              <Text style={styles.accountSectionText}>Dividido en partes iguales.</Text>
            </View>
            <Pill label={`${participantIds.length}/${selectedMembers.length}`} tone="neutral" />
          </View>
          <SelectTrigger
            label="Participan"
            meta={`${participantIds.length} de ${selectedMembers.length} integrantes`}
            onPress={() => toggleExpenseMenu("participants")}
            open={openExpenseMenu === "participants"}
            value={participantSummary}
          />
          <AnimatedDropdown open={openExpenseMenu === "participants"}>
            {selectedMembers.map((member) => {
              const selected = participantIds.includes(member.id);
              const share = participantShares.find((item) => item.memberId === member.id);
              return (
                <Pressable
                  accessibilityHint="Incluye o quita a este integrante del gasto."
                  accessibilityLabel={`${selected ? "Incluido" : "No incluido"} ${member.name}${
                    payerId === member.id ? ", pagó el gasto" : ""
                  }`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled: payerId === member.id }}
                  hitSlop={4}
                  key={member.id}
                  onPress={() => toggleExpenseParticipant(member.id)}
                  style={({ pressed }) => [
                    styles.dropdownRow,
                    selected && styles.dropdownRowActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Avatar color={member.avatarColor} label={member.name} />
                  <View style={styles.dropdownRowCopy}>
                    <Text style={styles.dropdownRowTitle}>{member.name}</Text>
                    <Text style={styles.dropdownRowMeta}>
                      {payerId === member.id
                        ? "Pagó · incluido"
                        : selected && share
                          ? formatMoney(share.amountCents)
                          : selected
                            ? "Incluido"
                          : "No participa"}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    color={selected ? colors.primary : colors.mutedInk}
                    name={selected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                    size={20}
                  />
                </Pressable>
              );
            })}
          </AnimatedDropdown>
          <View style={styles.splitPreview}>
            <View style={styles.splitPreviewIcon}>
              <MaterialCommunityIcons color={colors.primaryDark} name="scale-balance" size={18} />
            </View>
            <View style={styles.splitPreviewCopy}>
              <Text style={styles.splitPreviewTitle}>Resumen de división</Text>
              <Text style={styles.splitPreviewText}>
                {participantShares.length
                  ? `${participantShares.length} participan · ${formatMoney(expenseAmountCents ?? 0)} dividido en MXN`
                  : "Elige participantes y monto para ver cuánto toca."}
              </Text>
            </View>
          </View>
          <ActionButton
            disabled={
              selectedMembers.length === 0 ||
              !expenseTitle.trim() ||
              !expenseAmount.trim() ||
              !payerId ||
              participantIds.length === 0 ||
              !participantIds.includes(payerId)
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
    const perspective = pendingSettlement
      ? settlementPerspective(pendingSettlement, displayMemberId, from, to)
      : null;

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
            <Text style={styles.confirmTitle}>{perspective?.confirmTitle ?? "Confirmar arreglo local"}</Text>
            <Text style={styles.confirmBody}>
              {perspective?.confirmBody ??
                "Esto solo marca el arreglo como pagado en Cuentas Claras. No mueve dinero ni inicia pagos reales."}
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
              <ActionButton
                icon="check"
                label={perspective?.actionLabel ?? "Registrar local"}
                onPress={confirmSettlementPaid}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDeleteLocalDataConfirmation = () => (
    <Modal
      animationType="fade"
      onRequestClose={() => setShowDeleteLocalDataConfirm(false)}
      transparent
      visible={showDeleteLocalDataConfirm}
    >
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIconDanger}>
            <MaterialCommunityIcons color={colors.due} name="delete-alert-outline" size={19} />
          </View>
          <Text style={styles.confirmTitle}>Borrar datos locales</Text>
          <Text style={styles.confirmBody}>
            Esto borra grupos, gastos, actividad, perfil demo y cola local en este dispositivo. No borra datos remotos porque no existe backend de producción.
          </Text>
          <View style={styles.demoChipStrong}>
            <MaterialCommunityIcons color={colors.mutedInk} name="cloud-off-outline" size={14} />
            <Text style={styles.demoOnlyStrong}>Eliminación local solamente</Text>
          </View>
          <View style={styles.sheetActions}>
            <ActionButton
              icon="close"
              label="Cancelar"
              onPress={() => setShowDeleteLocalDataConfirm(false)}
              tone="ghost"
            />
            <ActionButton icon="delete" label="Borrar local" onPress={confirmDeleteLocalData} tone="danger" />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            compact && styles.contentCompact,
            roomy && styles.contentRoomy,
          ]}
        >
          <View style={styles.appBar}>
            <Text style={[styles.appTitle, compact && styles.appTitleCompact]}>Cuentas Claras</Text>
            <View style={styles.appActions}>
              <Pressable
                accessibilityLabel="Ver actividad"
                accessibilityRole="button"
                hitSlop={4}
                onPress={() => openTab("activity")}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons color={colors.primaryDark} name="bell-outline" size={22} />
              </Pressable>
              <Pressable
                accessibilityLabel="Abrir perfil"
                accessibilityRole="button"
                hitSlop={4}
                onPress={() => openTab("account")}
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

          {activeTab !== "groups" && selectedGroup && selectedSummary ? (
            <View style={[styles.heroCard, compact && styles.heroCardCompact, roomy && styles.heroCardRoomy]}>
              <View style={styles.heroTop}>
                <Pressable
                  accessibilityHint="Abre perfil o cambia tu integrante del grupo."
                  accessibilityLabel={identityLabel}
                  accessibilityRole="button"
                  hitSlop={4}
                  onPress={openIdentity}
                  style={({ pressed }) => [styles.identityPill, pressed && styles.pressed]}
                >
                  <Avatar color={displayMember?.avatarColor ?? colors.primary} label={displayMember?.name ?? "Yo"} />
                  <View style={styles.identityCopy}>
                    <Text numberOfLines={1} style={styles.identityLabel}>{identityLabel}</Text>
                    <Text numberOfLines={1} style={styles.identityMeta}>{identityMeta}</Text>
                  </View>
                  <MaterialCommunityIcons color={colors.primaryDark} name="chevron-down" size={18} />
                </Pressable>
                <View style={styles.noPaymentChip}>
                  <MaterialCommunityIcons color={colors.mutedInk} name="shield-check-outline" size={14} />
                  <Text style={styles.noPaymentText}>Sin pagos reales</Text>
                </View>
              </View>

              <View style={styles.heroGroupLine}>
                <GroupObject group={selectedGroup} size="large" />
                <View style={styles.heroGroupCopy}>
                  <Text numberOfLines={1} style={styles.heroGroupName}>{selectedGroup.name}</Text>
                  <Text style={styles.heroGroupMeta}>MXN · {selectedMembers.length} integrantes</Text>
                </View>
                <AvatarStack members={selectedMembers} limit={3} />
              </View>

              <View
                onLayout={(event) => {
                  const nextWidth = Math.round(event.nativeEvent.layout.width);
                  setBalancePanelWidth((current) => (current === nextWidth ? current : nextWidth));
                }}
                style={[styles.myBalancePanel, compact && styles.myBalancePanelCompact, roomy && styles.myBalancePanelRoomy]}
              >
                <View style={styles.myBalanceIcon}>
                  <MaterialCommunityIcons
                    color={personalBalanceState.tone === "due" ? colors.terracotta : colors.primaryDark}
                    name={personalBalanceState.tone === "due" ? "wallet-outline" : "cash-multiple"}
                    size={20}
                  />
                </View>
                <View style={styles.myBalanceCopy}>
                  <Text style={styles.myBalanceKicker}>Tu balance</Text>
                  <Text style={[styles.myBalanceState, personalBalanceState.tone === "due" && styles.myBalanceDue]}>
                    {personalBalanceState.label}
                  </Text>
                </View>
                <View style={styles.myBalanceAmountWrap}>
                  <Text style={styles.myBalanceCurrency}>MXN</Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.myBalanceAmount,
                      { fontSize: heroAmountFontSize, lineHeight: Math.ceil(heroAmountFontSize * 1.18) },
                      personalBalanceState.tone === "due" && styles.myBalanceAmountDue,
                    ]}
                  >
                    {heroAmountText}
                  </Text>
                </View>
              </View>

              {personalSettlement ? (
                <MoneyFlowFigure
                  amountCents={personalSettlement.amountCents}
                  from={personalSettlementFrom}
                  progress={moneyFlowProgress}
                  reduceMotion={reduceMotion}
                  to={personalSettlementTo}
                />
              ) : (
                <View accessibilityLabel="Todo en paz por ahora. Registro local." style={styles.moneyFlowFigure}>
                  <View style={styles.calmFigure}>
                    <View style={styles.calmFigureIcon}>
                      <MaterialCommunityIcons color={colors.primaryDark} name="check-decagram-outline" size={22} />
                    </View>
                    <View style={styles.calmFigureCopy}>
                      <Text style={styles.moneyFlowAmount}>Todo en paz</Text>
                      <Text style={styles.calmFigureText}>Sin pagos pendientes en este grupo.</Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.heroCue}>
                <View style={styles.heroCueIcon}>
                  <MaterialCommunityIcons color={colors.accentBlue} name="lightbulb-on-outline" size={17} />
                </View>
                <View style={styles.heroCueCopy}>
                  <Text style={styles.heroCueLabel}>Siguiente paso</Text>
                  <Text numberOfLines={2} style={styles.heroCueText}>{personalCue}</Text>
                </View>
                {personalSettlement ? (
                  <Pressable
                    accessibilityLabel="Liquidar arreglo local"
                    accessibilityRole="button"
                    hitSlop={4}
                    onPress={() => setPendingSettlement(personalSettlement)}
                    style={({ pressed }) => [styles.externalPayAction, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons color={colors.primaryDark} name="check" size={14} />
                    <Text style={styles.externalPayActionText}>Liquidar</Text>
                  </Pressable>
                ) : null}
              </View>

              <ActionButton
                disabled={selectedMembers.length === 0}
                icon="plus"
                label="Agregar gasto"
                onPress={() => setShowExpenseForm(true)}
              />
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
                onPress={() => openTab(tab.id)}
                style={[styles.navItem, active && styles.navItemActive]}
              >
                <MaterialCommunityIcons
                  color={colors.primaryDark}
                  name={tab.icon}
                  size={20}
                />
                <Text style={[styles.navLabel, compact && styles.navLabelCompact, active && styles.navLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {renderMemberSheet()}
        {renderExpenseSheet()}
        {renderActiveGroupMemberSheet()}
        {renderSettlementConfirmation()}
        {renderDeleteLocalDataConfirmation()}
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
  accountMemberSection: {
    gap: spacing.sm,
  },
  accountSectionText: {
    color: colors.mutedInk,
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
  appTitleCompact: {
    fontSize: 23,
    lineHeight: 29,
  },
  amountFirstCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  amountFirstPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  amountFirstTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  amountInput: {
    color: colors.ink,
    fontSize: 30,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    letterSpacing: 0,
    minHeight: 42,
    padding: 0,
  },
  avatarStack: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
  },
  avatarStackItem: {
    borderColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2,
  },
  avatarStackMore: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  avatarStackMoreText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "800",
  },
  avatarStackOverlap: {
    marginLeft: -10,
  },
  calmFigure: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  calmFigureCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  calmFigureIcon: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  calmFigureText: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "600",
    lineHeight: 15,
  },
  externalPayAction: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: radius.sm,
    flexShrink: 0,
    flexDirection: "row",
    gap: spacing.xs,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  externalPayActionText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: "transparent",
    borderRadius: radius.md,
    borderWidth: 0,
    gap: spacing.sm,
    padding: spacing.md,
  },
  heroCardCompact: {
    gap: spacing.xs,
    padding: spacing.sm,
  },
  heroCardRoomy: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  heroCue: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: radius.md,
    borderWidth: 0,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  heroCueCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  heroCueIcon: {
    alignItems: "center",
    backgroundColor: colors.blueWash,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  heroCueLabel: {
    color: colors.accentBlue,
    fontSize: typography.micro,
    fontWeight: "700",
  },
  heroCueText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 18,
  },
  heroGroupCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  heroGroupLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 46,
  },
  heroGroupMeta: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "500",
  },
  heroGroupName: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  heroTop: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: spacing.sm,
  },
  identityCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  identityLabel: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
  },
  identityMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "600",
  },
  identityPill: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  moneyFlowAmount: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    textAlign: "center",
  },
  moneyFlowDot: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    height: MONEY_FLOW_DOT_SIZE,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    top: -9,
    width: MONEY_FLOW_DOT_SIZE,
  },
  moneyFlowDotStatic: {
    left: (MONEY_FLOW_TRACK_WIDTH - MONEY_FLOW_DOT_SIZE) / 2,
  },
  moneyFlowFigure: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  moneyFlowName: {
    color: colors.ink,
    fontSize: typography.micro,
    fontWeight: "700",
    maxWidth: 62,
    textAlign: "center",
  },
  moneyFlowPeople: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  moneyFlowPerson: {
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 50,
  },
  moneyFlowTrack: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 6,
    overflow: "visible",
    width: MONEY_FLOW_TRACK_WIDTH,
  },
  moneyFlowTrackWrap: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    minWidth: 118,
  },
  myBalanceAmount: {
    color: colors.primary,
    fontSize: 25,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 30,
    textAlign: "right",
  },
  myBalanceAmountDue: {
    color: colors.due,
  },
  myBalanceAmountWrap: {
    alignItems: "flex-end",
    flex: 1,
    minWidth: 0,
  },
  myBalanceCopy: {
    flexShrink: 0,
    gap: 1,
    width: 68,
  },
  myBalanceCurrency: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
  },
  myBalanceDue: {
    color: colors.due,
  },
  myBalanceIcon: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  myBalanceKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "600",
  },
  myBalancePanel: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderColor: "transparent",
    borderRadius: radius.md,
    borderWidth: 0,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  myBalancePanelCompact: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  myBalancePanelRoomy: {
    minHeight: 76,
    paddingHorizontal: spacing.lg,
  },
  myBalanceState: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "800",
  },
  noPaymentChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.warmWash,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  noPaymentText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "700",
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
    fontSize: typography.small,
    fontWeight: "500",
    lineHeight: 19,
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
  activityActor: {
    color: colors.mutedInk,
    flexShrink: 1,
    fontSize: typography.micro,
    fontWeight: "600",
  },
  activityIcon: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  activityRail: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    width: 12,
  },
  activityRailDot: {
    backgroundColor: colors.mutedInk,
    borderColor: colors.surface,
    borderRadius: 5,
    borderWidth: 2,
    height: 10,
    width: 10,
    zIndex: 1,
  },
  activityRailDotSettlement: {
    backgroundColor: colors.primary,
  },
  activityMember: {
    backgroundColor: colors.blueWash,
  },
  activityMetaLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
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
  activitySection: {
    gap: spacing.sm,
  },
  activitySectionLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    marginTop: spacing.xs,
    textTransform: "capitalize",
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
  contentCompact: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  contentRoomy: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  categoryChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.surfaceTinted,
    borderColor: colors.primary,
  },
  categoryChipIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  categoryChipText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryObject: {
    alignItems: "center",
    borderRadius: 18,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  categoryObjectSmall: {
    borderRadius: 16,
    height: 32,
    width: 32,
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
  dropdownPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
    overflow: "hidden",
    padding: spacing.xs,
  },
  dropdownRow: {
    alignItems: "center",
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dropdownRowActive: {
    backgroundColor: colors.surfaceTinted,
  },
  dropdownRowCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  dropdownRowMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "500",
    lineHeight: 15,
  },
  dropdownRowTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "700",
    lineHeight: 19,
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
  expenseIdentityBand: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    padding: spacing.sm,
  },
  expenseIdentityCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  expenseIdentityLabel: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
  },
  expenseIdentityMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "500",
    lineHeight: 15,
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
  objectToneBlue: {
    backgroundColor: colors.blueWash,
  },
  objectToneDue: {
    backgroundColor: colors.dueWash,
  },
  objectTonePrimary: {
    backgroundColor: colors.successWash,
  },
  objectToneWarm: {
    backgroundColor: colors.warmWash,
  },
  dataActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dataControls: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  dataControlsTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  dataInventory: {
    gap: spacing.sm,
  },
  dataInventoryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  dataInventoryText: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "500",
    lineHeight: 18,
  },
  dataRemoteNote: {
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  dataRemoteText: {
    color: colors.mutedInk,
    flex: 1,
    fontSize: typography.micro,
    fontWeight: "500",
    lineHeight: 16,
  },
  dataStatus: {
    alignItems: "flex-start",
    backgroundColor: colors.successWash,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  dataStatusError: {
    backgroundColor: colors.dueWash,
  },
  dataStatusText: {
    color: colors.primaryDark,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 18,
  },
  dataStatusTextError: {
    color: colors.due,
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
  groupObject: {
    alignItems: "center",
    borderRadius: 18,
    flexShrink: 0,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  groupObjectLarge: {
    borderRadius: 20,
    height: 44,
    width: 44,
  },
  groupPeopleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 38,
  },
  groupPeopleText: {
    color: colors.mutedInk,
    flex: 1,
    fontSize: typography.micro,
    fontWeight: "600",
    lineHeight: 15,
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
  groupContextCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  groupContextMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "600",
    lineHeight: 15,
  },
  groupContextName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "700",
  },
  groupContextPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  groupContextPeople: {
    gap: spacing.xs,
  },
  groupContextPerson: {
    alignItems: "center",
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  groupContextPersonActive: {
    backgroundColor: colors.surfaceTinted,
  },
  groupContextPersonName: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "600",
  },
  groupContextTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
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
  memberAmountDue: {
    color: colors.due,
  },
  memberAmountRail: {
    alignItems: "flex-end",
    flexShrink: 0,
    justifyContent: "center",
    minWidth: 136,
  },
  memberAmountRailCompact: {
    minWidth: 112,
  },
  memberAmountSuccess: {
    color: colors.primary,
  },
  memberAmountText: {
    fontSize: typography.body,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 24,
    textAlign: "right",
  },
  memberAmountTextCompact: {
    fontSize: typography.small,
    lineHeight: 20,
  },
  memberBody: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  memberCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  memberHeaderLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minWidth: 0,
  },
  memberIdentity: {
    alignItems: "flex-start",
    flexShrink: 1,
    gap: spacing.xs,
    minWidth: 0,
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
  memberRowCompact: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
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
  navLabelCompact: {
    fontSize: 11,
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
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: radius.md,
    borderWidth: 0,
    flex: 1,
    flexDirection: "column",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 62,
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
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
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
    backgroundColor: colors.surfaceTinted,
    borderColor: "transparent",
  },
  quickActionRail: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: radius.md,
    borderWidth: 0,
    flexDirection: "row",
    gap: 0,
    padding: spacing.xs,
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
  confirmIconDanger: {
    alignItems: "center",
    backgroundColor: colors.dueWash,
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
  selectTrigger: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectTriggerCompact: {
    minHeight: 52,
    paddingHorizontal: spacing.sm,
  },
  selectTriggerCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  selectTriggerIcon: {
    flexShrink: 0,
  },
  selectTriggerLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 15,
  },
  selectTriggerLabelCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  selectTriggerMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "500",
    lineHeight: 15,
  },
  selectTriggerOpen: {
    backgroundColor: colors.surfaceTinted,
    borderColor: colors.primary,
  },
  selectTriggerValue: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "800",
    lineHeight: 19,
  },
  selectTriggerValueCompact: {
    fontSize: typography.small,
    lineHeight: 17,
  },
  settlementCard: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderRadius: 0,
    borderBottomWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: 0,
    paddingVertical: spacing.md,
  },
  settlementActions: {
    alignItems: "flex-start",
  },
  settlementAmountGroup: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 2,
    minWidth: 104,
  },
  settlementAmountInline: {
    gap: 2,
  },
  settlementAmountLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 14,
    textAlign: "right",
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
  settlementPeople: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  settlementMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  settlementPerspectiveBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceTinted,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  settlementPerspectiveText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "700",
  },
  settlementRouteIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceTinted,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  settlementRoutePeople: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: spacing.xs,
  },
  settlementTitle: {
    color: colors.ink,
    flexShrink: 1,
    fontSize: typography.body,
    fontWeight: "700",
    lineHeight: 19,
  },
  settlementTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
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
  participantCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  participantOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    minWidth: 148,
    padding: spacing.sm,
  },
  participantShare: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "600",
  },
  peopleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  personOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 50,
    minWidth: 148,
    padding: spacing.sm,
  },
  personOptionActive: {
    backgroundColor: colors.surfaceTinted,
    borderColor: colors.primary,
    borderWidth: 2,
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
  sheetSectionHeader: {
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
  sheetTrustChip: {
    alignItems: "center",
    backgroundColor: colors.warmWash,
    borderRadius: radius.sm,
    flexDirection: "row",
    flexShrink: 0,
    gap: spacing.xs,
    minHeight: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sheetTrustText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "700",
  },
  splitPreview: {
    alignItems: "center",
    backgroundColor: colors.surfaceTinted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    padding: spacing.md,
  },
  splitPreviewCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  splitPreviewIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  splitPreviewText: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "500",
    lineHeight: 18,
  },
  splitPreviewTitle: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
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
