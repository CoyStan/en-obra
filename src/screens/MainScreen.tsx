import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  type DimensionValue,
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
import { formatMoney, parseMoneyInput } from "../domain/money";
import { resolveSplit } from "../domain/splits";
import type {
  ActivityItem,
  AppData,
  Expense,
  Group,
  Member,
  MemberBalance,
  SettlementSuggestion,
  SplitInput,
} from "../domain/types";
import { useAppData } from "../state/useAppData";
import { deleteLocalUserData, getLocalDataInventory, getRemoteDeletionStatus } from "../security/dataDeletion";
import { colors, radius, spacing, typography } from "../theme/theme";
import { ActionButton, Amount, Avatar, EmptyState, Pill, Section } from "../components/ui";
import {
  AppTopBar,
  AuditRow,
  BottomTabBar,
  Button as ReusableButton,
  ComposerSaveDock,
  ComposerSection,
  FeedbackToast,
  HomeMoneyInstrument,
  LocalTrustStrip,
  MoneyInput,
  NoteField,
  PersonRow,
  SelectOptionRow,
  SelectPanel,
  TextField,
  WorkspaceContextBar,
} from "../components/reusables";

type TabId = "groups" | "home" | "balance" | "activity" | "account";
type ExpenseMenuId = "category" | "payer" | "participants";
type ExpenseSplitMode = "equal" | "exact" | "shares";

const MONEY_FLOW_TRACK_WIDTH = 120;
const MONEY_FLOW_DOT_SIZE = 24;
const MONEY_FLOW_TRAVEL = MONEY_FLOW_TRACK_WIDTH - MONEY_FLOW_DOT_SIZE;

const tabs: { id: TabId; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; groupScoped?: boolean }[] = [
  { id: "groups", label: "Grupos", icon: "account-switch" },
  { id: "home", label: "Inicio", icon: "view-dashboard-outline", groupScoped: true },
  { id: "activity", label: "Actividad", icon: "history", groupScoped: true },
  { id: "balance", label: "Balance", icon: "scale-balance", groupScoped: true },
  { id: "account", label: "Perfil", icon: "account-circle", groupScoped: true },
];

const firstGroupWorkspaceTab: TabId = "home";

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

