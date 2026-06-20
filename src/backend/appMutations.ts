import { getGroupMembers } from "../domain/balances";
import { splitEqual } from "../domain/money";
import type {
  ActivityEvent,
  AppData,
  Expense,
  Group,
  GroupMember,
  Settlement,
  SettlementSuggestion,
  User,
} from "../domain/types";
import { resolveActorUserId } from "../state/actorIdentity";
import { validateExpenseInput, validateGroupInput, validateMemberInput } from "../state/flowValidation";
import { createId } from "../utils/id";
import { createSyncOutboxItem } from "./syncOutbox";

export type MutationContext = {
  now?: () => string;
  id?: (prefix: string) => string;
};

export type MutationResult =
  | { ok: true; data: AppData }
  | { ok: false; error: string; data: AppData };

export type AddExpenseMutationInput = {
  title: string;
  amount: string;
  payerId: string;
  categoryId?: string;
  participantIds?: string[];
  actorUserId?: string;
  note?: string;
};

const avatarColors = ["#229ED9", "#168AC0", "#4F9BC7", "#6B7C93", "#3B82B8", "#7C8DA1"];

function currentTime(context?: MutationContext) {
  return context?.now?.() ?? new Date().toISOString();
}

function makeId(context: MutationContext | undefined, prefix: string) {
  return context?.id?.(prefix) ?? createId(prefix);
}

function pickAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length];
}

function defaultActorUserId(data: AppData) {
  return resolveActorUserId(data);
}

function activityEvent(
  context: MutationContext | undefined,
  groupId: string,
  actorUserId: string,
  eventType: ActivityEvent["eventType"],
  entityType: ActivityEvent["entityType"],
  entityId: string,
  summary: string,
  createdAt: string,
): ActivityEvent {
  return {
    id: makeId(context, "activity"),
    groupId,
    actorUserId,
    eventType,
    entityType,
    entityId,
    summary,
    createdAt,
  };
}

export function createGroupMutation(
  current: AppData,
  name: string,
  description = "",
  context?: MutationContext,
): MutationResult {
  const validation = validateGroupInput(name, description);
  if (!validation.ok) {
    return { ok: false, error: validation.error, data: current };
  }

  const createdAt = currentTime(context);
  const groupId = makeId(context, "group");
  const actorUserId = defaultActorUserId(current);
  const ownerMemberId = makeId(context, "member");
  const ownerUser = current.users?.find((user) => user.id === actorUserId);
  const ownerMember: GroupMember | null = ownerUser
    ? {
        id: ownerMemberId,
        groupId,
        userId: ownerUser.id,
        displayNameSnapshot: ownerUser.displayName,
        role: "owner",
        joinedAt: createdAt,
      }
    : null;
  const group: Group = {
    id: groupId,
    name: validation.value.name,
    description: validation.value.description,
    currencyCode: "MXN",
    createdByUserId: actorUserId,
    createdAt,
    updatedAt: createdAt,
    memberIds: ownerMember ? [ownerMember.id] : [],
  };
  const event = activityEvent(
    context,
    groupId,
    actorUserId,
    "group_created",
    "group",
    groupId,
    `Se creó ${group.name}`,
    createdAt,
  );

  return {
    ok: true,
    data: {
      ...current,
      activityEvents: [event, ...(current.activityEvents ?? [])],
      groups: [group, ...current.groups],
      groupMembers: ownerMember ? [...(current.groupMembers ?? []), ownerMember] : current.groupMembers,
      members: ownerMember
        ? [
            ...current.members,
            {
              id: ownerMember.id,
              userId: ownerMember.userId,
              name: ownerMember.displayNameSnapshot,
              avatarColor: ownerUser?.avatarColor ?? pickAvatarColor(current.members.length),
              role: ownerMember.role,
              joinedAt: ownerMember.joinedAt,
            },
          ]
        : current.members,
      selectedGroupId: groupId,
      selectedUserId: actorUserId,
      syncOutbox: [
        ...(current.syncOutbox ?? []),
        createSyncOutboxItem({ operation: "create", entityType: "group", entityId: group.id, payload: group, createdAt }),
        ...(ownerMember
          ? [
              createSyncOutboxItem({
                operation: "create",
                entityType: "group_member",
                entityId: ownerMember.id,
                payload: ownerMember,
                createdAt,
              }),
            ]
          : []),
        createSyncOutboxItem({ operation: "create", entityType: "activity_event", entityId: event.id, payload: event, createdAt }),
      ],
    },
  };
}

