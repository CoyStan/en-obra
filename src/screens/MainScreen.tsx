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

const tabs: { id: TabId; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; groupScoped?: boolean }[] = [
  { id: "groups", label: "Grupos", icon: "account-switch" },
  { id: "activity", label: "Actividad", icon: "history", groupScoped: true },
  { id: "balance", label: "Balance", icon: "scale-balance", groupScoped: true },
  { id: "account", label: "Perfil", icon: "account-circle", groupScoped: true },
];

const firstGroupWorkspaceTab: TabId = "activity";

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
    <View style={styles.ledgerRow}>
      <Avatar color={balance.member.avatarColor} label={balance.member.name} />
      <View style={styles.ledgerCopy}>
        <View style={styles.ledgerNameLine}>
          <Text numberOfLines={1} style={styles.ledgerName}>{balance.member.name}</Text>
          <Pill label={status.label} tone={status.tone} />
        </View>
        <Text numberOfLines={2} style={styles.ledgerExplanation}>{describeBalance(balance)}</Text>
      </View>
      <View style={styles.ledgerAmountBlock}>
        <Text style={styles.ledgerCurrency}>MXN</Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.ledgerAmount,
            amountTone === "due" && styles.ledgerAmountDue,
            amountTone === "success" && styles.ledgerAmountSuccess,
          ]}
        >
          {formatHeroMoney(Math.abs(balance.netCents))}
        </Text>
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
      ? "Todo el grupo"
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

  const openGroupWorkspace = (groupId: string) => {
    selectGroup(groupId);
    setShowGroupForm(false);
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

    return (
      <View style={styles.workspaceHome}>
        <View style={styles.commandCenter}>
          <View style={styles.commandTop}>
            <View style={styles.commandGroup}>
              <GroupObject group={selectedGroup} size="large" />
              <View style={styles.commandGroupCopy}>
                <Text numberOfLines={1} style={styles.commandKicker}>Grupo activo</Text>
                <Text numberOfLines={1} style={styles.commandTitle}>{selectedGroup.name}</Text>
                <Text style={styles.commandMeta}>MXN · {selectedMembers.length} integrantes · Demo local</Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Cambiar grupo activo"
              accessibilityRole="button"
              hitSlop={4}
              onPress={() => openTab("groups")}
              style={({ pressed }) => [styles.commandSwitch, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color={colors.primaryDark} name="swap-horizontal" size={16} />
            </Pressable>
          </View>

          <View style={styles.commandBalanceGrid}>
            <View style={styles.commandBalanceMain}>
              <Pressable
                accessibilityHint="Abre perfil o cambia tu integrante del grupo."
                accessibilityLabel={identityLabel}
                accessibilityRole="button"
                hitSlop={4}
                onPress={openIdentity}
                style={({ pressed }) => [styles.commandIdentity, pressed && styles.pressed]}
              >
                <Avatar color={displayMember?.avatarColor ?? colors.primary} label={displayMember?.name ?? "Yo"} />
                <View style={styles.identityCopy}>
                  <Text numberOfLines={1} style={styles.identityLabel}>{identityLabel}</Text>
                  <Text numberOfLines={1} style={styles.identityMeta}>{identityMeta}</Text>
                </View>
                <MaterialCommunityIcons color={colors.primaryDark} name="chevron-down" size={18} />
              </Pressable>

              <Text style={styles.commandBalanceLabel}>{personalBalanceState.label}</Text>
              <View style={styles.commandAmountLine}>
                <Text style={styles.commandCurrency}>MXN</Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.commandAmount,
                    personalBalanceState.tone === "due" && styles.commandAmountDue,
                  ]}
                >
                  {heroAmountText}
                </Text>
              </View>
            </View>

            <View style={styles.commandMetricStack}>
              <View style={styles.commandMetric}>
                <Text style={styles.commandMetricLabel}>Gastado</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.commandMetricValue}>
                  {formatMoney(activeGroupSummary.totalSpentCents)}
                </Text>
              </View>
              <View style={styles.commandMetric}>
                <Text style={styles.commandMetricLabel}>Abierto</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.commandMetricValue,
                    activeGroupSummary.openBalanceCents ? styles.commandMetricDue : styles.commandMetricOk,
                  ]}
                >
                  {formatMoney(activeGroupSummary.openBalanceCents)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.commandTrustRow}>
            <View style={styles.commandTrustLine}>
              <AvatarStack members={selectedMembers} limit={4} />
              <View style={styles.noPaymentChip}>
                <MaterialCommunityIcons color={colors.mutedInk} name="shield-check-outline" size={14} />
                <Text style={styles.noPaymentText}>Sin pagos reales</Text>
              </View>
            </View>
            <View style={styles.commandTrustCopy}>
              <Text style={styles.commandTrustTitle}>Registro local para ponerse de acuerdo</Text>
              <Text style={styles.commandTrustText}>No mueve dinero, no usa backend y no cobra pagos.</Text>
            </View>
          </View>
        </View>

        {personalSettlement ? (
          <View style={styles.routePanel}>
            <View style={styles.routePanelHeader}>
              <Text style={styles.routePanelKicker}>Siguiente arreglo</Text>
              <Pressable
                accessibilityLabel="Ver balance completo"
                accessibilityRole="button"
                hitSlop={4}
                onPress={() => setActiveTab("balance")}
                style={({ pressed }) => [styles.routePanelLink, pressed && styles.pressed]}
              >
                <Text style={styles.routePanelLinkText}>Ver todo</Text>
                <MaterialCommunityIcons color={colors.primaryDark} name="arrow-right" size={14} />
              </Pressable>
            </View>
            <MoneyFlowFigure
              amountCents={personalSettlement.amountCents}
              from={personalSettlementFrom}
              progress={moneyFlowProgress}
              reduceMotion={reduceMotion}
              to={personalSettlementTo}
            />
            <View style={styles.routeActionRow}>
              <Text numberOfLines={2} style={styles.routeActionText}>{personalCue}</Text>
              <ActionButton
                icon="check"
                label="Liquidar"
                onPress={() => setPendingSettlement(personalSettlement)}
                tone="secondary"
              />
            </View>
          </View>
        ) : (
          <View style={styles.routePanel}>
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

        <View style={styles.quickActionRail}>
          <QuickActionTile
            disabled={selectedMembers.length === 0}
            icon="receipt-text-plus"
            label="Agregar gasto"
            onPress={() => setShowExpenseForm(true)}
            primary
          />
          <QuickActionTile
            detail={selectedSummary.settlements.length ? `${selectedSummary.settlements.length} abiertos` : "En paz"}
            icon="scale-balance"
            label="Balance"
            onPress={() => setActiveTab("balance")}
          />
          <QuickActionTile
            detail={`${activity.length} movimientos`}
            icon="history"
            label="Historial"
            onPress={() => setActiveTab("activity")}
          />
        </View>

        <Section
          action={<ActionButton icon="restore" label="Demo" onPress={resetDemo} tone="ghost" />}
          title="Actividad reciente"
        >
          {activity.length === 0 ? (
            <EmptyState
              body="Cuando agregues gastos o marques arreglos, aparecerán aquí."
              icon="receipt-text-plus"
              title="Aún no hay actividad"
            />
          ) : (
            activity.slice(0, 5).map((item) => <ActivityRow item={item} key={item.id} />)
          )}
        </Section>
      </View>
    );
  };

  const renderGroups = () => (
    <View style={styles.tabContent}>
      <View style={styles.groupSelectorIntro}>
        <View style={styles.groupSelectorIcon}>
          <MaterialCommunityIcons color={colors.primaryDark} name="account-switch-outline" size={18} />
        </View>
        <View style={styles.groupSelectorCopy}>
          <Text style={styles.groupSelectorTitle}>
            {selectedGroup ? "Cambia el grupo activo" : "Elige un grupo para empezar"}
          </Text>
          <Text style={styles.groupSelectorText}>
            Al seleccionar uno, se abre su Actividad. Balance y Perfil quedan ligados a ese grupo.
          </Text>
        </View>
      </View>
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
              onPress={() => openGroupWorkspace(group.id)}
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
        <View style={styles.balanceCockpit}>
          <View style={styles.balanceHero}>
            <View style={styles.balanceHeroTop}>
              <View>
                <Text style={styles.balanceHeroKicker}>Balance de grupo</Text>
                <Text style={styles.balanceHeroTitle}>{selectedGroup.name}</Text>
              </View>
              <View style={styles.noPaymentChip}>
                <MaterialCommunityIcons color={colors.mutedInk} name="shield-check-outline" size={14} />
                <Text style={styles.noPaymentText}>Sin pagos reales</Text>
              </View>
            </View>
            <View style={styles.balanceHeroStats}>
              <View style={styles.balanceHeroStat}>
                <Text style={styles.commandMetricLabel}>Abierto</Text>
                <Text style={[styles.balanceHeroAmount, selectedSummary.openBalanceCents ? styles.balanceHeroAmountDue : styles.balanceHeroAmountOk]}>
                  {formatMoney(selectedSummary.openBalanceCents)}
                </Text>
              </View>
              <View style={styles.balanceHeroStat}>
                <Text style={styles.commandMetricLabel}>Arreglos</Text>
                <Text style={styles.balanceHeroAmount}>{selectedSummary.settlements.length}</Text>
              </View>
            </View>
          </View>

          {selectedSummary.settlements.length === 0 ? (
            <View style={styles.routePanel}>
              <View style={styles.calmFigure}>
                <View style={styles.calmFigureIcon}>
                  <MaterialCommunityIcons color={colors.primaryDark} name="check-decagram-outline" size={22} />
                </View>
                <View style={styles.calmFigureCopy}>
                  <Text style={styles.moneyFlowAmount}>Todo en paz</Text>
                  <Text style={styles.calmFigureText}>No hay pagos pendientes para este grupo.</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.balanceRouteStage}>
              <View style={styles.routePanelHeader}>
                <Text style={styles.routePanelKicker}>Ruta principal</Text>
                <Pill label={`${selectedSummary.settlements.length} pendientes`} tone="gold" />
              </View>
              <SettlementRouteCard
                activeMemberId={displayMemberId}
                data={data}
                onPress={() => setPendingSettlement(selectedSummary.settlements[0])}
                settlement={selectedSummary.settlements[0]}
              />
              <ActionButton
                icon="check"
                label="Registrar arreglo local"
                onPress={() => setPendingSettlement(selectedSummary.settlements[0])}
                tone="secondary"
              />
            </View>
          )}

          {selectedSummary.settlements.length > 1 ? (
            <Section title="Escalera de pagos">
              <View style={styles.settlementLadder}>
                {selectedSummary.settlements.slice(1).map((settlement) => (
                  <SettlementRouteCard
                    activeMemberId={displayMemberId}
                    compact
                    data={data}
                    key={`${settlement.fromMemberId}-${settlement.toMemberId}`}
                    onPress={() => setPendingSettlement(settlement)}
                    settlement={settlement}
                  />
                ))}
              </View>
            </Section>
          ) : null}

          <Section title="Libro de integrantes">
            {selectedMembers.length === 0 ? (
              <EmptyState
                action={<ActionButton icon="account-plus" label="Agregar" onPress={() => setShowMemberForm(true)} />}
                body="Agrega integrantes antes de registrar gastos."
                icon="account-plus"
                title="Aún no hay integrantes"
              />
            ) : (
              <View style={styles.ledgerList}>
                {selectedSummary.balances.map((balance) => (
                  <MemberLedgerRow balance={balance} key={balance.member.id} />
                ))}
              </View>
            )}
          </Section>
        </View>
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
    <View style={styles.profileCenter}>
        {isAccountLoading ? (
          <View style={styles.loadingBand}>
            <MaterialCommunityIcons color={colors.primary} name="progress-clock" size={18} />
            <Text style={styles.loadingText}>Cargando cuenta local...</Text>
          </View>
        ) : account.profile && account.mode === "signed-in" ? (
          <>
            <View style={styles.profileHero}>
              <View style={styles.profileHeroTop}>
                <View style={styles.profileAvatarRing}>
                  <Avatar color={colors.primary} label={account.profile.displayName} />
                </View>
                <View style={styles.profileHeroCopy}>
                  <Text style={styles.profileKicker}>Perfil local</Text>
                  <Text numberOfLines={1} style={styles.profileHeroName}>{account.profile.displayName}</Text>
                  <Text numberOfLines={1} style={styles.profileHeroEmail}>{account.profile.email}</Text>
                </View>
                <Pill label="Demo" tone="gold" />
              </View>

              <View style={styles.profileStatusRail}>
                <View style={styles.profileStatusTile}>
                  <MaterialCommunityIcons color={colors.primaryDark} name="cellphone-lock" size={18} />
                  <Text style={styles.profileStatusLabel}>Local</Text>
                </View>
                <View style={styles.profileStatusTile}>
                  <MaterialCommunityIcons color={colors.primaryDark} name="cloud-off-outline" size={18} />
                  <Text style={styles.profileStatusLabel}>Sin sync</Text>
                </View>
                <View style={styles.profileStatusTile}>
                  <MaterialCommunityIcons color={colors.primaryDark} name="shield-check-outline" size={18} />
                  <Text style={styles.profileStatusLabel}>Sin pagos</Text>
                </View>
              </View>
            </View>

            {selectedGroup ? (
              <View style={styles.profilePersonaPanel}>
                <View style={styles.profilePersonaHeader}>
                  <GroupObject group={selectedGroup} />
                  <View style={styles.groupContextCopy}>
                    <Text style={styles.profileKicker}>Persona en este grupo</Text>
                    <Text style={styles.groupContextName}>{selectedGroup.name}</Text>
                    <Text style={styles.groupContextMeta}>{selectedMembers.length} integrantes · identidad por grupo</Text>
                  </View>
                  <ActionButton icon="swap-horizontal" label="Grupo" onPress={() => openTab("groups")} tone="ghost" />
                </View>

                <View style={styles.profileActivePersona}>
                  <Avatar color={activeGroupMember?.avatarColor ?? displayMember?.avatarColor ?? colors.primary} label={activeGroupMember?.name ?? displayMember?.name ?? "Yo"} />
                  <View style={styles.profileActivePersonaCopy}>
                    <Text style={styles.profileActivePersonaName}>
                      {activeGroupMember ? activeGroupMember.name : "Elige tu integrante"}
                    </Text>
                    <Text style={styles.accountSectionText}>
                      {activeGroupMember
                        ? "Los gastos nuevos empiezan con esta persona."
                        : "Vincula tu sesión a una persona del grupo."}
                    </Text>
                  </View>
                  <ActionButton
                    disabled={!selectedGroup || selectedMembers.length === 0}
                    icon="account-switch"
                    label="Cambiar"
                    onPress={openActiveMemberPicker}
                    tone="secondary"
                  />
                </View>

                <View style={styles.profilePeopleStrip}>
                  {selectedMembers.map((member) => (
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
                        styles.profilePersonChip,
                        activeGroupMember?.id === member.id && styles.profilePersonChipActive,
                      ]}
                    >
                      <Avatar color={member.avatarColor} label={member.name} />
                      <Text numberOfLines={1} style={styles.profilePersonChipText}>{member.name}</Text>
                    </Pressable>
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
                  <Text style={styles.profileTrustTitle}>Confianza y datos</Text>
                  <Text style={styles.accountSectionText}>Demo local para pruebas. Sin backend, sin pagos reales.</Text>
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
        <ScrollView contentContainerStyle={styles.composerSheet} keyboardShouldPersistTaps="handled">
          <View style={styles.sheetHandle} />
          <View style={styles.composerHeader}>
            <View style={styles.composerTitleBlock}>
              <Text style={styles.sheetTitle}>Nuevo gasto</Text>
              <Text style={styles.sheetSubtitle}>
                {selectedGroup?.name ?? "Grupo"} · Registro local en MXN
              </Text>
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

          <View style={styles.receiptComposer}>
            <View style={styles.receiptTopLine}>
              <Pressable
                accessibilityLabel={`Categoría ${selectedCategory.label}`}
                accessibilityRole="button"
                accessibilityState={{ expanded: openExpenseMenu === "category" }}
                hitSlop={4}
                onPress={() => toggleExpenseMenu("category")}
                style={({ pressed }) => [styles.receiptCategoryButton, pressed && styles.pressed]}
              >
                <CategoryObject categoryId={expenseCategoryId} />
                <View style={styles.receiptCategoryCopy}>
                  <Text style={styles.receiptKicker}>Categoría</Text>
                  <Text numberOfLines={1} style={styles.receiptCategoryLabel}>{selectedCategory.label}</Text>
                </View>
                <MaterialCommunityIcons
                  color={colors.primaryDark}
                  name={openExpenseMenu === "category" ? "chevron-up" : "chevron-down"}
                  size={20}
                />
              </Pressable>
              <View style={styles.sheetTrustChip}>
                <MaterialCommunityIcons color={colors.mutedInk} name="shield-check-outline" size={14} />
                <Text style={styles.sheetTrustText}>Sin pagos reales</Text>
              </View>
            </View>

            <AnimatedDropdown open={openExpenseMenu === "category"}>
              <View style={styles.categoryMatrix}>
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
                        styles.categoryChoice,
                        selected && styles.categoryChoiceActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <CategoryObject categoryId={category.id} size="small" />
                      <Text numberOfLines={1} style={[styles.categoryChoiceText, selected && styles.categoryChoiceTextActive]}>
                        {category.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </AnimatedDropdown>

            <View style={styles.receiptAmountBlock}>
              <Text style={styles.receiptKicker}>Monto MXN</Text>
              <View style={styles.receiptAmountLine}>
                <Text style={styles.receiptCurrency}>$</Text>
                <TextInput
                  accessibilityLabel="Monto MXN"
                  keyboardType="decimal-pad"
                  onChangeText={setExpenseAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedInk}
                  style={styles.receiptAmountInput}
                  value={expenseAmount}
                />
              </View>
            </View>

            <TextInput
              accessibilityLabel="Concepto del gasto"
              onChangeText={setExpenseTitle}
              placeholder="¿Qué se pagó? Ej. Tacos después del cine"
              placeholderTextColor={colors.mutedInk}
              style={styles.receiptTitleInput}
              value={expenseTitle}
            />
          </View>

          <View style={styles.composerPathPanel}>
            <View style={styles.composerPathHeader}>
              <Text style={styles.composerSectionTitle}>Ruta del dinero</Text>
              <Pill label="Partes iguales" tone="neutral" />
            </View>

            <Pressable
              accessibilityLabel={`Pagó ${payer?.name ?? "selecciona persona"}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: openExpenseMenu === "payer" }}
              hitSlop={4}
              onPress={() => toggleExpenseMenu("payer")}
              style={({ pressed }) => [styles.moneyPathRow, pressed && styles.pressed]}
            >
              <View style={styles.moneyPathIcon}>
                <MaterialCommunityIcons color={colors.primaryDark} name="cash-plus" size={19} />
              </View>
              {payer ? <Avatar color={payer.avatarColor} label={payer.name} /> : null}
              <View style={styles.moneyPathCopy}>
                <Text style={styles.moneyPathLabel}>Pagó</Text>
                <Text numberOfLines={1} style={styles.moneyPathValue}>
                  {payer?.name ?? "Selecciona quién pagó"}
                </Text>
              </View>
              <MaterialCommunityIcons color={colors.primaryDark} name="chevron-down" size={20} />
            </Pressable>

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

            <Pressable
              accessibilityLabel={`Participan ${participantSummary}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: openExpenseMenu === "participants" }}
              hitSlop={4}
              onPress={() => toggleExpenseMenu("participants")}
              style={({ pressed }) => [styles.moneyPathRow, pressed && styles.pressed]}
            >
              <View style={styles.moneyPathIcon}>
                <MaterialCommunityIcons color={colors.primaryDark} name="account-multiple-check-outline" size={19} />
              </View>
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

            <TextInput
              accessibilityLabel="Nota opcional"
              onChangeText={setExpenseNote}
              placeholder="Nota opcional"
              placeholderTextColor={colors.mutedInk}
              style={styles.composerNoteInput}
              value={expenseNote}
            />
          </View>

          <View style={styles.composerReview}>
            <View style={styles.composerReviewTop}>
              <View style={styles.splitPreviewIcon}>
                <MaterialCommunityIcons color={colors.primaryDark} name="scale-balance" size={18} />
              </View>
              <View style={styles.splitPreviewCopy}>
                <Text style={styles.splitPreviewTitle}>Vista previa</Text>
                <Text style={styles.splitPreviewText}>
                  {participantShares.length
                    ? `${participantShares.length} participantes · ${formatMoney(expenseAmountCents ?? 0)} dividido en MXN`
                    : "Elige monto y participantes para ver cuánto toca."}
                </Text>
              </View>
            </View>

            {participantShares.length ? (
              <View style={styles.sharePreviewGrid}>
                {participantShares.slice(0, 4).map((share) => {
                  const member = findMember(selectedMembers, share.memberId);
                  if (!member) {
                    return null;
                  }
                  return (
                    <View key={share.memberId} style={styles.sharePreviewRow}>
                      <Avatar color={member.avatarColor} label={member.name} />
                      <Text numberOfLines={1} style={styles.sharePreviewName}>{member.name}</Text>
                      <Text style={styles.sharePreviewAmount}>{formatMoney(share.amountCents)}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

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
          </View>
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
            <View style={styles.appBrand}>
              <View style={styles.brandMark}>
                <MaterialCommunityIcons color={colors.surface} name="scale-balance" size={19} />
              </View>
              <View style={styles.appBrandCopy}>
                <Text style={[styles.appTitle, compact && styles.appTitleCompact]}>Cuentas Claras</Text>
                <Text style={styles.appSubtitle}>Gastos compartidos · MXN</Text>
              </View>
            </View>
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

          {activeTab !== "groups" && activeTab !== "activity" ? (
            <View style={[styles.workspaceBar, compact && styles.workspaceBarCompact]}>
              <View style={styles.workspaceBarIcon}>
                <MaterialCommunityIcons color={colors.primaryDark} name="account-group" size={18} />
              </View>
              <View style={styles.workspaceBarCopy}>
                <Text style={styles.workspaceBarKicker}>Grupo activo</Text>
                <Text numberOfLines={1} style={styles.workspaceBarTitle}>
                  {selectedGroup ? selectedGroup.name : "Elige un grupo"}
                </Text>
                <Text numberOfLines={1} style={styles.workspaceBarSubtitle}>{workspaceHint}</Text>
              </View>
              <Pressable
                accessibilityLabel={selectedGroup ? "Cambiar grupo activo" : "Elegir grupo"}
                accessibilityRole="button"
                hitSlop={4}
                onPress={() => openTab("groups")}
                style={({ pressed }) => [styles.workspaceSwitchButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons color={colors.primaryDark} name="swap-horizontal" size={15} />
                <Text style={styles.workspaceSwitchText}>{selectedGroup ? "Cambiar" : "Elegir"}</Text>
              </Pressable>
            </View>
          ) : null}

          {activeTab === "groups" ? renderGroups() : null}
          {activeTab === "balance" ? renderBalance() : null}
          {activeTab === "activity" ? renderWorkspaceHome() : null}
          {activeTab === "account" ? renderAccount() : null}
        </ScrollView>

        <View style={styles.bottomNav}>
          {tabs.map((tab) => {
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
            return (
              <Pressable
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="tab"
                accessibilityState={{ disabled: disabledByContext, selected: active }}
                hitSlop={4}
                key={tab.id}
                onPress={() => openTab(tab.id)}
                style={[
                  styles.navItem,
                  isGroupSwitcher && styles.navGroupSwitcher,
                  !isGroupSwitcher && selectedGroup && styles.navWorkspaceItem,
                  active && styles.navItemActive,
                  disabledByContext && styles.navItemDisabled,
                ]}
              >
                <MaterialCommunityIcons
                  color={disabledByContext ? colors.mutedInk : colors.primaryDark}
                  name={tab.icon}
                  size={20}
                />
                {!isGroupSwitcher && selectedGroup ? <View style={styles.navScopedDot} /> : null}
                <Text
                  style={[
                    styles.navLabel,
                    compact && styles.navLabelCompact,
                    active && styles.navLabelActive,
                    disabledByContext && styles.navLabelDisabled,
                  ]}
                >
                  {displayLabel}
                </Text>
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
    minHeight: 52,
  },
  appBrand: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minWidth: 0,
  },
  appBrandCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  appSubtitle: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
    letterSpacing: 0,
  },
  appTitle: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 29,
  },
  appTitleCompact: {
    fontSize: 22,
    lineHeight: 27,
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
  categoryMatrix: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  composerHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  composerNoteInput: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "600",
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  composerPathHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  composerPathPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  composerReview: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  composerReviewTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  composerSectionTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
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
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderRadius: 0,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: 0,
    paddingVertical: spacing.md,
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
    gap: spacing.xs,
    padding: spacing.xs,
    paddingBottom: Platform.select({ android: spacing.sm, default: spacing.md }),
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
    gap: spacing.sm,
    minHeight: 108,
    padding: spacing.md,
  },
  groupCardSelected: {
    backgroundColor: colors.successWash,
    borderColor: "rgba(8, 127, 106, 0.24)",
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
    backgroundColor: colors.canvas,
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
  workspaceBar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  workspaceBarCompact: {
    minHeight: 50,
  },
  workspaceBarCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  workspaceBarIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  workspaceBarKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "700",
  },
  workspaceBarTitle: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 18,
  },
  workspaceBarSubtitle: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "600",
    lineHeight: 14,
  },
  workspaceSwitchButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  workspaceSwitchText: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "800",
  },
  workspaceHome: {
    gap: spacing.md,
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
    borderRadius: radius.lg,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
  navGroupSwitcher: {
    backgroundColor: colors.canvas,
    flex: 0.88,
  },
  navItemActive: {
    backgroundColor: colors.successWash,
  },
  navItemDisabled: {
    opacity: 0.5,
  },
  navScopedDot: {
    backgroundColor: colors.primary,
    borderRadius: 2,
    height: 3,
    marginTop: -2,
    width: 14,
  },
  navWorkspaceItem: {
    borderColor: "rgba(8, 128, 101, 0.08)",
    borderWidth: 1,
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
  navLabelDisabled: {
    color: colors.mutedInk,
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
  profileActivePersona: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  profileActivePersonaCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  profileActivePersonaName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 19,
  },
  profileAvatarRing: {
    alignItems: "center",
    backgroundColor: colors.successWash,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  profileCenter: {
    gap: spacing.md,
  },
  profileHero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  profileHeroCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  profileHeroEmail: {
    color: colors.mutedInk,
    fontSize: typography.small,
    fontWeight: "600",
    lineHeight: 18,
  },
  profileHeroName: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: "900",
    lineHeight: 22,
  },
  profileHeroTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  profileKicker: {
    color: colors.mutedInk,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
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
  profilePeopleStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  profilePersonaHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  profilePersonaPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  profilePersonChip: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: "30%",
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 72,
    minWidth: 88,
    padding: spacing.sm,
  },
  profilePersonChipActive: {
    backgroundColor: colors.successWash,
    borderColor: colors.primary,
  },
  profilePersonChipText: {
    color: colors.ink,
    fontSize: typography.micro,
    fontWeight: "800",
    lineHeight: 15,
    textAlign: "center",
  },
  profileStatusLabel: {
    color: colors.primaryDark,
    fontSize: typography.micro,
    fontWeight: "900",
    lineHeight: 15,
  },
  profileStatusRail: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  profileStatusTile: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    flex: 1,
    gap: spacing.xs,
    minHeight: 64,
    justifyContent: "center",
    padding: spacing.sm,
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
  profileTrustTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 20,
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
    flex: 1,
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
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  sharePreviewAmount: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
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
