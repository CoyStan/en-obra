import { normalizeAppData } from "../domain/appDataNormalization";
import { splitEqual } from "../domain/money";
import type {
  ActivityEvent,
  AppData,
  Expense,
  ExpenseParticipant,
  Group,
  GroupMember,
  Settlement,
  SyncOutboxItem,
} from "../domain/types";

export type IntegritySeverity = "warning" | "repairable" | "fatal";

export type IntegrityIssue = {
  code: string;
  severity: IntegritySeverity;
  message: string;
  entityId?: string;
};

export type IntegrityResult = {
  data: AppData;
  issues: IntegrityIssue[];
};

function issue(
  code: string,
  severity: IntegritySeverity,
  message: string,
  entityId?: string,
): IntegrityIssue {
  return { code, severity, message, entityId };
}

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: number) {
  return Number.isInteger(value) && value >= 0;
}

function groupMemberIds(groupMembers: GroupMember[], groupId: string) {
  return new Set(
    groupMembers
      .filter((member) => member.groupId === groupId && !member.leftAt)
      .map((member) => member.id),
  );
}

function syncGroupMemberIds(groups: Group[], groupMembers: GroupMember[]) {
  return groups.map((group) => ({
    ...group,
    memberIds: groupMembers
      .filter((member) => member.groupId === group.id && !member.leftAt)
      .map((member) => member.id),
  }));
}

function validPayload(item: SyncOutboxItem) {
  try {
    JSON.parse(item.payloadJson);
    return true;
  } catch {
    return false;
  }
}