const splitModes: { id: ExpenseSplitMode; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: "equal", label: "Igual", icon: "equal" },
  { id: "exact", label: "Exacto", icon: "calculator-variant-outline" },
  { id: "shares", label: "Partes", icon: "chart-pie" },
];

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
      ? `${preview.creditor.member.name} recibe · ${preview.debtor.member.name} debe`
      : "Todo en paz por ahora";

  return (
    <Pressable
      accessibilityHint="Selecciona este grupo y abre su inicio."
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
          <View style={styles.groupNameLine}>
            <Text numberOfLines={1} style={styles.groupName}>{group.name}</Text>
            {isSelected ? <Pill label="Activo" tone="success" /> : null}
          </View>
          <Text style={styles.groupDescription} numberOfLines={1}>
            {group.description || "Grupo local"}
          </Text>
        </View>
        <View style={styles.groupEnterIcon}>
          <MaterialCommunityIcons color={colors.primaryDark} name="chevron-right" size={19} />
        </View>
      </View>
      <View style={styles.groupPeopleRow}>
        <View style={styles.groupRoutePreview}>
          <MaterialCommunityIcons color={summary.openBalanceCents ? colors.due : colors.primary} name="swap-horizontal" size={16} />
          <Text numberOfLines={2} style={styles.groupPreviewText}>{previewCopy}</Text>
        </View>
        <View style={styles.groupCardAmountRail}>
          <Text style={styles.groupOpenLabel}>Abierto</Text>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            numberOfLines={1}
            style={[styles.groupCardAmount, summary.openBalanceCents ? styles.groupCardAmountDue : styles.groupCardAmountOk]}
          >
            MXN {formatHeroMoney(summary.openBalanceCents)}
          </Text>
        </View>
      </View>
      <View style={styles.groupWorkspaceFooter}>
        <AvatarStack members={members} />
        <Text style={styles.groupWorkspaceFooterText}>{members.length} integrantes · toca para abrir Inicio</Text>
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

function ActivityRow({
  item,
  onDeleteExpense,
  onEditExpense,
}: {
  item: ActivityItem;
  onDeleteExpense?: (expenseId: string) => void;
  onEditExpense?: (expenseId: string) => void;
}) {
  const hasAmount = item.amountCents > 0;
  const isSettlement = item.type === "settlement";
  const editableExpenseId = item.type === "expense" ? item.entityId ?? item.id : "";
  const metaParts = [
    item.label,
    item.actorName,
    item.subtitle,
    isSettlement ? "Sin pagos reales · acuerdo guardado" : null,
    formatDate(item.createdAt),
  ].filter(Boolean);
  return (
    <View style={styles.activityRowShell}>
      <AuditRow
        amountCents={hasAmount ? item.amountCents : undefined}
        amountTone={isSettlement ? "success" : "neutral"}
        icon={item.type === "expense" ? activityIconForTitle(item.title) : activityIcon(item)}
        meta={metaParts.join(" · ")}
        testID={`activity-row-${item.id}`}
        title={item.title}
      />
      {editableExpenseId && onDeleteExpense && onEditExpense ? (
        <View style={styles.expenseAuditActions}>
          <Pressable
            accessibilityLabel={`Editar ${item.title}`}
            accessibilityRole="button"
            hitSlop={4}
            onPress={() => onEditExpense(editableExpenseId)}
            style={({ pressed }) => [styles.expenseAuditAction, pressed && styles.pressed]}
            testID={`expense-edit-${editableExpenseId}`}
          >
            <MaterialCommunityIcons color={colors.primaryDark} name="pencil-outline" size={15} />
            <Text style={styles.expenseAuditActionText}>Editar</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Eliminar ${item.title}`}
            accessibilityRole="button"
            hitSlop={4}
            onPress={() => onDeleteExpense(editableExpenseId)}
            style={({ pressed }) => [styles.expenseAuditActionDanger, pressed && styles.pressed]}
            testID={`expense-delete-${editableExpenseId}`}
          >
            <MaterialCommunityIcons color={colors.due} name="trash-can-outline" size={15} />
            <Text style={styles.expenseAuditActionDangerText}>Eliminar local</Text>
          </Pressable>
        </View>
      ) : null}
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

function SettlementRouteCard({
  activeMemberId,
  compact = false,
  data,
  onPress,
  settlement,
}: {
  activeMemberId: string;
  compact?: boolean;
  data: AppData;
  onPress: () => void;
  settlement: SettlementSuggestion;
}) {
  const from = findMember(data.members, settlement.fromMemberId);
  const to = findMember(data.members, settlement.toMemberId);
  const perspective = settlementPerspective(settlement, activeMemberId, from, to);

  return (
    <Pressable
      accessibilityLabel={`${perspective.title}. ${formatMoney(settlement.amountCents)}. Registro local sin pagos reales.`}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.settlementRouteCard,
        compact && styles.settlementRouteCardCompact,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.settlementRouteTop}>
        <View style={styles.settlementRouteAvatarBlock}>
          <Avatar color={from?.avatarColor ?? colors.due} label={from?.name ?? "A"} />
          <Text numberOfLines={1} style={styles.settlementRouteName}>{from?.name ?? "Integrante"}</Text>
        </View>
        <View style={styles.settlementRouteMiddle}>
          <Text style={styles.settlementRouteAmount}>{formatMoney(settlement.amountCents)}</Text>
          <View style={styles.settlementRouteTrack}>
            <View style={styles.settlementRouteDot}>
              <MaterialCommunityIcons color={colors.surface} name="cash" size={12} />
            </View>
          </View>
          <Text style={styles.settlementRouteVerb}>arreglo local</Text>
        </View>
        <View style={styles.settlementRouteAvatarBlock}>
          <Avatar color={to?.avatarColor ?? colors.primary} label={to?.name ?? "B"} />
          <Text numberOfLines={1} style={styles.settlementRouteName}>{to?.name ?? "Integrante"}</Text>
        </View>
      </View>
      <View style={styles.settlementRouteFooter}>
        <View style={styles.settlementPerspectiveBadge}>
          <Text style={styles.settlementPerspectiveText}>{perspective.badge}</Text>
        </View>
        <Text numberOfLines={1} style={styles.settlementRouteTitle}>{perspective.title}</Text>
        <MaterialCommunityIcons color={colors.primaryDark} name="chevron-right" size={18} />
      </View>
    </Pressable>
  );
}

function MemberLedgerRow({ balance }: { balance: MemberBalance }) {
  const status = balanceLabel(balance);
  const amountTone = balance.netCents < 0 ? "due" : balance.netCents > 0 ? "success" : "neutral";

  return (
    <PersonRow
      amountCents={Math.abs(balance.netCents)}
      amountTone={amountTone}
      avatarColor={balance.member.avatarColor}
      badge={status.label}
      meta={describeBalance(balance)}
      name={balance.member.name}
      testID={`member-ledger-row-${balance.member.id}`}
    />
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
    deleteExpense,
    error,
    isLoading,
    joinGroupByInvite,
    markSettlementPaid,
    removeMember,
    renameMember,
    resetDemo,
    selectGroup,
    selectedGroup,
    selectedSummary,
    updateExpense,
  } = useAppData();

  const [activeTab, setActiveTab] = useState<TabId>("groups");
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupFormMode, setGroupFormMode] = useState<"create" | "join">("create");
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupInviteCode, setGroupInviteCode] = useState("");
  const [memberName, setMemberName] = useState("");
  const [editingMemberId, setEditingMemberId] = useState("");
  const [editingMemberName, setEditingMemberName] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState(defaultCategory.id);
  const [expenseNote, setExpenseNote] = useState("");
  const [payerId, setPayerId] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [expenseSplitMode, setExpenseSplitMode] = useState<ExpenseSplitMode>("equal");
  const [exactShareTextByMember, setExactShareTextByMember] = useState<Record<string, string>>({});
  const [shareUnitsTextByMember, setShareUnitsTextByMember] = useState<Record<string, string>>({});
  const [openExpenseMenu, setOpenExpenseMenu] = useState<ExpenseMenuId | null>(null);
  const [showActiveMemberSheet, setShowActiveMemberSheet] = useState(false);
  const [showDeleteLocalDataConfirm, setShowDeleteLocalDataConfirm] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [dataControlMessage, setDataControlMessage] = useState("");
  const [dataControlTone, setDataControlTone] = useState<"success" | "error">("success");
  const [pendingSettlement, setPendingSettlement] = useState<SettlementSuggestion | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; tone: "success" | "neutral" | "due" } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
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
  const activeGroupSummary = useMemo(
    () => (selectedGroup ? calculateGroupSummary(data, selectedGroup.id) : null),
    [data, selectedGroup],
  );
  const heroAmountText = formatHeroMoney(personalBalanceState.amountCents);
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
  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const workspaceSectionLabel = activeTabConfig.groupScoped ? activeTabConfig.label : "Grupos";
  const workspaceHint = selectedGroup
    ? `${workspaceSectionLabel} de ${selectedGroup.name}`
    : "Primero elige un grupo";
  const expenseAmountCents = useMemo(() => parseMoneyInput(expenseAmount), [expenseAmount]);
  const splitInput = useMemo<SplitInput>(() => {
    if (expenseSplitMode === "exact") {
      return {
        method: "exact",
        shares: participantIds.map((memberId) => ({
          amountCents: parseMoneyInput(exactShareTextByMember[memberId] ?? "") ?? 0,
          memberId,
        })),
      };
    }
    if (expenseSplitMode === "shares") {
      return {
        method: "shares",
        shares: participantIds.map((memberId) => ({
          memberId,
          units: Math.max(1, Number.parseInt(shareUnitsTextByMember[memberId] ?? "1", 10) || 1),
        })),
      };
    }
    return { method: "equal", participantIds };
  }, [exactShareTextByMember, expenseSplitMode, participantIds, shareUnitsTextByMember]);
  const splitResult = useMemo(() => {
    if (!expenseAmountCents || participantIds.length === 0) {
      return { ok: true as const, shares: [] };
    }
    return resolveSplit(expenseAmountCents, splitInput);
  }, [expenseAmountCents, participantIds.length, splitInput]);
  const participantShares = splitResult.ok ? splitResult.shares : [];
  const splitError = splitResult.ok ? "" : splitResult.error;
  const selectedCategory = categoryFor(expenseCategoryId);
  const payer = selectedMembers.find((member) => member.id === payerId);
  const participantNames = selectedMembers
    .filter((member) => participantIds.includes(member.id))
    .map((member) => member.name);
  const participantSummary =
    participantNames.length === selectedMembers.length
      ? "Todo el grupo"
      : participantNames.length
        ? participantNames.join(", ")
        : "Selecciona participantes";
  const splitReady = Boolean(expenseAmountCents && participantShares.length);
  const expenseComposerTitle = editingExpenseId ? "Editar gasto" : "Nuevo gasto";
  const expenseCanSave =
    selectedMembers.length > 0 &&
    Boolean(expenseTitle.trim()) &&
    Boolean(expenseAmount.trim()) &&
    Boolean(payerId) &&
    participantIds.length > 0 &&
    participantIds.includes(payerId) &&
    splitResult.ok;
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

  const openGroupWorkspace = (groupId: string) => {
    selectGroup(groupId);
    setShowGroupForm(false);
    setGroupFormMode("create");
    setShowExpenseForm(false);
    setPendingSettlement(null);
    setActiveTab(firstGroupWorkspaceTab);
  };

  const openTab = (tab: TabId) => {
    if (tab !== "groups" && !selectedGroup) {
      setActiveTab("groups");
      return;
    }
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

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }
    const timeout = setTimeout(() => setFeedback(null), 2600);
    return () => clearTimeout(timeout);
  }, [feedback]);

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
    setGroupFormMode("create");
  };

  const submitGroupInvite = () => {
    const joined = joinGroupByInvite(groupInviteCode, activeActorUserId);
    if (!joined) {
      return;
    }
    setGroupInviteCode("");
    setShowGroupForm(false);
    setGroupFormMode("create");
    setActiveTab(firstGroupWorkspaceTab);
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

  const startEditMember = (member: Member) => {
    setEditingMemberId(member.id);
    setEditingMemberName(member.name);
  };

  const submitMemberRename = () => {
    if (!selectedGroup || !editingMemberId) {
      return;
    }
    const renamed = renameMember(selectedGroup.id, editingMemberId, editingMemberName);
    if (!renamed) {
      return;
    }
    setEditingMemberId("");
    setEditingMemberName("");
  };

  const submitMemberRemove = (memberId: string) => {
    if (!selectedGroup) {
      return;
    }
    const removed = removeMember(selectedGroup.id, memberId);
    if (removed && editingMemberId === memberId) {
      setEditingMemberId("");
      setEditingMemberName("");
    }
  };

  const resetExpenseComposer = () => {
    setEditingExpenseId("");
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseCategoryId(defaultCategory.id);
    setExpenseNote("");
    setParticipantIds([]);
    setExpenseSplitMode("equal");
    setExactShareTextByMember({});
    setShareUnitsTextByMember({});
    setOpenExpenseMenu(null);
  };

  const openNewExpenseComposer = () => {
    resetExpenseComposer();
    setShowExpenseForm(true);
  };

  const loadExpenseIntoComposer = (expense: Expense) => {
    const shares = data.expenseParticipants?.filter((share) => share.expenseId === expense.id) ?? [];
    const method = shares[0]?.shareMethod ?? "equal";
    setEditingExpenseId(expense.id);
    setExpenseTitle(expense.title);
    setExpenseAmount((expense.amountCents / 100).toFixed(2));
    setExpenseCategoryId(expense.categoryId ?? defaultCategory.id);
    setExpenseNote(expense.note ?? "");
    setPayerId(expense.paidByMemberId ?? expense.payerId);
    setParticipantIds(expense.participantIds);
    setExpenseSplitMode(method);
    setExactShareTextByMember(
      method === "exact"
        ? Object.fromEntries(shares.map((share) => [share.memberId, (share.shareCents / 100).toFixed(2)]))
        : {},
    );
    setShareUnitsTextByMember(
      method === "shares"
        ? Object.fromEntries(shares.map((share) => [share.memberId, String(share.shareUnits ?? 1)]))
        : {},
    );
    setOpenExpenseMenu(null);
    setShowExpenseForm(true);
  };

  const startEditExpense = (expenseId: string) => {
    const expense = data.expenses.find((item) => item.id === expenseId);
    if (!expense) {
      setFeedback({ message: "Ese gasto ya no está en el registro local.", tone: "due" });
      return;
    }
    loadExpenseIntoComposer(expense);
  };

  const submitExpense = () => {
    if (!selectedGroup) {
      return;
    }
    const input = {
      actorUserId: activeActorUserId,
      amount: expenseAmount,
      categoryId: expenseCategoryId,
      note: expenseNote,
      participantIds,
      payerId,
      split: splitInput,
      title: expenseTitle,
    };
    const saved = editingExpenseId
      ? updateExpense(selectedGroup.id, editingExpenseId, input)
      : addExpense(selectedGroup.id, input);
    if (!saved) {
      return;
    }
    const wasEditing = Boolean(editingExpenseId);
    resetExpenseComposer();
    setShowExpenseForm(false);
    setFeedback({
      message: wasEditing ? "Gasto actualizado en el registro local." : "Gasto guardado localmente. Sin pagos reales.",
      tone: "success",
    });
  };

  const submitExpenseDelete = (expenseId: string) => {
    if (!selectedGroup) {
      return;
    }
    const removed = deleteExpense(selectedGroup.id, expenseId, activeActorUserId);
    if (!removed) {
      return;
    }
    if (editingExpenseId === expenseId) {
      resetExpenseComposer();
      setShowExpenseForm(false);
    }
    setFeedback({ message: "Gasto eliminado del registro local.", tone: "success" });
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

  const updateExactShareText = (memberId: string, value: string) => {
    setExactShareTextByMember((current) => ({ ...current, [memberId]: value }));
  };

  const updateShareUnitsText = (memberId: string, value: string) => {
    setShareUnitsTextByMember((current) => ({ ...current, [memberId]: value.replace(/[^0-9]/g, "") }));
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
    setFeedback({ message: "Arreglo marcado como pagado en el registro local.", tone: "success" });
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

  const renderWorkspaceHome = () => {
    if (!selectedGroup || !selectedSummary || !activeGroupSummary) {
      return (
        <View style={styles.tabContent}>
          <EmptyState
            action={<ActionButton icon="account-group" label="Elegir grupo" onPress={() => openTab("groups")} />}
            body="Selecciona un grupo para abrir su espacio de gastos."
            icon="view-dashboard-outline"
            title="Elige un grupo"
          />
        </View>
      );
    }

    const visibleMembers = selectedMembers.slice(0, compact ? 3 : 4);
    const hiddenMemberCount = Math.max(selectedMembers.length - visibleMembers.length, 0);
    const openRatio =
      activeGroupSummary.totalSpentCents > 0
        ? Math.min(1, activeGroupSummary.openBalanceCents / activeGroupSummary.totalSpentCents)
        : 0;
    const openPercent = `${Math.max(8, Math.round(openRatio * 100))}%` as DimensionValue;
    const routeTitle = personalSettlement
      ? personalSettlement.fromMemberId === displayMemberId
        ? `Paga a ${personalSettlementTo?.name ?? "al grupo"}`
        : personalSettlement.toMemberId === displayMemberId
          ? `${personalSettlementFrom?.name ?? "Alguien"} te paga`
          : "Acuerdo del grupo"
      : "Grupo en paz";
    const routeCaption = personalSettlement
      ? "Acuerdo externo · solo registro local"
      : "No hay pagos pendientes";
    const nextActionLabel = personalSettlement
      ? personalSettlement.fromMemberId === activeGroupMember?.id
        ? "Registrar arreglo"
        : "Revisar quién te debe"
      : "Agregar gasto";
    const nextActionIcon = personalSettlement ? "check-circle-outline" : "receipt-text-plus";
    const nextActionPress = () => {
      if (personalSettlement) {
        setPendingSettlement(personalSettlement);
        return;
      }
      openNewExpenseComposer();
    };

    return (
      <View style={styles.moneyRoom}>
        <View style={styles.commandCanvas}>
          <View style={styles.commandTopbar}>
            <Pressable
              accessibilityLabel="Cambiar grupo activo"
              accessibilityRole="button"
              hitSlop={4}
              onPress={() => openTab("groups")}
              style={({ pressed }) => [styles.commandGroupSwitch, pressed && styles.pressed]}
            >
              <GroupObject group={selectedGroup} size="large" />
              <View style={styles.odCommandGroupCopy}>
                <Text numberOfLines={1} style={styles.odCommandKicker}>Grupo activo</Text>
                <Text numberOfLines={1} style={styles.odCommandTitle}>{selectedGroup.name}</Text>
                <Text numberOfLines={1} style={styles.odCommandMeta}>{selectedMembers.length} integrantes · MXN</Text>
              </View>
              <MaterialCommunityIcons color={colors.primaryDark} name="swap-horizontal" size={18} />
            </Pressable>
            <View style={styles.commandTrustChip}>
              <MaterialCommunityIcons color={colors.primaryDark} name="shield-check-outline" size={14} />
              <Text style={styles.odCommandTrustText}>Sin pagos reales</Text>
            </View>
          </View>

          <HomeMoneyInstrument
            amountText={heroAmountText}
            compact={compact}
            flow={
              personalSettlement ? (
                <MoneyFlowFigure
                  amountCents={personalSettlement.amountCents}
                  from={personalSettlementFrom}
                  progress={moneyFlowProgress}
                  reduceMotion={reduceMotion}
                  to={personalSettlementTo}
                />
              ) : (
                <View style={styles.instrumentPeaceLine}>
                  <MaterialCommunityIcons color={colors.primaryDark} name="check-decagram-outline" size={20} />
                  <Text style={styles.instrumentPeaceText}>Todo en paz · no hay arreglos pendientes</Text>
                </View>
              )
            }
            identity={{
              avatarColor: displayMember?.avatarColor ?? colors.primary,
              label: displayMember?.name ?? "Elige persona",
              meta: identityMeta,
              onPress: openIdentity,
            }}
            openLabel={`Abierto ${formatMoney(activeGroupSummary.openBalanceCents)}`}
            openPercent={openPercent}
            routeAmount={personalSettlement ? formatMoney(personalSettlement.amountCents) : "$0.00"}
            routeCaption={personalSettlement ? personalCue : routeCaption}
            routeTitle={routeTitle}
            spentLabel={`Gastado ${formatMoney(activeGroupSummary.totalSpentCents)}`}
            stateLabel={personalBalanceState.label}
            testID="inicio-money-instrument"
            tone={personalBalanceState.tone}
          />

          <View style={styles.peopleStrip}>
            <View style={styles.peopleStripHeader}>
              <Text style={styles.peopleStripTitle}>Personas del grupo</Text>
              <Text style={styles.peopleStripMeta}>{hiddenMemberCount ? `+${hiddenMemberCount}` : "Todos"}</Text>
            </View>
            <View style={styles.peopleStripRow}>
              {visibleMembers.map((member) => (
                <Pressable
                  accessibilityLabel={`Usar ${member.name} en este grupo`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeGroupMember?.id === member.id }}
                  hitSlop={4}
                  key={member.id}
                  onPress={() => {
                    void saveActiveGroupMember(member.id);
                  }}
                  style={[
                    styles.peopleStripPerson,
                    activeGroupMember?.id === member.id && styles.peopleStripPersonActive,
                  ]}
                >
                  <Avatar color={member.avatarColor} label={member.name} />
                  <Text numberOfLines={1} style={styles.peopleStripName}>{member.name}</Text>
                  {activeGroupMember?.id === member.id ? (
                    <MaterialCommunityIcons color={colors.primaryDark} name="check-circle" size={16} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.actionDock}>
          <Pressable
            accessibilityLabel={nextActionLabel}
            accessibilityRole="button"
            hitSlop={4}
            onPress={nextActionPress}
            style={({ pressed }) => [styles.actionDockPrimary, pressed && styles.pressed]}
          >
            <View style={styles.actionDockIcon}>
              <MaterialCommunityIcons color={colors.surface} name={nextActionIcon} size={20} />
            </View>
            <View style={styles.actionDockCopy}>
              <Text style={styles.actionDockLabel}>{nextActionLabel}</Text>
              <Text style={styles.actionDockMeta}>{personalSettlement ? "Registro local, no pago real" : "Dividir en partes iguales"}</Text>
            </View>
            <MaterialCommunityIcons color={colors.surface} name="arrow-right" size={18} />
          </Pressable>
          <View style={styles.actionDockSecondaryRow}>
            <Pressable
              accessibilityLabel="Agregar gasto"
              accessibilityRole="button"
              disabled={selectedMembers.length === 0}
              hitSlop={4}
              onPress={openNewExpenseComposer}
              style={({ pressed }) => [
                styles.actionDockSecondary,
                selectedMembers.length === 0 && styles.quickActionDisabled,
                pressed && selectedMembers.length > 0 && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons color={colors.primaryDark} name="receipt-text-plus" size={18} />
              <Text style={styles.actionDockSecondaryText}>Gasto</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Ver historial"
              accessibilityRole="button"
              hitSlop={4}
              onPress={() => setActiveTab("activity")}
              style={({ pressed }) => [styles.actionDockSecondary, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color={colors.primaryDark} name="history" size={18} />
              <Text style={styles.actionDockSecondaryText}>{activity.length} movimientos</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.activityStream}>
          <View style={styles.activityStreamHeader}>
            <View>
              <Text style={styles.activityStreamKicker}>Historial</Text>
              <Text style={styles.activityStreamTitle}>Últimos movimientos</Text>
            </View>
            <Pressable
              accessibilityLabel="Reiniciar datos demo"
              accessibilityRole="button"
              hitSlop={4}
              onPress={resetDemo}
              style={({ pressed }) => [styles.activityStreamReset, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color={colors.primaryDark} name="restore" size={15} />
              <Text style={styles.activityStreamResetText}>Demo</Text>
            </Pressable>
          </View>
          {activity.length === 0 ? (
            <EmptyState
              body="Cuando agregues gastos o marques arreglos, aparecerán aquí."
              icon="receipt-text-plus"
              title="Aún no hay actividad"
            />
          ) : (
            activity.slice(0, 5).map((item) => (
              <ActivityRow
                item={item}
                key={item.id}
                onDeleteExpense={submitExpenseDelete}
                onEditExpense={startEditExpense}
              />
            ))
          )}
        </View>
      </View>
    );
  };

  const renderGroups = () => (
    <View style={styles.groupLobby}>
      <View style={styles.groupLobbyHero}>
        <View style={styles.groupLobbyTop}>
          <View style={styles.groupSelectorIcon}>
            <MaterialCommunityIcons color={colors.primaryDark} name="account-switch-outline" size={18} />
          </View>
          <View style={styles.groupSelectorCopy}>
            <Text style={styles.groupLobbyKicker}>Tus espacios</Text>
            <Text style={styles.groupLobbyTitle}>
              {selectedGroup ? "Elige dónde dividir gastos" : "Abre un grupo para empezar"}
            </Text>
            <Text style={styles.groupLobbyText}>
              Cada grupo mantiene su propio balance, integrantes, actividad y perfil local.
            </Text>
          </View>
        </View>

        {selectedGroup && selectedSummary ? (
          <View style={styles.groupLobbyActive}>
            <View style={styles.groupLobbyActiveTop}>
              <GroupObject group={selectedGroup} size="large" />
              <View style={styles.groupLobbyActiveCopy}>
                <Text style={styles.groupLobbyKicker}>Grupo activo</Text>
                <Text numberOfLines={1} style={styles.groupLobbyActiveName}>{selectedGroup.name}</Text>
                <Text numberOfLines={1} style={styles.groupLobbyActiveMeta}>
                  {selectedMembers.length} integrantes · MXN · registro local
                </Text>
              </View>
            </View>
            <View style={styles.groupLobbyTrustRow}>
              <View style={styles.noPaymentChip}>
                <MaterialCommunityIcons color={colors.mutedInk} name="shield-check-outline" size={14} />
                <Text style={styles.noPaymentText}>Sin pagos reales</Text>
              </View>
              <Text numberOfLines={1} style={styles.groupLobbyTrustText}>Registro local, sin transferencias dentro de la app</Text>
            </View>
            <View style={styles.groupLobbyBalanceLine}>
              <View>
                <Text style={styles.moneySceneLabel}>Tu balance</Text>
                <Text style={[styles.moneySceneState, personalBalanceState.tone === "due" && styles.moneySceneDue]}>
                  {personalBalanceState.label}
                </Text>
              </View>
              <View style={styles.groupLobbyAmountWrap}>
                <Text style={styles.moneySceneCurrency}>MXN</Text>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  numberOfLines={1}
                  style={[
                    styles.groupLobbyAmount,
                    personalBalanceState.tone === "due" && styles.moneySceneAmountDue,
                  ]}
                >
                  {heroAmountText}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel={`Entrar a ${selectedGroup.name}`}
              accessibilityRole="button"
              hitSlop={4}
              onPress={() => openTab("home")}
              style={({ pressed }) => [styles.groupLobbyEnter, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color={colors.surface} name="arrow-right-circle" size={20} />
              <Text style={styles.groupLobbyEnterText}>Entrar al espacio</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.groupLobbyEmpty}>
            <MaterialCommunityIcons color={colors.primaryDark} name="account-group-outline" size={24} />
            <Text style={styles.groupLobbyEmptyText}>Selecciona un grupo para ver tu balance y actividad.</Text>
          </View>
        )}
      </View>

      <View style={styles.groupLobbyList}>
        <View style={styles.groupLobbyListHeader}>
          <View>
            <Text style={styles.groupLobbyKicker}>Cambiar espacio</Text>
            <Text style={styles.groupLobbyListTitle}>Grupos disponibles</Text>
          </View>
          <ActionButton
            icon={showGroupForm ? "close" : "plus"}
            label={showGroupForm ? "Cerrar" : "Nuevo"}
            onPress={() => {
              setShowGroupForm((current) => !current);
              setGroupFormMode("create");
            }}
            tone="secondary"
          />
        </View>

        {showGroupForm ? (
          <View style={styles.groupLobbyForm}>
            <View style={styles.groupFlowTabs}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: groupFormMode === "create" }}
                onPress={() => setGroupFormMode("create")}
                style={[styles.groupFlowTab, groupFormMode === "create" && styles.groupFlowTabActive]}
              >
                <MaterialCommunityIcons
                  color={groupFormMode === "create" ? colors.primaryDark : colors.mutedInk}
                  name="plus-circle-outline"
                  size={17}
                />
                <Text style={[styles.groupFlowTabText, groupFormMode === "create" && styles.groupFlowTabTextActive]}>
                  Crear
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: groupFormMode === "join" }}
                onPress={() => setGroupFormMode("join")}
                style={[styles.groupFlowTab, groupFormMode === "join" && styles.groupFlowTabActive]}
              >
                <MaterialCommunityIcons
                  color={groupFormMode === "join" ? colors.primaryDark : colors.mutedInk}
                  name="link-variant"
                  size={17}
                />
                <Text style={[styles.groupFlowTabText, groupFormMode === "join" && styles.groupFlowTabTextActive]}>
                  Unirme
                </Text>
              </Pressable>
            </View>

            {groupFormMode === "create" ? (
              <>
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
              </>
            ) : (
              <>
                <View style={styles.groupJoinCue}>
                  <MaterialCommunityIcons color={colors.primaryDark} name="cellphone-link" size={18} />
                  <Text style={styles.groupJoinCueText}>
                    Usa un código local demo. No crea una liga real ni sincroniza con backend.
                  </Text>
                </View>
                <Field
                  label="Código de invitación"
                  onChangeText={(value) => setGroupInviteCode(value.toUpperCase())}
                  placeholder="Ej. CC-ASADA-MTY"
                  value={groupInviteCode}
                />
                <ActionButton
                  disabled={!groupInviteCode.trim()}
                  icon="login"
                  label="Unirme al grupo"
                  onPress={submitGroupInvite}
                />
              </>
            )}
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
              onPress={() => openGroupWorkspace(group.id)}
            />
          ))
        )}
      </View>
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

  const renderBalance = () => {
    if (!selectedGroup || !selectedSummary) {
      return (
        <View style={styles.tabContent}>
          <EmptyState
            action={<ActionButton icon="account-group" label="Elegir grupo" onPress={() => openTab("groups")} />}
            body="Crea o selecciona un grupo para ver quién debe pagar."
            icon="scale-balance"
            title="Selecciona un grupo"
          />
        </View>
      );
    }

    const primaryRoute = selectedSummary.settlements[0] ?? null;
    const primaryFrom = primaryRoute ? findMember(data.members, primaryRoute.fromMemberId) : null;
    const primaryTo = primaryRoute ? findMember(data.members, primaryRoute.toMemberId) : null;
    const openLabel = selectedSummary.openBalanceCents ? "Pendiente por ordenar" : "Grupo liquidado";

    return (
      <View style={styles.tabContent}>
        <View style={styles.balanceMap}>
          <View style={styles.balanceMapHero}>
            <View style={styles.balanceMapTop}>
              <View style={styles.balanceMapTitleBlock}>
                <Text style={styles.balanceMapKicker}>Mapa de balance</Text>
                <Text numberOfLines={1} style={styles.balanceMapTitle}>{selectedGroup.name}</Text>
                <Text numberOfLines={1} style={styles.balanceMapMeta}>MXN · {selectedMembers.length} integrantes · arreglo externo</Text>
              </View>
              <View style={styles.commandTrustChip}>
                <MaterialCommunityIcons color={colors.primaryDark} name="shield-check-outline" size={14} />
                <Text style={styles.odCommandTrustText}>Sin pagos reales</Text>
              </View>
            </View>

            <View style={styles.balanceMapAmountRow}>
              <View style={styles.balanceMapStatus}>
                <Text style={styles.balanceMapStatusLabel}>Abierto</Text>
                <Text style={[styles.balanceMapStatusText, selectedSummary.openBalanceCents ? styles.balanceMapStatusDue : styles.balanceMapStatusOk]}>
                  {openLabel}
                </Text>
              </View>
              <View style={styles.balanceMapAmountBlock}>
                <Text style={styles.balanceMapCurrency}>MXN</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                  style={[styles.balanceMapAmount, selectedSummary.openBalanceCents ? styles.balanceMapAmountDue : styles.balanceMapAmountOk]}
                >
                  {formatHeroMoney(selectedSummary.openBalanceCents)}
                </Text>
              </View>
            </View>

            <View style={styles.balanceMapMetrics}>
              <View style={styles.balanceMapMetric}>
                <Text style={styles.balanceMapMetricLabel}>Rutas</Text>
                <Text style={styles.balanceMapMetricValue}>{selectedSummary.settlements.length}</Text>
              </View>
              <View style={styles.balanceMapMetric}>
                <Text style={styles.balanceMapMetricLabel}>Integrantes</Text>
                <Text style={styles.balanceMapMetricValue}>{selectedMembers.length}</Text>
              </View>
            </View>
          </View>

          <ComposerSection
            badge={primaryRoute ? `${selectedSummary.settlements.length} rutas` : "En paz"}
            icon={primaryRoute ? "swap-horizontal" : "check-decagram-outline"}
            meta={primaryRoute ? "Se registra solo si ya se arreglaron fuera de la app." : "No hay pagos pendientes para este grupo."}
            testID="balance-settlement-map-section"
            title={primaryRoute ? "Quién paga ahora" : "Sin rutas pendientes"}
          >
            {primaryRoute ? (
              <>
                <View style={styles.settlementMapFigure}>
                  <MoneyFlowFigure
                    amountCents={primaryRoute.amountCents}
                    from={primaryFrom}
                    progress={moneyFlowProgress}
                    reduceMotion={reduceMotion}
                    to={primaryTo}
                  />
                </View>
                <View style={styles.settlementMapCopyRow}>
                  <View style={styles.settlementMapCopy}>
                    <Text style={styles.settlementMapRouteText}>
                      {settlementPerspective(primaryRoute, displayMemberId, primaryFrom, primaryTo).title}
                    </Text>
                    <Text style={styles.settlementMapRouteMeta}>Sin pagos reales · registro local</Text>
                  </View>
                  <ReusableButton
                    icon="check"
                    onPress={() => setPendingSettlement(primaryRoute)}
                    testID="balance-settlement-register-button"
                  >
                    Registrar
                  </ReusableButton>
                </View>
              </>
            ) : (
              <View style={styles.settlementMapPeace}>
                <MaterialCommunityIcons color={colors.primaryDark} name="check-decagram-outline" size={24} />
                <View style={styles.calmFigureCopy}>
                  <Text style={styles.settlementMapRouteText}>Todo en paz</Text>
                  <Text style={styles.settlementMapRouteMeta}>No hay pagos pendientes para este grupo.</Text>
                </View>
              </View>
            )}
          </ComposerSection>

          {selectedSummary.settlements.length > 1 ? (
            <View style={styles.routeChipRail}>
              {selectedSummary.settlements.slice(1).map((settlement) => {
                const from = findMember(data.members, settlement.fromMemberId);
                const to = findMember(data.members, settlement.toMemberId);
                return (
                  <Pressable
                    accessibilityLabel={`${from?.name ?? "Integrante"} paga ${formatMoney(settlement.amountCents)} a ${to?.name ?? "integrante"}`}
                    accessibilityRole="button"
                    hitSlop={4}
                    key={`${settlement.fromMemberId}-${settlement.toMemberId}`}
                    onPress={() => setPendingSettlement(settlement)}
                    style={({ pressed }) => [styles.routeChip, pressed && styles.pressed]}
                  >
                    <Avatar color={from?.avatarColor ?? colors.due} label={from?.name ?? "A"} />
                    <MaterialCommunityIcons color={colors.mutedInk} name="arrow-right" size={14} />
                    <Avatar color={to?.avatarColor ?? colors.primary} label={to?.name ?? "B"} />
                    <Text numberOfLines={1} style={styles.routeChipAmount}>{formatMoney(settlement.amountCents)}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.memberLedgerPanel}>
            <View style={styles.memberLedgerHeader}>
              <View>
                <Text style={styles.balanceMapKicker}>Integrantes</Text>
                <Text style={styles.memberLedgerTitle}>Balance por persona</Text>
              </View>
              <ActionButton
                icon="account-edit-outline"
                label="Gestionar"
                onPress={() => setShowMemberForm(true)}
                tone="secondary"
              />
            </View>
            {selectedMembers.length === 0 ? (
              <EmptyState
                action={<ActionButton icon="account-plus" label="Agregar" onPress={() => setShowMemberForm(true)} />}
                body="Agrega integrantes antes de registrar gastos."
                icon="account-plus"
                title="Aún no hay integrantes"
              />
            ) : (
              <View style={styles.memberLedgerList}>
                {selectedSummary.balances.map((balance) => (
                  <MemberLedgerRow balance={balance} key={balance.member.id} />
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderActivity = () => {
    if (!selectedGroup || !selectedSummary || !activeGroupSummary) {
      return (
        <View style={styles.ledgerStory}>
          <EmptyState
            action={<ActionButton icon="account-group" label="Elegir grupo" onPress={() => openTab("groups")} />}
            body="Selecciona un grupo para ver la actividad."
            icon="history"
            title="Sin grupo activo"
          />
        </View>
      );
    }

    if (activity.length === 0) {
      return (
        <View style={styles.ledgerStory}>
          <EmptyState
            body="Cuando agregues gastos o marques arreglos, aparecerán aquí."
            icon="receipt-text-plus"
            title="Aún no hay actividad"
          />
        </View>
      );
    }

    const latestActivity = activity[0];
    const settlementCount = activity.filter((item) => item.type === "settlement").length;

    return (
      <View style={styles.ledgerStory}>
        <View style={styles.auditHero}>
          <View style={styles.auditHeroTop}>
            <View style={styles.auditSeal}>
              <MaterialCommunityIcons color={colors.primaryDark} name="shield-check-outline" size={22} />
            </View>
            <View style={styles.ledgerHeroCopy}>
              <Text style={styles.ledgerKicker}>Bitácora local</Text>
              <Text numberOfLines={1} style={styles.ledgerHeroTitle}>{selectedGroup.name}</Text>
              <Text numberOfLines={2} style={styles.ledgerHeroText}>Registro local de gastos y arreglos. No se mueve dinero.</Text>
            </View>
            <Pressable
              accessibilityLabel="Reiniciar datos demo"
              accessibilityRole="button"
              hitSlop={4}
              onPress={resetDemo}
              style={({ pressed }) => [styles.auditDemoButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color={colors.primaryDark} name="restore" size={15} />
              <Text style={styles.auditDemoText}>Demo</Text>
            </Pressable>
          </View>

          <View style={styles.auditSummaryGrid}>
            <View style={styles.auditSummaryItem}>
              <Text style={styles.ledgerMetricLabel}>Movimientos</Text>
              <Text style={styles.auditSummaryValue}>{activity.length}</Text>
            </View>
            <View style={styles.auditSummaryItem}>
              <Text style={styles.ledgerMetricLabel}>Arreglos</Text>
              <Text style={styles.auditSummaryValue}>{settlementCount}</Text>
            </View>
            <View style={styles.auditSummaryItemWide}>
              <Text style={styles.ledgerMetricLabel}>Abierto</Text>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                numberOfLines={1}
                style={[styles.auditSummaryMoney, activeGroupSummary.openBalanceCents ? styles.ledgerMetricDue : styles.ledgerMetricOk]}
              >
                MXN {formatHeroMoney(activeGroupSummary.openBalanceCents)}
              </Text>
            </View>
          </View>

          <View style={styles.latestProofCard}>
            <View style={styles.latestProofIcon}>
              <MaterialCommunityIcons color={colors.primaryDark} name={activityIcon(latestActivity)} size={18} />
            </View>
            <View style={styles.latestProofCopy}>
              <Text style={styles.ledgerKicker}>Última prueba</Text>
              <Text numberOfLines={1} style={styles.latestProofTitle}>{latestActivity.title}</Text>
              <Text numberOfLines={1} style={styles.latestProofMeta}>
                {formatDate(latestActivity.createdAt)} · {latestActivity.actorName ?? "Registro local"}
              </Text>
            </View>
            {latestActivity.amountCents > 0 ? <Amount cents={latestActivity.amountCents} tone={latestActivity.type === "settlement" ? "success" : "neutral"} /> : null}
          </View>

          <View style={styles.ledgerActionRow}>
            <ActionButton icon="receipt-text-plus" label="Agregar gasto" onPress={openNewExpenseComposer} />
            <ActionButton icon="scale-balance" label="Balance" onPress={() => openTab("balance")} tone="secondary" />
          </View>
        </View>

        <View style={styles.ledgerTimeline}>
          {groupActivityByDate(activity).map((section) => (
            <View key={section.dateKey} style={styles.ledgerDayCard}>
              <View style={styles.ledgerDayHeader}>
                <View>
                  <Text style={styles.ledgerKicker}>Día</Text>
                  <Text style={styles.ledgerDayTitle}>{section.label}</Text>
                </View>
                <Pill label={`${section.items.length} mov.`} tone="neutral" />
              </View>
              {section.items.map((item) => (
                <ActivityRow
                  item={item}
                  key={item.id}
                  onDeleteExpense={submitExpenseDelete}
                  onEditExpense={startEditExpense}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAccount = () => (
    <View style={styles.profileCenter}>
        {isAccountLoading ? (
          <View style={styles.loadingBand}>
            <MaterialCommunityIcons color={colors.primary} name="progress-clock" size={18} />
            <Text style={styles.loadingText}>Cargando cuenta local...</Text>
          </View>
        ) : account.profile && account.mode === "signed-in" ? (
          <>
            <View style={styles.profileVault}>
              <View style={styles.profileVaultHeader}>
                <View style={styles.profileAvatarPlate}>
                  <Avatar color={activeGroupMember?.avatarColor ?? colors.primary} label={account.profile.displayName} />
                  <View style={styles.profileAvatarBadge}>
                    <MaterialCommunityIcons color={colors.surface} name="shield-check" size={12} />
                  </View>
                </View>
                <View style={styles.profileVaultCopy}>
                  <Text style={styles.profileKicker}>Perfil local activo</Text>
                  <Text numberOfLines={1} style={styles.profileVaultName}>{account.profile.displayName}</Text>
                  <Text numberOfLines={1} style={styles.profileVaultEmail}>{account.profile.email}</Text>
                </View>
                <View style={styles.profileModeBadge}>
                  <Text style={styles.profileModeBadgeText}>Demo</Text>
                </View>
              </View>

              <View style={styles.profileVaultBody}>
                <View style={styles.profileVaultGroup}>
                  {selectedGroup ? <GroupObject group={selectedGroup} /> : (
                    <View style={styles.profileVaultGroupIcon}>
                      <MaterialCommunityIcons color={colors.primaryDark} name="account-group-outline" size={20} />
                    </View>
                  )}
                  <View style={styles.profileVaultGroupCopy}>
                    <Text style={styles.profileVaultMicro}>Grupo actual</Text>
                    <Text numberOfLines={1} style={styles.profileVaultGroupName}>
                      {selectedGroup ? selectedGroup.name : "Sin grupo seleccionado"}
                    </Text>
                  </View>
                  <ActionButton icon="swap-horizontal" label="Cambiar" onPress={() => openTab("groups")} tone="ghost" />
                </View>

                <View style={styles.profileTrustRail}>
                  <View style={styles.profileTrustRailItem}>
                    <MaterialCommunityIcons color={colors.primaryDark} name="cellphone-lock" size={16} />
                    <Text style={styles.profileTrustRailText}>Local</Text>
                  </View>
                  <View style={styles.profileTrustRailItem}>
                    <MaterialCommunityIcons color={colors.primaryDark} name="cloud-off-outline" size={16} />
                    <Text style={styles.profileTrustRailText}>Sin sync</Text>
                  </View>
                  <View style={styles.profileTrustRailItem}>
                    <MaterialCommunityIcons color={colors.primaryDark} name="cash-remove" size={16} />
                    <Text style={styles.profileTrustRailText}>Sin pagos reales</Text>
                  </View>
                </View>
              </View>
            </View>

            {selectedGroup ? (
              <View style={styles.profilePersonaPanel}>
                <View style={styles.profilePersonaHeader}>
                  <View style={styles.profilePersonaTitleBlock}>
                    <Text style={styles.profileKicker}>Persona en este grupo</Text>
                    <Text style={styles.profilePanelTitle}>Tu identidad aquí</Text>
                    <Text style={styles.accountSectionText}>{selectedMembers.length} integrantes disponibles</Text>
                  </View>
                  <ActionButton
                    disabled={!selectedGroup || selectedMembers.length === 0}
                    icon="account-switch"
                    label="Elegir"
                    onPress={openActiveMemberPicker}
                    tone="secondary"
                  />
                </View>

                <PersonRow
                  avatarColor={activeGroupMember?.avatarColor ?? displayMember?.avatarColor ?? colors.primary}
                  badge={activeGroupMember ? "Identidad activa" : "Pendiente"}
                  meta={
                    activeGroupMember
                      ? "Gastos nuevos y balances se leen desde esta identidad."
                      : "Vincula tu sesión a una persona del grupo."
                  }
                  name={activeGroupMember ? activeGroupMember.name : "Elige tu integrante"}
                  testID="profile-active-person-row"
                />

                <View style={styles.profilePeopleList}>
                  {selectedMembers.map((member) => (
                    <SelectOptionRow
                      accessibilityLabel={`Usar ${member.name} en este grupo`}
                      key={member.id}
                      leading={<Avatar color={member.avatarColor} label={member.name} />}
                      meta={activeGroupMember?.id === member.id ? "Identidad activa" : "Disponible para este grupo"}
                      onPress={() => {
                        void saveActiveGroupMember(member.id);
                      }}
                      selected={activeGroupMember?.id === member.id}
                      testID={`profile-person-option-${member.id}`}
                      title={member.name}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <EmptyState
                action={<ActionButton icon="account-group" label="Elegir grupo" onPress={() => openTab("groups")} />}
                body="Primero elige un grupo. Después este perfil se usará dentro de ese grupo."
                icon="account-circle"
                title="Perfil sin grupo"
              />
            )}

            <View style={styles.profileTrustPanel}>
              <View style={styles.profileTrustHeader}>
                <View>
                  <Text style={styles.profilePanelTitle}>Control de datos</Text>
                  <Text style={styles.accountSectionText}>Todo vive en este dispositivo para la demo.</Text>
                </View>
                <MaterialCommunityIcons color={colors.primaryDark} name="shield-lock-outline" size={22} />
              </View>
              {renderLocalDataControls()}
              <ActionButton icon="logout" label="Salir del perfil" onPress={signOut} tone="secondary" />
            </View>
          </>
        ) : (
          <View style={styles.profileOnboarding}>
            <View style={styles.profileOnboardingIcon}>
              <MaterialCommunityIcons color={colors.primaryDark} name="account-circle-outline" size={28} />
            </View>
            <Text style={styles.profileHeroName}>Crea tu perfil local</Text>
            <Text style={styles.profileOnboardingText}>
              Sirve para probar identidad por grupo, gastos y borrado local. No crea una cuenta real.
            </Text>
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
              <Text style={styles.sheetTitle}>Integrantes</Text>
              <Text style={styles.sheetSubtitle}>Agrega, corrige nombres o quita integrantes sin gastos.</Text>
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
          <View style={styles.memberManagerList}>
            {selectedMembers.map((member) => {
              const isEditing = editingMemberId === member.id;
              return (
                <View key={member.id} style={styles.memberManagerItem}>
                  {isEditing ? (
                    <>
                      <Field
                        label="Nombre visible"
                        onChangeText={setEditingMemberName}
                        placeholder="Nombre"
                        value={editingMemberName}
                      />
                      <View style={styles.memberManagerActions}>
                        <ActionButton
                          disabled={!editingMemberName.trim()}
                          icon="check"
                          label="Guardar"
                          onPress={submitMemberRename}
                        />
                        <ActionButton
                          icon="close"
                          label="Cancelar"
                          onPress={() => {
                            setEditingMemberId("");
                            setEditingMemberName("");
                          }}
                          tone="secondary"
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <SelectOptionRow
                        leading={<Avatar color={member.avatarColor} label={member.name} />}
                        meta={member.role === "owner" ? "Organiza este grupo" : "Integrante local"}
                        onPress={() => startEditMember(member)}
                        selected={activeGroupMember?.id === member.id}
                        title={member.name}
                      />
                      <View style={styles.memberManagerActions}>
                        <ActionButton
                          icon="pencil"
                          label="Editar"
                          onPress={() => startEditMember(member)}
                          tone="secondary"
                        />
                        <ActionButton
                          icon="account-minus-outline"
                          label="Quitar"
                          onPress={() => submitMemberRemove(member.id)}
                          tone="danger"
                        />
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </View>
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
          <View className="gap-ccXs">
            {selectedMembers.map((member) => (
              <SelectOptionRow
                key={member.id}
                leading={<Avatar color={member.avatarColor} label={member.name} />}
                meta={activeGroupMember?.id === member.id ? "Identidad activa" : "Disponible para este grupo"}
                onPress={() => {
                  void saveActiveGroupMember(member.id);
                }}
                role="radio"
                selected={activeGroupMember?.id === member.id}
                testID={`active-member-option-${member.id}`}
                title={member.name}
              />
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
        <ScrollView contentContainerStyle={styles.composerSheet} keyboardShouldPersistTaps="handled">
          <View style={styles.sheetHandle} />
          <View style={styles.captureHeader}>
            <View style={styles.composerTitleBlock}>
              <Text style={styles.captureKicker}>Captura de recibo</Text>
              <Text style={styles.captureTitle}>{expenseComposerTitle}</Text>
              <Text style={styles.captureSubtitle}>{selectedGroup?.name ?? "Grupo"} · MXN</Text>
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

          {error ? <Text style={styles.formError}>{error}</Text> : null}

          <View style={styles.captureContextRail}>
            <View style={styles.captureContextChip}>
              <MaterialCommunityIcons
                color={colors.primaryDark}
                name={selectedGroup ? groupGlyph(selectedGroup) : "account-group-outline"}
                size={15}
              />
              <Text numberOfLines={1} style={styles.captureContextText}>{selectedGroup?.name ?? "Grupo"}</Text>
            </View>
            <View style={styles.captureContextChip}>
              <MaterialCommunityIcons color={colors.primaryDark} name="account-circle-outline" size={15} />
              <Text numberOfLines={1} style={styles.captureContextText}>
                {activeGroupMember?.name ?? displayMember?.name ?? "Persona"}
              </Text>
            </View>
            <View style={styles.captureContextChip}>
              <MaterialCommunityIcons color={colors.primaryDark} name="cash-remove" size={15} />
              <Text style={styles.captureContextText}>Sin pagos reales</Text>
            </View>
          </View>

          <ComposerSection
            badge="Partes iguales"
            className="bg-surface"
            icon="receipt-text-plus-outline"
            meta="Monto, pagador y participantes en una sola captura."
            testID="expense-composer-receipt-section"
            title={expenseComposerTitle}
          >
            <View style={styles.expenseQuickGrid}>
              <Pressable
                accessibilityLabel={`Categoría ${selectedCategory.label}`}
                accessibilityRole="button"
                accessibilityState={{ expanded: openExpenseMenu === "category" }}
                hitSlop={4}
                onPress={() => toggleExpenseMenu("category")}
                style={({ pressed }) => [styles.expenseSelectRow, pressed && styles.pressed]}
              >
                <CategoryObject categoryId={expenseCategoryId} size="small" />
                <View style={styles.moneyPathCopy}>
                  <Text style={styles.moneyPathLabel}>Categoría</Text>
                  <Text numberOfLines={1} style={styles.moneyPathValue}>{selectedCategory.label}</Text>
                </View>
                <MaterialCommunityIcons
                  color={colors.primaryDark}
                  name={openExpenseMenu === "category" ? "chevron-up" : "chevron-down"}
                  size={20}
                />
              </Pressable>

              <SelectPanel open={openExpenseMenu === "category"} testID="expense-category-select-panel">
                <View style={styles.categoryListMenu}>
                  {expenseCategories.map((category) => {
                    const selected = category.id === expenseCategoryId;
                    return (
                      <SelectOptionRow
                        accessibilityLabel={`Categoría ${category.label}`}
                        key={category.id}
                        leading={<CategoryObject categoryId={category.id} size="small" />}
                        meta={selected ? "Seleccionada" : "Clasifica el historial"}
                        onPress={() => {
                          setExpenseCategoryId(category.id);
                          setOpenExpenseMenu(null);
                        }}
                        role="radio"
                        selected={selected}
                        testID={`expense-category-option-${category.id}`}
                        title={category.label}
                      />
                    );
                  })}
                </View>
              </SelectPanel>

              <MoneyInput
                helper="Acepta decimales. Ej. 1480.50"
                label="Monto MXN"
                onChangeText={setExpenseAmount}
                placeholder="0.00"
                testID="expense-money-input"
                value={expenseAmount}
              />

              <TextField
                helper="Nombre corto para el historial."
                label="Concepto"
                onChangeText={setExpenseTitle}
                placeholder="Ej. Tacos después del cine"
                testID="expense-title-input"
                value={expenseTitle}
              />

              <View style={styles.expenseRouteStack}>
                <Pressable
                  accessibilityLabel={`Pagó ${payer?.name ?? "selecciona persona"}`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: openExpenseMenu === "payer" }}
                  hitSlop={4}
                  onPress={() => toggleExpenseMenu("payer")}
                  style={({ pressed }) => [styles.expenseSelectRow, pressed && styles.pressed]}
                >
                  {payer ? <Avatar color={payer.avatarColor} label={payer.name} /> : (
                    <View style={styles.moneyPathIcon}>
                      <MaterialCommunityIcons color={colors.primaryDark} name="cash-plus" size={19} />
                    </View>
                  )}
                  <View style={styles.moneyPathCopy}>
                    <Text style={styles.moneyPathLabel}>Pagó</Text>
                    <Text numberOfLines={1} style={styles.moneyPathValue}>
                      {payer?.name ?? "Selecciona quién pagó"}
                    </Text>
                  </View>
                  <MaterialCommunityIcons color={colors.primaryDark} name="chevron-down" size={20} />
                </Pressable>

                <SelectPanel open={openExpenseMenu === "payer"} testID="expense-payer-select-panel">
                  {selectedMembers.map((member) => (
                    <SelectOptionRow
                      accessibilityLabel={`Pagó ${member.name}`}
                      key={member.id}
                      leading={<Avatar color={member.avatarColor} label={member.name} />}
                      meta={activeGroupMember?.id === member.id ? "Tu integrante activo" : "Integrante del grupo"}
                      onPress={() => chooseExpensePayer(member.id)}
                      role="radio"
                      selected={payerId === member.id}
                      testID={`expense-payer-option-${member.id}`}
                      title={member.name}
                    />
                  ))}
                </SelectPanel>

                <Pressable
                  accessibilityLabel={`Participan ${participantSummary}`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: openExpenseMenu === "participants" }}
                  hitSlop={4}
                  onPress={() => toggleExpenseMenu("participants")}
                  style={({ pressed }) => [styles.expenseSelectRow, pressed && styles.pressed]}
                >
                  <View style={styles.participantMiniStack}>
                    {selectedMembers
                      .filter((member) => participantIds.includes(member.id))
                      .slice(0, 3)
                      .map((member, index) => (
                        <View key={member.id} style={index > 0 && styles.participantMiniOverlap}>
                          <Avatar color={member.avatarColor} label={member.name} />
                        </View>
                      ))}
                  </View>
                  <View style={styles.moneyPathCopy}>
                    <Text style={styles.moneyPathLabel}>Participan</Text>
                    <Text numberOfLines={1} style={styles.moneyPathValue}>{participantSummary}</Text>
                  </View>
                  <Pill label={`${participantIds.length}/${selectedMembers.length}`} tone="neutral" />
                </Pressable>

                <SelectPanel open={openExpenseMenu === "participants"} testID="expense-participants-select-panel">
                  {selectedMembers.map((member) => {
                    const selected = participantIds.includes(member.id);
                    const share = participantShares.find((item) => item.memberId === member.id);
                    return (
                      <SelectOptionRow
                        accessibilityLabel={`${selected ? "Incluido" : "No incluido"} ${member.name}${
                          payerId === member.id ? ", pagó el gasto" : ""
                        }`}
                        disabled={payerId === member.id}
                        key={member.id}
                        leading={<Avatar color={member.avatarColor} label={member.name} />}
                        meta={
                          payerId === member.id
                            ? "Pagó · incluido"
                            : selected && share
                              ? formatMoney(share.amountCents)
                              : selected
                                ? "Incluido"
                                : "No participa"
                        }
                        onPress={() => toggleExpenseParticipant(member.id)}
                        role="checkbox"
                        selected={selected}
                        testID={`expense-participant-option-${member.id}`}
                        title={member.name}
                        trailing={
                          <MaterialCommunityIcons
                            color={selected ? colors.primary : colors.mutedInk}
                            name={selected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                            size={20}
                          />
                        }
                      />
                    );
                  })}
                </SelectPanel>
              </View>

              <View style={styles.splitEditor}>
                <View style={styles.splitModeTabs} testID="expense-split-mode-tabs">
                  {splitModes.map((mode) => {
                    const selected = expenseSplitMode === mode.id;
                    return (
                      <Pressable
                        accessibilityLabel={`Dividir ${mode.label}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        key={mode.id}
                        onPress={() => setExpenseSplitMode(mode.id)}
                        style={({ pressed }) => [
                          styles.splitModeTab,
                          selected && styles.splitModeTabActive,
                          pressed && styles.pressed,
                        ]}
                        testID={`expense-split-mode-${mode.id}`}
                      >
                        <MaterialCommunityIcons
                          color={selected ? colors.primaryDark : colors.mutedInk}
                          name={mode.icon}
                          size={16}
                        />
                        <Text style={[styles.splitModeText, selected && styles.splitModeTextActive]}>{mode.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {expenseSplitMode !== "equal" ? (
                  <View style={styles.splitEditorList} testID="expense-split-editor-list">
                    {selectedMembers
                      .filter((member) => participantIds.includes(member.id))
                      .map((member) => {
                        const share = participantShares.find((item) => item.memberId === member.id);
                        return (
                          <View key={member.id} style={styles.splitEditorRow}>
                            <Avatar color={member.avatarColor} label={member.name} />
                            <View style={styles.splitEditorCopy}>
                              <Text numberOfLines={1} style={styles.splitEditorName}>{member.name}</Text>
                              {expenseSplitMode === "shares" ? (
                                <Text numberOfLines={1} style={styles.splitEditorMeta}>
                                  {share ? formatMoney(share.amountCents) : "Pendiente"}
                                </Text>
                              ) : null}
                            </View>
                            {expenseSplitMode === "exact" ? (
                              <View style={styles.splitEditorInputShell}>
                                <Text style={styles.splitEditorPrefix}>$</Text>
                                <TextInput
                                  accessibilityLabel={`Monto exacto de ${member.name}`}
                                  keyboardType="decimal-pad"
                                  onChangeText={(value) => updateExactShareText(member.id, value)}
                                  placeholder="0.00"
                                  placeholderTextColor={colors.mutedInk}
                                  style={styles.splitEditorInput}
                                  testID={`expense-exact-share-${member.id}`}
                                  value={exactShareTextByMember[member.id] ?? ""}
                                />
                              </View>
                            ) : (
                              <View style={styles.splitEditorInputShell}>
                                <TextInput
                                  accessibilityLabel={`Partes de ${member.name}`}
                                  keyboardType="number-pad"
                                  onChangeText={(value) => updateShareUnitsText(member.id, value)}
                                  placeholder="1"
                                  placeholderTextColor={colors.mutedInk}
                                  style={[styles.splitEditorInput, styles.splitEditorUnitsInput]}
                                  testID={`expense-share-units-${member.id}`}
                                  value={shareUnitsTextByMember[member.id] ?? "1"}
                                />
                                <Text style={styles.splitEditorSuffix}>partes</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    {splitError ? <Text style={styles.splitEditorError}>{splitError}</Text> : null}
                  </View>
                ) : (
                  <View style={styles.splitEditorHint}>
                    <MaterialCommunityIcons color={colors.primaryDark} name="equal" size={16} />
                    <Text style={styles.splitEditorHintText}>
                      Se divide igual entre quienes participan.
                    </Text>
                  </View>
                )}
              </View>

              <NoteField
                helper="Opcional."
                label="Nota"
                onChangeText={setExpenseNote}
                placeholder="Opcional"
                testID="expense-note-input"
                value={expenseNote}
              />
            </View>

            {splitReady ? (
              <View style={styles.splitImpactPanel}>
                <View style={[styles.splitImpactTop, compact && styles.splitImpactTopCompact]}>
                  <View style={styles.splitImpactTotal}>
                    <Text style={styles.splitImpactLabel}>Total a dividir</Text>
                    <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.splitImpactAmount}>
                      {formatMoney(expenseAmountCents ?? 0)}
                    </Text>
                  </View>
                  <View style={[styles.splitImpactRule, compact && styles.splitImpactRuleCompact]}>
                    <MaterialCommunityIcons color={colors.primaryDark} name="equal" size={17} />
                    <Text style={styles.splitImpactRuleText}>
                      {expenseSplitMode === "equal"
                        ? `${participantShares.length} partes iguales`
                        : expenseSplitMode === "exact"
                          ? "Montos exactos"
                          : "Por partes"}
                    </Text>
                  </View>
                </View>

                <View style={styles.splitImpactTrack}>
                  {participantShares.slice(0, 6).map((share) => {
                    const member = findMember(selectedMembers, share.memberId);
                    if (!member) {
                      return null;
                    }
                    return (
                      <View
                        key={share.memberId}
                        style={[
                          styles.splitImpactSegment,
                          { backgroundColor: member.avatarColor },
                        ]}
                      />
                    );
                  })}
                </View>

                <View style={styles.sharePreviewGrid}>
                  {participantShares.slice(0, 5).map((share) => {
                  const member = findMember(selectedMembers, share.memberId);
                  if (!member) {
                    return null;
                  }
                  const paid = member.id === payerId;
                  return (
                    <View key={share.memberId} style={styles.sharePreviewRow}>
                      <Avatar color={member.avatarColor} label={member.name} />
                      <View style={styles.sharePreviewCopy}>
                        <View style={styles.sharePreviewNameLine}>
                          <Text numberOfLines={1} style={styles.sharePreviewName}>{member.name}</Text>
                          {paid ? <Pill label="Pagó" tone="success" /> : null}
                        </View>
                        <View style={styles.sharePreviewBarTrack}>
                          <View
                            style={[
                              styles.sharePreviewBarFill,
                              { backgroundColor: member.avatarColor },
                            ]}
                          />
                        </View>
                      </View>
                      <View style={styles.sharePreviewAmountBlock}>
                        <Text style={styles.sharePreviewAmountLabel}>Le toca</Text>
                        <Text style={styles.sharePreviewAmount}>{formatMoney(share.amountCents)}</Text>
                      </View>
                    </View>
                  );
                  })}
                </View>

                {participantShares.length > 5 ? (
                  <Text style={styles.splitImpactMore}>
                    +{participantShares.length - 5} participantes más en el reparto
                  </Text>
                ) : null}
              </View>
            ) : null}

            <ComposerSaveDock
              action={
                <ReusableButton
                  disabled={!expenseCanSave}
                  icon="receipt-text-plus"
                  onPress={submitExpense}
                  testID="expense-composer-save-button"
                >
                  {editingExpenseId ? "Actualizar" : "Guardar"}
                </ReusableButton>
              }
              body="No cobra ni envía dinero. Solo actualiza balances del grupo."
              testID="expense-composer-save-dock"
              title={editingExpenseId ? "Actualizar gasto local" : "Guardar gasto local"}
            />
          </ComposerSection>
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
          <View style={[styles.confirmCard, styles.settlementAgreementCard]}>
            <View style={styles.settlementAgreementHeader}>
              <View style={styles.confirmIcon}>
                <MaterialCommunityIcons color={colors.primaryDark} name="handshake-outline" size={20} />
              </View>
              <View style={styles.settlementAgreementTitleWrap}>
                <Text style={styles.confirmEyebrow}>Arreglo fuera de la app</Text>
                <Text style={styles.confirmTitle}>{perspective?.confirmTitle ?? "Confirmar arreglo local"}</Text>
              </View>
            </View>

            {pendingSettlement ? (
              <View style={[styles.settlementAgreementRoute, compact && styles.settlementAgreementRouteCompact]}>
                <View style={styles.settlementAgreementPerson}>
                  <Avatar color={from?.avatarColor ?? colors.due} label={from?.name ?? "A"} />
                  <Text numberOfLines={1} style={styles.settlementAgreementPersonName}>{from?.name ?? "Integrante"}</Text>
                  <Text style={styles.settlementAgreementRole}>paga</Text>
                </View>
                <View style={[styles.settlementAgreementMiddle, compact && styles.settlementAgreementMiddleCompact]}>
                  <Text adjustsFontSizeToFit minimumFontScale={0.62} numberOfLines={1} style={[styles.settlementAgreementAmount, compact && styles.settlementAgreementAmountCompact]}>
                    {formatMoney(pendingSettlement.amountCents)}
                  </Text>
                  <View style={styles.settlementAgreementTrack}>
                    <View style={styles.settlementAgreementDot}>
                      <MaterialCommunityIcons color={colors.surface} name="cash-check" size={13} />
                    </View>
                  </View>
                  <Text style={styles.settlementAgreementRouteLabel}>fuera de Cuentas Claras</Text>
                </View>
                <View style={styles.settlementAgreementPerson}>
                  <Avatar color={to?.avatarColor ?? colors.primary} label={to?.name ?? "B"} />
                  <Text numberOfLines={1} style={styles.settlementAgreementPersonName}>{to?.name ?? "Integrante"}</Text>
                  <Text style={styles.settlementAgreementRole}>recibe</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.settlementAgreementBoundary}>
              <View style={styles.settlementBoundaryIcon}>
                <MaterialCommunityIcons color={colors.primaryDark} name="shield-check-outline" size={19} />
              </View>
              <View style={styles.settlementBoundaryCopy}>
                <Text style={styles.settlementBoundaryTitle}>Cuentas Claras solo guarda el acuerdo</Text>
                <Text style={styles.settlementBoundaryText}>
                  {perspective?.confirmBody ??
                    "Esto solo marca el arreglo como pagado en Cuentas Claras. No mueve dinero ni inicia pagos reales."}
                </Text>
              </View>
            </View>

            <View style={styles.settlementAgreementEffect}>
              <View style={styles.settlementEffectItem}>
                <MaterialCommunityIcons color={colors.due} name="clock-outline" size={18} />
                <Text style={styles.settlementEffectText}>Antes: pendiente en balance</Text>
              </View>
              <MaterialCommunityIcons color={colors.mutedInk} name="arrow-right" size={16} />
              <View style={styles.settlementEffectItem}>
                <MaterialCommunityIcons color={colors.primary} name="check-circle-outline" size={18} />
                <Text style={styles.settlementEffectText}>Después: registrado local</Text>
              </View>
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
          <AppTopBar
            actions={[
              { accessibilityLabel: "Ver actividad", icon: "bell-outline", onPress: () => openTab("activity") },
              { accessibilityLabel: "Abrir perfil", icon: "dots-vertical", onPress: () => openTab("account") },
            ]}
            compact={compact}
            subtitle="Gastos compartidos · MXN"
            testID="premium-app-top-bar"
            title="Cuentas Claras"
          />

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

          {activeTab !== "groups" && activeTab !== "home" ? (
            <WorkspaceContextBar
              compact={compact}
              onSwitch={() => openTab("groups")}
              subtitle={workspaceHint}
              switchLabel={selectedGroup ? "Cambiar" : "Elegir"}
              testID="premium-workspace-context-bar"
              title={selectedGroup ? selectedGroup.name : "Elige un grupo"}
            />
          ) : null}

          {activeTab === "groups" ? renderGroups() : null}
          {activeTab === "home" ? renderWorkspaceHome() : null}
          {activeTab === "balance" ? renderBalance() : null}
          {activeTab === "activity" ? renderActivity() : null}
          {activeTab === "account" ? renderAccount() : null}
        </ScrollView>

        <FeedbackToast
          message={feedback?.message ?? ""}
          testID="local-feedback-toast"
          tone={feedback?.tone}
          visible={Boolean(feedback)}
        />

        <BottomTabBar
          compact={compact}
          onPressTab={(id) => openTab(id as TabId)}
          tabs={tabs.map((tab) => {
            const active = activeTab === tab.id;
            const disabledByContext = Boolean(tab.groupScoped && !selectedGroup);
            const isGroupSwitcher = tab.id === "groups";
            const displayLabel = isGroupSwitcher && selectedGroup ? "Cambiar" : tab.label;
            const accessibilityLabel =
              isGroupSwitcher
                ? selectedGroup
                  ? `Grupos. Cambiar grupo activo. Ahora estás en ${selectedGroup.name}`
                  : "Elegir grupo"
                : selectedGroup
                  ? `${tab.label} de ${selectedGroup.name}`
                  : `${tab.label}. Primero elige un grupo`;
            return {
              accessibilityLabel,
              active,
              disabled: disabledByContext,
              icon: tab.icon,
              id: tab.id,
              label: displayLabel,
              scoped: Boolean(!isGroupSwitcher && selectedGroup),
            };
          })}
          testID="premium-bottom-tab-bar"
        >
          <LocalTrustStrip testID="premium-bottom-trust-strip" />
        </BottomTabBar>
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
  commandAmount: {
    color: colors.primary,
    flexShrink: 1,
    fontSize: 30,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 35,
  },
  commandAmountDue: {
    color: colors.due,
  },
  commandAmountLine: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: spacing.xs,
    minWidth: 0,
  },
  commandBalanceGrid: {
    flexDirection: "column",
    gap: spacing.md,
  },
  commandBalanceLabel: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "800",
    lineHeight: 19,
  },
  commandBalanceMain: {
    backgroundColor: colors.successWash,
    borderRadius: radius.lg,
    flex: 1,
    gap: spacing.sm,
    minHeight: 142,
    minWidth: 0,
    padding: spacing.sm,
  },
  commandCenter: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
    elevation: 3,
  },
  commandCurrency: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "900",
  },
  commandGroup: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minWidth: 0,
  },
  commandGroupCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  commandIdentity: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: 999,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  commandKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  commandMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 15,
  },
  commandMetric: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 70,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  commandMetricDue: {
    color: colors.due,
  },
  commandMetricLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
  },
  commandMetricOk: {
    color: colors.primaryDark,
  },
  commandMetricStack: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  commandMetricValue: {
    color: colors.ink,
    fontSize: typography.small,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 17,
  },
  commandSwitch: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  commandTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
  },
  commandTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  commandTrustCopy: {
    alignSelf: "stretch",
    gap: 1,
    minWidth: 0,
  },
  commandTrustLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  commandTrustRow: {
    alignItems: "stretch",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "column",
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  commandTrustText: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "600",
    lineHeight: 15,
  },
  commandTrustTitle: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 17,
  },
  categoryChoice: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: "31%",
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 74,
    minWidth: 92,
    padding: spacing.sm,
  },
  categoryChoiceActive: {
    backgroundColor: colors.successWash,
    borderColor: colors.primary,
  },
  categoryChoiceText: {
    color: colors.ink,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  categoryChoiceTextActive: {
    color: colors.primaryDark,
    fontWeight: "900",
  },
  categoryListMenu: {
    gap: spacing.xs,
    maxHeight: 360,
  },
  categoryMatrix: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  composerReviewTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  composerSheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
    maxHeight: "92%",
    padding: spacing.md,
  },
  composerTitleBlock: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  captureHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  captureContextChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  captureContextRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  captureContextText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
  },
  captureKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  captureProgressPill: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: 999,
    flex: 1,
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  captureProgressPillActive: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 999,
    flex: 1,
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  captureProgressPills: {
    backgroundColor: colors.canvas,
    borderRadius: 999,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
  },
  captureProgressPillText: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
  },
  captureProgressPillTextActive: {
    color: colors.surface,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
  },
  captureSubtitle: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "700",
    lineHeight: 18,
  },
  captureTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
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
  expenseQuickGrid: {
    gap: spacing.sm,
  },
  expenseRouteStack: {
    gap: spacing.xs,
  },
  expenseAuditAction: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: 999,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
  },
  expenseAuditActionDanger: {
    alignItems: "center",
    backgroundColor: colors.dueWash,
    borderRadius: 999,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
  },
  expenseAuditActionDangerText: {
    color: colors.due,
    fontSize: typography.micro,
    fontWeight: "900",
  },
  expenseAuditActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xs,
  },
  expenseAuditActionText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "900",
  },
  expenseSelectRow: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.ink,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  heroCardCompact: {
    gap: spacing.sm,
    padding: spacing.md,
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
    minHeight: 48,
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
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
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
    backgroundColor: colors.surfaceStrong,
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
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
    backgroundColor: colors.canvas,
    borderColor: "transparent",
    borderRadius: radius.lg,
    borderWidth: 0,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
  moneyMetricDue: {
    color: colors.due,
  },
  moneyMetricLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  moneyMetricOk: {
    color: colors.primaryDark,
  },
  moneyMetricPill: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: radius.lg,
    flex: 1,
    gap: 2,
    minHeight: 58,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  moneyMetricValue: {
    color: colors.ink,
    fontSize: typography.small,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 17,
  },
  moneyPeaceIcon: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  moneyPeaceState: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  moneyRoom: {
    gap: spacing.md,
  },
  moneyRoomGroup: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minWidth: 0,
  },
  moneyRoomGroupCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  moneyRoomHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  moneyRoomHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 4,
  },
  moneyRoomKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  moneyRoomMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 15,
  },
  moneyRoomSwitch: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  moneyRoomTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
  },
  moneyRouteCue: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 18,
  },
  moneyRouteHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  moneyRouteKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  moneyRouteLink: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: 999,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
  },
  moneyRouteLinkText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "900",
  },
  moneyRouteStage: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  moneyRouteTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  moneyScene: {
    backgroundColor: colors.successWash,
    borderRadius: radius.lg,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
  },
  moneySceneAmount: {
    color: colors.primary,
    flexShrink: 1,
    fontSize: 36,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 41,
    textAlign: "right",
  },
  moneySceneAmountCompact: {
    fontSize: 32,
    lineHeight: 37,
  },
  moneySceneAmountDue: {
    color: colors.due,
  },
  moneySceneAmountWrap: {
    alignItems: "flex-end",
    flex: 1,
    minWidth: 0,
  },
  moneySceneAmountWrapCompact: {
    flex: 1.2,
  },
  moneySceneBalance: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  moneySceneCopy: {
    flexShrink: 0,
    gap: 1,
    width: 104,
  },
  moneySceneCopyCompact: {
    width: 82,
  },
  moneySceneCurrency: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
  },
  moneySceneDue: {
    color: colors.due,
  },
  moneySceneFooter: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  moneySceneIdentity: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.76)",
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 46,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  moneySceneLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
  },
  moneySceneState: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  moneySceneTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
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
    borderRadius: radius.lg,
    borderWidth: 0,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 74,
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
    backgroundColor: colors.surfaceStrong,
    borderRadius: 999,
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
  commandCanvas: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    overflow: "hidden",
    padding: spacing.sm,
    shadowColor: colors.ink,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 28,
    elevation: 4,
  },
  commandTopbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  commandGroupSwitch: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  odCommandGroupCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  odCommandKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  odCommandTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 19,
  },
  odCommandMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 14,
  },
  commandTrustChip: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: radius.md,
    flexShrink: 0,
    gap: 2,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: spacing.sm,
    width: 76,
  },
  odCommandTrustText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 12,
    textAlign: "center",
  },
  instrumentPeaceLine: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.sm,
  },
  instrumentPeaceText: {
    color: colors.primaryDark,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "900",
    lineHeight: 17,
  },
  peopleStrip: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  peopleStripHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  peopleStripTitle: {
    color: colors.ink,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  peopleStripMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
  },
  peopleStripRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  peopleStripPerson: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 46,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
  },
  peopleStripPersonActive: {
    backgroundColor: colors.successWash,
    borderColor: colors.primary,
  },
  peopleStripName: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
  },
  peopleOrbit: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  peopleOrbitCheck: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    position: "absolute",
    right: 8,
    top: 8,
    width: 20,
  },
  peopleOrbitHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  peopleOrbitMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
  },
  peopleOrbitName: {
    color: colors.ink,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
    maxWidth: 64,
    textAlign: "center",
  },
  peopleOrbitPerson: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 76,
    minWidth: 0,
    padding: spacing.xs,
  },
  peopleOrbitPersonActive: {
    backgroundColor: colors.successWash,
    borderColor: colors.primary,
  },
  peopleOrbitPersonFirst: {
    marginLeft: 0,
  },
  peopleOrbitRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  peopleOrbitTitle: {
    color: colors.ink,
    fontSize: typography.micro,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  actionDock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
    shadowColor: colors.ink,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 2,
  },
  actionDockCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  actionDockIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  actionDockLabel: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 19,
  },
  actionDockMeta: {
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 15,
  },
  actionDockPrimary: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 62,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionDockSecondary: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.sm,
  },
  actionDockSecondaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionDockSecondaryText: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: "900",
    lineHeight: 17,
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
  balanceCockpit: {
    gap: spacing.md,
  },
  balanceMap: {
    gap: spacing.md,
  },
  balanceMapHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  balanceMapTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  balanceMapTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  balanceMapKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  balanceMapTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
  },
  balanceMapMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 15,
  },
  balanceMapAmountRow: {
    alignItems: "flex-end",
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  balanceMapStatus: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  balanceMapStatusLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  balanceMapStatusText: {
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  balanceMapStatusDue: {
    color: colors.due,
  },
  balanceMapStatusOk: {
    color: colors.primaryDark,
  },
  balanceMapAmountBlock: {
    alignItems: "flex-end",
    flex: 1,
    minWidth: 0,
  },
  balanceMapCurrency: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
  },
  balanceMapAmount: {
    fontSize: 28,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 33,
    textAlign: "right",
  },
  balanceMapAmountDue: {
    color: colors.due,
  },
  balanceMapAmountOk: {
    color: colors.primary,
  },
  balanceMapMetrics: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  balanceMapMetric: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    flex: 1,
    gap: 2,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  balanceMapMetricLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  balanceMapMetricValue: {
    color: colors.ink,
    fontSize: typography.heading,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 22,
  },
  settlementMapFigure: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  settlementMapCopyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  settlementMapCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  settlementMapRouteText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  settlementMapRouteMeta: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "700",
    lineHeight: 18,
  },
  settlementMapPeace: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 72,
    padding: spacing.md,
  },
  routeChipRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  routeChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  routeChipAmount: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 14,
  },
  memberLedgerPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  memberLedgerHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  memberLedgerTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
  },
  memberLedgerMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    paddingTop: 2,
    textTransform: "uppercase",
  },
  memberLedgerList: {
    gap: spacing.sm,
  },
  balanceHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  balanceHeroAmount: {
    color: colors.ink,
    fontSize: typography.heading,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 22,
  },
  balanceHeroAmountDue: {
    color: colors.due,
  },
  balanceHeroAmountOk: {
    color: colors.primaryDark,
  },
  balanceHeroKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  balanceHeroStat: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    flex: 1,
    gap: spacing.xs,
    minHeight: 70,
    padding: spacing.md,
  },
  balanceHeroStats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  balanceHeroTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
  },
  balanceHeroTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  balanceRouteStage: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
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
  activityExpense: {
    backgroundColor: colors.warmWash,
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
  activityRowShell: {
    gap: spacing.xs,
  },
  activityMember: {
    backgroundColor: colors.blueWash,
  },
  activitySettlement: {
    backgroundColor: colors.surfaceTinted,
  },
  activityStream: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  activityStreamHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  activityStreamKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  activityStreamReset: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
  },
  activityStreamResetText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "900",
  },
  activityStreamTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 38,
    justifyContent: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    width: 38,
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
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    minHeight: 126,
    padding: spacing.md,
  },
  groupCardSelected: {
    backgroundColor: colors.surfaceTinted,
    borderColor: "rgba(8, 127, 106, 0.24)",
  },
  groupCardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  groupEnterIcon: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  groupLobby: {
    gap: spacing.md,
  },
  groupLobbyActive: {
    backgroundColor: colors.successWash,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.md,
  },
  groupLobbyActiveCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  groupLobbyActiveMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 15,
  },
  groupLobbyActiveName: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
  },
  groupLobbyActiveTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  groupLobbyAmount: {
    color: colors.primary,
    fontSize: 30,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 35,
    textAlign: "right",
  },
  groupLobbyAmountWrap: {
    alignItems: "flex-end",
    flex: 1,
    minWidth: 0,
  },
  groupLobbyBalanceLine: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  groupLobbyEmpty: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 64,
    padding: spacing.md,
  },
  groupLobbyEmptyText: {
    color: colors.mutedInk,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "700",
    lineHeight: 18,
  },
  groupLobbyEnter: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  groupLobbyEnterText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: "900",
  },
  groupLobbyForm: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.md,
  },
  groupFlowTab: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.sm,
  },
  groupFlowTabActive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  groupFlowTabs: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
  },
  groupFlowTabText: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 18,
  },
  groupFlowTabTextActive: {
    color: colors.primaryDark,
    fontWeight: "900",
  },
  groupJoinCue: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderColor: "rgba(8, 127, 106, 0.14)",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  groupJoinCueText: {
    color: colors.primaryDark,
    flex: 1,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 16,
  },
  groupLobbyHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  groupLobbyKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  groupLobbyList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  groupLobbyListHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingBottom: spacing.xs,
  },
  groupLobbyListTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  groupLobbyText: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 18,
  },
  groupLobbyTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
  },
  groupLobbyTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  groupLobbyTrustRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  groupLobbyTrustText: {
    color: colors.mutedInk,
    flex: 1,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 15,
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
    alignItems: "stretch",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 64,
  },
  groupRoutePreview: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  groupCardAmountRail: {
    alignItems: "flex-end",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    flex: 0.78,
    justifyContent: "center",
    minWidth: 116,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  groupCardAmount: {
    fontSize: typography.small,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 17,
    textAlign: "right",
  },
  groupCardAmountDue: {
    color: colors.due,
  },
  groupCardAmountOk: {
    color: colors.primaryDark,
  },
  groupWorkspaceFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  groupWorkspaceFooterText: {
    color: colors.mutedInk,
    flex: 1,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 15,
  },
  groupPeopleBadge: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    flexShrink: 0,
    gap: 0,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: spacing.sm,
  },
  groupPeopleBadgeCount: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: "900",
    lineHeight: 16,
  },
  groupPeopleBadgeText: {
    color: colors.mutedInk,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
  groupPeopleCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  groupPeopleMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 15,
  },
  groupPeopleText: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
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
    flex: 1,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  groupNameLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  groupOpenAmount: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 1,
  },
  groupOpenLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
  },
  groupTitleWrap: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  groupPreview: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 38,
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
  groupSelectorCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  groupSelectorIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  groupSelectorIntro: {
    alignItems: "center",
    backgroundColor: colors.surfaceTinted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 62,
    padding: spacing.sm,
  },
  groupSelectorText: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "600",
    lineHeight: 15,
  },
  groupSelectorTitle: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
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
  ledgerAmount: {
    color: colors.ink,
    fontSize: typography.heading,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 22,
    textAlign: "right",
  },
  ledgerAmountBlock: {
    alignItems: "flex-end",
    flexShrink: 0,
    minWidth: 106,
  },
  ledgerAmountDue: {
    color: colors.due,
  },
  ledgerAmountSuccess: {
    color: colors.primary,
  },
  ledgerActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  ledgerCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  ledgerCurrency: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
  },
  ledgerExplanation: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 18,
  },
  ledgerList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  ledgerDayCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    overflow: "hidden",
    padding: spacing.md,
  },
  ledgerDayHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  ledgerDayTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 20,
    textTransform: "capitalize",
  },
  ledgerHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  auditHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  auditHeroTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  auditSeal: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderColor: "rgba(8, 127, 106, 0.18)",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  auditDemoButton: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  auditDemoText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "900",
  },
  auditSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  auditSummaryItem: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    flex: 1,
    gap: 2,
    minHeight: 52,
    minWidth: 88,
    padding: spacing.sm,
  },
  auditSummaryItemWide: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    flexBasis: "100%",
    gap: 2,
    minHeight: 52,
    padding: spacing.sm,
  },
  auditSummaryValue: {
    color: colors.ink,
    fontSize: typography.heading,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 22,
  },
  auditSummaryMoney: {
    color: colors.ink,
    fontSize: typography.heading,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 22,
  },
  latestProofCard: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderColor: "rgba(8, 127, 106, 0.18)",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 72,
    padding: spacing.sm,
  },
  latestProofIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  latestProofCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  latestProofTitle: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "900",
    lineHeight: 17,
  },
  latestProofMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
  },
  ledgerHeroCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  ledgerHeroIcon: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  ledgerHeroText: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 18,
  },
  ledgerHeroTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
  },
  ledgerHeroTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  ledgerKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  ledgerMetric: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    flex: 1,
    gap: 2,
    minHeight: 62,
    padding: spacing.sm,
  },
  ledgerMetricDue: {
    color: colors.due,
  },
  ledgerMetricLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  ledgerMetricOk: {
    color: colors.primaryDark,
  },
  ledgerMetricRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  ledgerMetricValue: {
    color: colors.ink,
    fontSize: typography.micro,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 15,
  },
  ledgerName: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 19,
  },
  ledgerNameLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  ledgerRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 78,
    padding: spacing.md,
  },
  ledgerStory: {
    gap: spacing.md,
  },
  ledgerTimeline: {
    gap: spacing.md,
  },
  ledgerTrustStrip: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.warmWash,
    borderRadius: 999,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 30,
    paddingHorizontal: spacing.sm,
  },
  ledgerTrustText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "800",
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
  memberManagerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  memberManagerItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  memberManagerList: {
    gap: spacing.sm,
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
  profileAvatarBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: 9,
    borderWidth: 2,
    bottom: -1,
    height: 18,
    justifyContent: "center",
    position: "absolute",
    right: -1,
    width: 18,
  },
  profileAvatarPlate: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "rgba(8, 127, 106, 0.16)",
    borderRadius: 30,
    borderWidth: 1,
    height: 60,
    justifyContent: "center",
    position: "relative",
    width: 60,
  },
  profileCenter: {
    gap: spacing.md,
  },
  profileHeroName: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
  },
  profileKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  profileModeBadge: {
    backgroundColor: colors.warmWash,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  profileModeBadgeText: {
    color: colors.terracotta,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
  },
  profileOnboarding: {
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  profileOnboardingIcon: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  profileOnboardingText: {
    color: colors.mutedInk,
    fontSize: typography.body,
    fontWeight: "600",
    lineHeight: 21,
  },
  profilePanelTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
  },
  profilePeopleList: {
    gap: spacing.sm,
  },
  profilePersonaHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  profilePersonaTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  profilePersonaPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  profileTrustHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  profileTrustPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  profileTrustRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  profileTrustRailItem: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderColor: "rgba(8, 127, 106, 0.13)",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  profileTrustRailText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
  },
  profileVault: {
    backgroundColor: colors.successWash,
    borderColor: "rgba(8, 127, 106, 0.16)",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
  },
  profileVaultBody: {
    gap: spacing.sm,
  },
  profileVaultCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  profileVaultEmail: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 18,
  },
  profileVaultGroup: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 62,
    padding: spacing.sm,
  },
  profileVaultGroupCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  profileVaultGroupIcon: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  profileVaultGroupName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 19,
  },
  profileVaultHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  profileVaultMicro: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
  },
  profileVaultName: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
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
    backgroundColor: "rgba(255, 255, 255, 0.22)",
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
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: radius.lg,
    borderWidth: 0,
    flexDirection: "row",
    gap: spacing.sm,
    padding: 0,
  },
  routeActionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  routeActionText: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "700",
    lineHeight: 18,
  },
  routePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  routePanelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  routePanelKicker: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
  },
  routePanelLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 32,
  },
  routePanelLinkText: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: "800",
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
  confirmEyebrow: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
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
  settlementAgreementAmount: {
    color: colors.primaryDark,
    fontSize: typography.heading,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 22,
    textAlign: "center",
  },
  settlementAgreementAmountCompact: {
    fontSize: typography.body,
    lineHeight: 20,
  },
  settlementAgreementBoundary: {
    alignItems: "flex-start",
    backgroundColor: colors.successWash,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    width: "100%",
  },
  settlementAgreementCard: {
    alignItems: "stretch",
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  settlementAgreementDot: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: 13,
    borderWidth: 2,
    height: 26,
    justifyContent: "center",
    marginTop: -10,
    width: 26,
  },
  settlementAgreementEffect: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    padding: spacing.sm,
    width: "100%",
  },
  settlementAgreementHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  settlementAgreementMiddle: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  settlementAgreementMiddleCompact: {
    width: "100%",
  },
  settlementAgreementPerson: {
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 64,
  },
  settlementAgreementPersonName: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "900",
    lineHeight: 17,
    maxWidth: 76,
    textAlign: "center",
  },
  settlementAgreementRole: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
  },
  settlementAgreementRoute: {
    alignItems: "center",
    backgroundColor: colors.surfaceTinted,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    width: "100%",
  },
  settlementAgreementRouteCompact: {
    flexDirection: "column",
    justifyContent: "space-around",
  },
  settlementAgreementRouteLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 15,
    textAlign: "center",
  },
  settlementAgreementTitleWrap: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  settlementAgreementTrack: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 6,
  },
  settlementBoundaryCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  settlementBoundaryIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  settlementBoundaryText: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 18,
  },
  settlementBoundaryTitle: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "900",
    lineHeight: 17,
  },
  settlementEffectItem: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minWidth: 0,
  },
  settlementEffectText: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 15,
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
  settlementLadder: {
    gap: spacing.sm,
  },
  settlementRouteAmount: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 19,
    textAlign: "center",
  },
  settlementRouteAvatarBlock: {
    alignItems: "center",
    gap: spacing.xs,
    width: 58,
  },
  settlementRouteCard: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  settlementRouteCardCompact: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  settlementRouteDot: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.primary,
    borderColor: colors.canvas,
    borderRadius: 13,
    borderWidth: 2,
    height: 26,
    justifyContent: "center",
    marginTop: -10,
    width: 26,
  },
  settlementRouteFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  settlementRouteMiddle: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  settlementRouteName: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "900",
    lineHeight: 16,
    textAlign: "center",
  },
  settlementRouteTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 17,
  },
  settlementRouteTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  settlementRouteTrack: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 6,
    width: "100%",
  },
  settlementRouteVerb: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
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
  moneyPathCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  moneyPathIcon: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  moneyPathBridge: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  moneyPathBridgeDot: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  moneyPathBridgeLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
  },
  moneyPathLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  moneyPathRow: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 64,
    padding: spacing.sm,
  },
  moneyPathValue: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 19,
  },
  participantCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  participantMiniOverlap: {
    marginLeft: -20,
  },
  participantMiniStack: {
    alignItems: "center",
    flexDirection: "row",
    minWidth: 52,
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
  receiptAmountBlock: {
    backgroundColor: colors.successWash,
    borderRadius: radius.lg,
    gap: spacing.xs,
    padding: spacing.md,
  },
  receiptAmountInput: {
    color: colors.primary,
    flex: 1,
    fontSize: 42,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 48,
    minHeight: 52,
    padding: 0,
  },
  receiptAmountLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  receiptCategoryButton: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    minWidth: 0,
    padding: spacing.sm,
  },
  receiptCategoryCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  receiptCategoryLabel: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 19,
  },
  receiptComposer: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  receiptCurrency: {
    color: colors.primaryDark,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
  },
  receiptKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  receiptObjectCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  receiptObjectIcon: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  receiptObjectMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 15,
  },
  receiptObjectTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  receiptObjectTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  receiptTitleInput: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "800",
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  receiptTopLine: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: spacing.sm,
  },
  sharePreviewAmount: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  sharePreviewAmountBlock: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 1,
  },
  sharePreviewAmountLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 14,
  },
  sharePreviewBarFill: {
    borderRadius: 999,
    height: 7,
    width: "100%",
  },
  sharePreviewBarTrack: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 7,
    overflow: "hidden",
  },
  sharePreviewCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  sharePreviewGrid: {
    gap: spacing.xs,
  },
  sharePreviewName: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "800",
  },
  sharePreviewNameLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  sharePreviewRow: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    alignSelf: "flex-start",
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
  splitEditor: {
    gap: spacing.xs,
  },
  splitEditorCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  splitEditorError: {
    color: colors.due,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 15,
  },
  splitEditorHint: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  splitEditorHintText: {
    color: colors.primaryDark,
    flex: 1,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 15,
  },
  splitEditorInput: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    minWidth: 0,
    padding: 0,
    textAlign: "right",
  },
  splitEditorInputShell: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 0,
    gap: spacing.xs,
    minHeight: 40,
    width: 154,
    paddingHorizontal: spacing.sm,
  },
  splitEditorList: {
    gap: spacing.xs,
  },
  splitEditorMeta: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 14,
  },
  splitEditorName: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "900",
    lineHeight: 17,
  },
  splitEditorPrefix: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: "900",
  },
  splitEditorRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  splitEditorSuffix: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "800",
  },
  splitEditorUnitsInput: {
    minWidth: 28,
  },
  splitModeTab: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.xs,
  },
  splitModeTabActive: {
    backgroundColor: colors.successWash,
    borderColor: colors.primary,
  },
  splitModeTabs: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  splitModeText: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
  },
  splitModeTextActive: {
    color: colors.primaryDark,
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
  splitImpactAmount: {
    color: colors.primaryDark,
    fontSize: typography.heading,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 22,
  },
  splitImpactLabel: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  splitImpactMore: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  splitImpactPanel: {
    backgroundColor: colors.surfaceTinted,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.md,
  },
  splitImpactRule: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 999,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
  },
  splitImpactRuleCompact: {
    alignSelf: "flex-start",
  },
  splitImpactRuleText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "900",
  },
  splitImpactSegment: {
    flex: 1,
    minWidth: 10,
  },
  splitImpactTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  splitImpactTopCompact: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: spacing.xs,
  },
  splitImpactTotal: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  splitImpactTrack: {
    borderRadius: 999,
    flexDirection: "row",
    gap: 2,
    height: 12,
    overflow: "hidden",
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
