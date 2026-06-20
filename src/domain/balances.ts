import { formatMoney, splitEqual } from "./money";
import type {
  ActivityItem,
  AppData,
  Expense,
  Member,
  MemberBalance,
  SettlementSuggestion,
} from "./types";

type LedgerEntry = {
  member: Member;
  paidCents: number;
  owedCents: number;
  settledCents: number;
  netCents: number;
};

function byDateDesc(left: { createdAt: string }, right: { createdAt: string }) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function memberName(members: Map<string, Member>, id: string) {
  return members.get(id)?.name ?? "Integrante";
}

export function getGroupMembers(data: AppData, groupId: string) {
  const sqlMembers = data.groupMembers?.filter(
    (item) => item.groupId === groupId && !item.leftAt,
  );
  if (sqlMembers?.length) {
    const usersById = new Map((data.users ?? []).map((user) => [user.id, user]));
    return sqlMembers.map((member): Member => {
      const user = usersById.get(member.userId);
      return {
        id: member.id,
        userId: member.userId,
        name: member.displayNameSnapshot || user?.displayName || "Integrante",
        avatarColor: user?.avatarColor ?? "#0F766E",
        role: member.role,
        joinedAt: member.joinedAt,
        leftAt: member.leftAt,
      };
    });
  }

  const group = data.groups.find((item) => item.id === groupId);
  if (!group) {
    return [];
  }

  const membersById = new Map(data.members.map((member) => [member.id, member]));
  return group.memberIds
    .map((memberId) => membersById.get(memberId))
    .filter((member): member is Member => Boolean(member));
}

export function getGroupExpenses(data: AppData, groupId: string) {
  return data.expenses.filter((expense) => expense.groupId === groupId).sort(byDateDesc);
}

export function getGroupSettlements(data: AppData, groupId: string) {
  return data.settlements
    .filter((settlement) => settlement.groupId === groupId && settlement.status === "paid")
    .sort(byDateDesc);
}

function expensePayerId(expense: Expense) {
  return expense.paidByMemberId ?? expense.payerId;
}

function expenseParticipantShares(data: AppData, expense: Expense) {
  const persistedShares = data.expenseParticipants?.filter((share) => share.expenseId === expense.id);
  if (persistedShares?.length) {
    return persistedShares.map((share) => ({
      memberId: share.memberId,
      amountCents: share.shareCents,
    }));
  }
  return splitEqual(expense.amountCents, expense.participantIds);
}

function expenseParticipantCount(data: AppData, expense: Expense) {
  const persistedShares = data.expenseParticipants?.filter((share) => share.expenseId === expense.id);
  return persistedShares?.length || expense.participantIds.length;
}

export function calculateGroupBalances(data: AppData, groupId: string): MemberBalance[] {
  const members = getGroupMembers(data, groupId);
  const ledger = new Map<string, LedgerEntry>(
    members.map((member) => [
      member.id,
      {
        member,
        paidCents: 0,
        owedCents: 0,
        settledCents: 0,
        netCents: 0,
      },
    ]),
  );

  for (const expense of data.expenses.filter((item) => item.groupId === groupId)) {
    const payer = ledger.get(expensePayerId(expense));
    if (payer) {
      payer.paidCents += expense.amountCents;
      payer.netCents += expense.amountCents;
    }

    for (const share of expenseParticipantShares(data, expense)) {
      const participant = ledger.get(share.memberId);
      if (participant) {
        participant.owedCents += share.amountCents;
        participant.netCents -= share.amountCents;
      }
    }
  }

  for (const settlement of getGroupSettlements(data, groupId)) {
    const from = ledger.get(settlement.fromMemberId);
    const to = ledger.get(settlement.toMemberId);
    if (from) {
      from.settledCents += settlement.amountCents;
      from.netCents += settlement.amountCents;
    }
    if (to) {
      to.settledCents -= settlement.amountCents;
      to.netCents -= settlement.amountCents;
    }
  }

  return [...ledger.values()].sort((left, right) => right.netCents - left.netCents);
}

export function simplifySettlements(balances: MemberBalance[]): SettlementSuggestion[] {
  const creditors = balances
    .filter((balance) => balance.netCents > 0)
    .map((balance) => ({ memberId: balance.member.id, amountCents: balance.netCents }))
    .sort((left, right) => right.amountCents - left.amountCents);

  const debtors = balances
    .filter((balance) => balance.netCents < 0)
    .map((balance) => ({ memberId: balance.member.id, amountCents: Math.abs(balance.netCents) }))
    .sort((left, right) => right.amountCents - left.amountCents);

  const suggestions: SettlementSuggestion[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.amountCents, creditor.amountCents);

    if (amountCents > 0) {
      suggestions.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amountCents,
        currency: "MXN",
      });
    }

    debtor.amountCents -= amountCents;
    creditor.amountCents -= amountCents;

    if (debtor.amountCents === 0) {
      debtorIndex += 1;
    }
    if (creditor.amountCents === 0) {
      creditorIndex += 1;
    }
  }

  return suggestions;
}

export function calculateGroupSummary(data: AppData, groupId: string) {
  const expenses = data.expenses.filter((expense) => expense.groupId === groupId);
  const totalSpentCents = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const balances = calculateGroupBalances(data, groupId);
  const openBalanceCents = balances
    .filter((balance) => balance.netCents > 0)
    .reduce((sum, balance) => sum + balance.netCents, 0);

  return {
    balances,
    expenses,
    openBalanceCents,
    settlements: simplifySettlements(balances),
    totalSpentCents,
  };
}

export function getBalancePreview(data: AppData, groupId: string) {
  const balances = calculateGroupBalances(data, groupId);
  const creditor = balances.find((balance) => balance.netCents > 0) ?? null;
  const debtor = [...balances].reverse().find((balance) => balance.netCents < 0) ?? null;

  return { creditor, debtor };
}

export function describeBalance(balance: MemberBalance) {
  const base = `Pagó ${formatMoney(balance.paidCents)} · Le tocaba ${formatMoney(
    balance.owedCents,
  )}`;

  if (balance.settledCents > 0) {
    return `${base} · Ya pagó ${formatMoney(balance.settledCents)}`;
  }

  if (balance.settledCents < 0) {
    return `${base} · Ya recibió ${formatMoney(Math.abs(balance.settledCents))}`;
  }

  return base;
}

export function buildActivity(data: AppData, groupId: string): ActivityItem[] {
  const members = new Map(data.members.map((member) => [member.id, member]));
  const expenses: ActivityItem[] = data.expenses
    .filter((expense): expense is Expense => expense.groupId === groupId)
    .map((expense) => ({
      id: expense.id,
      groupId,
      type: "expense",
      title: expense.title,
      subtitle: `Pagó ${memberName(members, expensePayerId(expense))} · Dividido entre ${
        expenseParticipantCount(data, expense)
      } integrantes`,
      amountCents: expense.amountCents,
      currency: expense.currency,
      createdAt: expense.createdAt,
    }));

  const settlements: ActivityItem[] = getGroupSettlements(data, groupId).map((settlement) => ({
    id: settlement.id,
    groupId,
    type: "settlement",
    title: `${memberName(members, settlement.fromMemberId)} pagó a ${memberName(
      members,
      settlement.toMemberId,
    )}`,
    subtitle: "Marcado pagado localmente · Sin pagos reales",
    amountCents: settlement.amountCents,
    currency: settlement.currency,
    createdAt: settlement.recordedAt ?? settlement.createdAt,
  }));

  return [...expenses, ...settlements].sort(byDateDesc);
}