export function auditAppDataIntegrity(input: AppData): IntegrityIssue[] {
  const data = normalizeAppData(input);
  const issues: IntegrityIssue[] = [];
  const userIds = new Set((data.users ?? []).filter((user) => !user.deletedAt).map((user) => user.id));
  const groupIds = new Set(data.groups.filter((group) => !group.archivedAt).map((group) => group.id));
  const memberIds = new Set((data.groupMembers ?? []).filter((member) => !member.leftAt).map((member) => member.id));
  const expenseIds = new Set(data.expenses.filter((expense) => !expense.deletedAt).map((expense) => expense.id));

  if (!groupIds.has(data.selectedGroupId)) {
    issues.push(issue("selected_group_missing", "repairable", "Selected group does not exist.", data.selectedGroupId));
  }

  for (const group of data.groups) {
    if (group.currencyCode !== "MXN") {
      issues.push(issue("group_currency_not_mxn", "repairable", "Group currency must be MXN.", group.id));
    }
    if (group.createdByUserId && !userIds.has(group.createdByUserId)) {
      issues.push(issue("group_creator_missing", "repairable", "Group creator does not exist.", group.id));
    }
    const currentMembers = groupMemberIds(data.groupMembers ?? [], group.id);
    for (const memberId of group.memberIds) {
      if (!currentMembers.has(memberId)) {
        issues.push(issue("group_member_list_stale", "repairable", "Group member list has a stale member id.", memberId));
      }
    }
  }

  for (const member of data.groupMembers ?? []) {
    if (!groupIds.has(member.groupId)) {
      issues.push(issue("group_member_group_missing", "repairable", "Group member references a missing group.", member.id));
    }
    if (!userIds.has(member.userId)) {
      issues.push(issue("group_member_user_missing", "fatal", "Group member references a missing user.", member.id));
    }
  }

  for (const expense of data.expenses) {
    const membersInGroup = groupMemberIds(data.groupMembers ?? [], expense.groupId);
    if (!groupIds.has(expense.groupId)) {
      issues.push(issue("expense_group_missing", "fatal", "Expense references a missing group.", expense.id));
    }
    if (!isPositiveInteger(expense.amountCents)) {
      issues.push(issue("expense_amount_invalid", "fatal", "Expense amount must be positive integer cents.", expense.id));
    }
    if (expense.currency !== "MXN") {
      issues.push(issue("expense_currency_not_mxn", "repairable", "Expense currency must be MXN.", expense.id));
    }
    if (!membersInGroup.has(expense.paidByMemberId ?? expense.payerId)) {
      issues.push(issue("expense_payer_missing", "fatal", "Expense payer is not an active group member.", expense.id));
    }
    for (const participantId of expense.participantIds) {
      if (!membersInGroup.has(participantId)) {
        issues.push(issue("expense_participant_missing", "repairable", "Expense participant is not in the group.", participantId));
      }
    }
    const shares = (data.expenseParticipants ?? []).filter((share) => share.expenseId === expense.id);
    if (shares.length === 0) {
      issues.push(issue("expense_participants_missing", "repairable", "Expense participant shares are missing.", expense.id));
    }
    const shareTotal = shares.reduce((sum, share) => sum + share.shareCents, 0);
    if (shares.length > 0 && shareTotal !== expense.amountCents) {
      issues.push(issue("expense_share_total_mismatch", "repairable", "Expense shares do not sum to amount.", expense.id));
    }
  }

  for (const participant of data.expenseParticipants ?? []) {
    if (!expenseIds.has(participant.expenseId)) {
      issues.push(issue("expense_participant_expense_missing", "repairable", "Expense participant references a missing expense.", participant.id));
    }
    if (!memberIds.has(participant.memberId)) {
      issues.push(issue("expense_participant_member_missing", "repairable", "Expense participant references a missing member.", participant.id));
    }
    if (!isNonNegativeInteger(participant.shareCents)) {
      issues.push(issue("expense_participant_share_invalid", "repairable", "Participant share must be integer cents.", participant.id));
    }
  }

  for (const settlement of data.settlements) {
    const membersInGroup = groupMemberIds(data.groupMembers ?? [], settlement.groupId);
    if (!groupIds.has(settlement.groupId)) {
      issues.push(issue("settlement_group_missing", "fatal", "Settlement references a missing group.", settlement.id));
    }
    if (!membersInGroup.has(settlement.fromMemberId) || !membersInGroup.has(settlement.toMemberId)) {
      issues.push(issue("settlement_member_missing", "fatal", "Settlement member is not in the group.", settlement.id));
    }
    if (settlement.fromMemberId === settlement.toMemberId) {
      issues.push(issue("settlement_same_member", "fatal", "Settlement cannot pay the same member.", settlement.id));
    }
    if (!isPositiveInteger(settlement.amountCents)) {
      issues.push(issue("settlement_amount_invalid", "fatal", "Settlement amount must be positive integer cents.", settlement.id));
    }
    if (settlement.currency !== "MXN") {
      issues.push(issue("settlement_currency_not_mxn", "repairable", "Settlement currency must be MXN.", settlement.id));
    }
  }

  for (const event of data.activityEvents ?? []) {
    if (!groupIds.has(event.groupId)) {
      issues.push(issue("activity_group_missing", "repairable", "Activity references a missing group.", event.id));
    }
    if (!userIds.has(event.actorUserId)) {
      issues.push(issue("activity_actor_missing", "repairable", "Activity actor does not exist.", event.id));
    }
  }

  for (const item of data.syncOutbox ?? []) {
    if (!isNonNegativeInteger(item.attemptCount)) {
      issues.push(issue("outbox_attempt_count_invalid", "repairable", "Outbox attempt count must be non-negative.", item.id));
    }
    if (!validPayload(item)) {
      issues.push(issue("outbox_payload_invalid", "repairable", "Outbox payload is not valid JSON.", item.id));
    }
  }

  return issues;
}