export function addMemberMutation(
  current: AppData,
  groupId: string,
  name: string,
  context?: MutationContext,
): MutationResult {
  const validation = validateMemberInput(name);
  if (!validation.ok) {
    return { ok: false, error: validation.error, data: current };
  }

  const createdAt = currentTime(context);
  const userId = makeId(context, "user");
  const memberId = makeId(context, "member");
  const user: User = {
    id: userId,
    displayName: validation.value.name,
    phoneOrEmail: `${userId}@demo.local`,
    avatarColor: pickAvatarColor((current.users ?? current.members).length),
    createdAt,
    updatedAt: createdAt,
  };
  const groupMember: GroupMember = {
    id: memberId,
    groupId,
    userId,
    displayNameSnapshot: validation.value.name,
    role: "member",
    joinedAt: createdAt,
  };
  const member = {
    id: groupMember.id,
    userId: groupMember.userId,
    name: groupMember.displayNameSnapshot,
    avatarColor: user.avatarColor,
    role: groupMember.role,
    joinedAt: groupMember.joinedAt,
  };
  const event = activityEvent(
    context,
    groupId,
    defaultActorUserId(current),
    "member_added",
    "member",
    memberId,
    `Se agregó ${member.name}`,
    createdAt,
  );

  return {
    ok: true,
    data: {
      ...current,
      activityEvents: [event, ...(current.activityEvents ?? [])],
      users: [...(current.users ?? []), user],
      groupMembers: [...(current.groupMembers ?? []), groupMember],
      members: [...current.members, member],
      groups: current.groups.map((group) =>
        group.id === groupId
          ? { ...group, memberIds: [...group.memberIds, memberId], updatedAt: createdAt }
          : group,
      ),
      syncOutbox: [
        ...(current.syncOutbox ?? []),
        createSyncOutboxItem({ operation: "create", entityType: "user", entityId: user.id, payload: user, createdAt }),
        createSyncOutboxItem({
          operation: "create",
          entityType: "group_member",
          entityId: groupMember.id,
          payload: groupMember,
          createdAt,
        }),
        createSyncOutboxItem({ operation: "create", entityType: "activity_event", entityId: event.id, payload: event, createdAt }),
      ],
    },
  };
}

export function addExpenseMutation(
  current: AppData,
  groupId: string,
  input: AddExpenseMutationInput,
  context?: MutationContext,
): MutationResult {
  const groupMemberIds = getGroupMembers(current, groupId).map((member) => member.id);
  const validation = validateExpenseInput({
    amount: input.amount,
    memberIds: groupMemberIds,
    note: input.note,
    participantIds: input.participantIds,
    payerId: input.payerId,
    title: input.title,
  });

  if (!validation.ok) {
    return { ok: false, error: validation.error, data: current };
  }

  const currentGroup = current.groups.find((item) => item.id === groupId);
  if (!currentGroup) {
    return { ok: false, error: "No se encontró el grupo.", data: current };
  }

  const createdAt = currentTime(context);
  const participantIds = validation.value.participantIds;
  const actorUserId = resolveActorUserId(current, input.actorUserId);
  const expense: Expense = {
    id: makeId(context, "expense"),
    groupId,
    title: validation.value.title,
    amountCents: validation.value.amountCents,
    currency: "MXN",
    payerId: validation.value.payerId,
    paidByMemberId: validation.value.payerId,
    createdByUserId: actorUserId,
    categoryId: input.categoryId,
    participantIds,
    note: validation.value.note,
    expenseDate: createdAt.slice(0, 10),
    createdAt,
    updatedAt: createdAt,
  };
  const participants = splitEqual(expense.amountCents, participantIds).map((share) => ({
    id: makeId(context, "participant"),
    expenseId: expense.id,
    memberId: share.memberId,
    shareMethod: "equal" as const,
    shareCents: share.amountCents,
    createdAt,
  }));
  const event = activityEvent(
    context,
    groupId,
    actorUserId,
    "expense_created",
    "expense",
    expense.id,
    `Se agregó ${expense.title}`,
    createdAt,
  );

  return {
    ok: true,
    data: {
      ...current,
      activityEvents: [event, ...(current.activityEvents ?? [])],
      expenses: [expense, ...current.expenses],
      expenseParticipants: [...participants, ...(current.expenseParticipants ?? [])],
      groups: current.groups.map((item) =>
        item.id === groupId ? { ...item, updatedAt: createdAt } : item,
      ),
      syncOutbox: [
        ...(current.syncOutbox ?? []),
        createSyncOutboxItem({ operation: "create", entityType: "expense", entityId: expense.id, payload: expense, createdAt }),
        ...participants.map((participant) =>
          createSyncOutboxItem({
            operation: "create",
            entityType: "expense_participant",
            entityId: participant.id,
            payload: participant,
            createdAt,
          }),
        ),
        createSyncOutboxItem({ operation: "create", entityType: "activity_event", entityId: event.id, payload: event, createdAt }),
      ],
    },
  };
}

export function markSettlementPaidMutation(
  current: AppData,
  groupId: string,
  suggestion: SettlementSuggestion,
  actorUserId?: string,
  context?: MutationContext,
): MutationResult {
  const createdAt = currentTime(context);
  const resolvedActorUserId = resolveActorUserId(current, actorUserId);
  const settlement: Settlement = {
    id: makeId(context, "settlement"),
    groupId,
    fromMemberId: suggestion.fromMemberId,
    toMemberId: suggestion.toMemberId,
    amountCents: suggestion.amountCents,
    currency: "MXN",
    status: "paid",
    recordedByUserId: resolvedActorUserId,
    recordedAt: createdAt,
    createdAt,
    note: "Registro local de pago externo.",
  };
  const event = activityEvent(
    context,
    groupId,
    resolvedActorUserId,
    "settlement_recorded",
    "settlement",
    settlement.id,
    "Se marcó un arreglo local como pagado",
    createdAt,
  );

  return {
    ok: true,
    data: {
      ...current,
      activityEvents: [event, ...(current.activityEvents ?? [])],
      settlements: [settlement, ...current.settlements],
      groups: current.groups.map((group) =>
        group.id === groupId ? { ...group, updatedAt: createdAt } : group,
      ),
      syncOutbox: [
        ...(current.syncOutbox ?? []),
        createSyncOutboxItem({
          operation: "create",
          entityType: "settlement",
          entityId: settlement.id,
          payload: settlement,
          createdAt,
        }),
        createSyncOutboxItem({ operation: "create", entityType: "activity_event", entityId: event.id, payload: event, createdAt }),
      ],
    },
  };
}