export function auditAndRepairAppData(input: AppData): IntegrityResult {
  const normalized = normalizeAppData(input);
  const initialIssues = auditAppDataIntegrity(normalized);
  const users = normalized.users ?? [];
  const validUserIds = new Set(users.filter((user) => !user.deletedAt).map((user) => user.id));
  const groups = normalized.groups.map((group) => ({
    ...group,
    currencyCode: "MXN" as const,
    createdByUserId: group.createdByUserId && validUserIds.has(group.createdByUserId)
      ? group.createdByUserId
      : users[0]?.id,
  }));
  const validGroupIds = new Set(groups.filter((group) => !group.archivedAt).map((group) => group.id));
  const groupMembers = (normalized.groupMembers ?? []).filter(
    (member) => validGroupIds.has(member.groupId) && validUserIds.has(member.userId),
  );
  const validMemberIds = new Set(groupMembers.filter((member) => !member.leftAt).map((member) => member.id));

  const expenses: Expense[] = [];
  const expenseParticipants: ExpenseParticipant[] = [];

  for (const expense of normalized.expenses) {
    const membersInGroup = groupMemberIds(groupMembers, expense.groupId);
    const payerId = expense.paidByMemberId ?? expense.payerId;
    if (
      !validGroupIds.has(expense.groupId) ||
      !isPositiveInteger(expense.amountCents) ||
      !membersInGroup.has(payerId)
    ) {
      continue;
    }

    const participantIds = expense.participantIds.filter((participantId) => membersInGroup.has(participantId));
    if (participantIds.length === 0) {
      continue;
    }

    const repairedExpense: Expense = {
      ...expense,
      currency: "MXN",
      payerId,
      paidByMemberId: payerId,
      participantIds,
      expenseDate: expense.expenseDate ?? expense.createdAt.slice(0, 10),
      updatedAt: expense.updatedAt ?? expense.createdAt,
    };
    expenses.push(repairedExpense);
    expenseParticipants.push(
      ...splitEqual(repairedExpense.amountCents, participantIds).map((share) => ({
        id: `participant-${repairedExpense.id}-${share.memberId}`,
        expenseId: repairedExpense.id,
        memberId: share.memberId,
        shareMethod: "equal" as const,
        shareCents: share.amountCents,
        createdAt: repairedExpense.createdAt,
      })),
    );
  }

  const settlements: Settlement[] = normalized.settlements
    .filter((settlement) => {
      const membersInGroup = groupMemberIds(groupMembers, settlement.groupId);
      return (
        validGroupIds.has(settlement.groupId) &&
        membersInGroup.has(settlement.fromMemberId) &&
        membersInGroup.has(settlement.toMemberId) &&
        settlement.fromMemberId !== settlement.toMemberId &&
        isPositiveInteger(settlement.amountCents)
      );
    })
    .map((settlement) => ({
      ...settlement,
      currency: "MXN",
      recordedAt: settlement.recordedAt ?? settlement.createdAt,
    }));

  const validExpenseIds = new Set(expenses.map((expense) => expense.id));
  const validSettlementIds = new Set(settlements.map((settlement) => settlement.id));
  const activityEvents: ActivityEvent[] = (normalized.activityEvents ?? []).filter((event) => {
    if (!validGroupIds.has(event.groupId) || !validUserIds.has(event.actorUserId)) {
      return false;
    }
    if (event.entityType === "expense") {
      return validExpenseIds.has(event.entityId);
    }
    if (event.entityType === "settlement") {
      return validSettlementIds.has(event.entityId);
    }
    if (event.entityType === "member") {
      return validMemberIds.has(event.entityId);
    }
    return validGroupIds.has(event.entityId);
  });

  const syncOutbox = (normalized.syncOutbox ?? []).filter(
    (item) => isNonNegativeInteger(item.attemptCount) && validPayload(item),
  );

  const repairedGroups = syncGroupMemberIds(groups, groupMembers);
  const selectedGroupId = validGroupIds.has(normalized.selectedGroupId)
    ? normalized.selectedGroupId
    : repairedGroups[0]?.id ?? "";

  const repaired: AppData = {
    ...normalized,
    users,
    groups: repairedGroups,
    groupMembers,
    members: groupMembers.map((member) => {
      const user = users.find((item) => item.id === member.userId);
      return {
        id: member.id,
        userId: member.userId,
        name: member.displayNameSnapshot || user?.displayName || "Integrante",
        avatarColor: user?.avatarColor ?? "#0E7C66",
        role: member.role,
        joinedAt: member.joinedAt,
        leftAt: member.leftAt,
      };
    }),
    expenses,
    expenseParticipants,
    settlements,
    activityEvents,
    syncOutbox,
    selectedGroupId,
    selectedUserId: normalized.selectedUserId && validUserIds.has(normalized.selectedUserId)
      ? normalized.selectedUserId
      : users[0]?.id,
  };

  return {
    data: repaired,
    issues: initialIssues,
  };
}
