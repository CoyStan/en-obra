import { getGroupMembers } from "../domain/balances";
import type {
  ActivityEvent,
  AppData,
  Expense,
  Group,
  GroupInvite,
  GroupMember,
  Settlement,
  SettlementSuggestion,
  SplitInput,
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
  split?: SplitInput;
  actorUserId?: string;
  note?: string;
};

export type UpdateExpenseMutationInput = AddExpenseMutationInput;

export type SettlementHelperInput = {
  localBankAlias?: string;
  localClabeReference?: string;
};

export type JoinGroupMutationInput = {
  inviteCode: string;
  actorUserId?: string;
};

function memberHasMoneyReferences(current: AppData, memberId: string) {
  return (
    current.expenses.some((expense) =>
      expense.payerId === memberId ||
      expense.paidByMemberId === memberId ||
      expense.participantIds.includes(memberId),
    ) ||
    (current.expenseParticipants ?? []).some((participant) => participant.memberId === memberId) ||
    current.settlements.some((settlement) =>
      settlement.fromMemberId === memberId || settlement.toMemberId === memberId,
    )
  );
}

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

function localInviteCode(groupName: string, groupId: string) {
  const readableName = groupName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 12);
  return `CC-${readableName || groupId.toUpperCase()}`;
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
  const inviteId = makeId(context, "invite");
  const ownerUser = current.users?.find((user) => user.id === actorUserId);
  const ownerMember: GroupMember | null = ownerUser
    ? {
        id: ownerMemberId,
        groupId,
        userId: ownerUser.id,
        displayNameSnapshot: ownerUser.displayName,
        role: "owner",
        status: "active",
        joinSource: "created",
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
  const invite: GroupInvite = {
    id: inviteId,
    groupId,
    code: localInviteCode(group.name, groupId),
    label: "Liga local del grupo",
    status: "active",
    createdByUserId: actorUserId,
    createdAt,
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
      groupInvites: [invite, ...(current.groupInvites ?? [])],
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
              status: ownerMember.status,
              joinSource: ownerMember.joinSource,
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
        createSyncOutboxItem({ operation: "create", entityType: "group_invite", entityId: invite.id, payload: invite, createdAt }),
        createSyncOutboxItem({ operation: "create", entityType: "activity_event", entityId: event.id, payload: event, createdAt }),
      ],
    },
  };
}

export function joinGroupByInviteMutation(
  current: AppData,
  input: JoinGroupMutationInput,
  context?: MutationContext,
): MutationResult {
  const code = input.inviteCode.trim().toUpperCase();
  if (!code) {
    return { ok: false, error: "Escribe el código de invitación.", data: current };
  }

  const invite = (current.groupInvites ?? []).find((item) => item.code.toUpperCase() === code);
  if (!invite || invite.status !== "active") {
    return { ok: false, error: "No encontramos una invitación local activa.", data: current };
  }

  const group = current.groups.find((item) => item.id === invite.groupId);
  if (!group) {
    return { ok: false, error: "La invitación no tiene grupo local disponible.", data: current };
  }

  const joinedAt = currentTime(context);
  const actorUserId = resolveActorUserId(current, input.actorUserId);
  const actorUser = current.users?.find((user) => user.id === actorUserId);
  if (!actorUser) {
    return { ok: false, error: "Crea un perfil local antes de unirte.", data: current };
  }

  const existingMember = (current.groupMembers ?? []).find(
    (member) => member.groupId === group.id && member.userId === actorUser.id && !member.leftAt,
  );
  if (existingMember) {
    return {
      ok: true,
      data: {
        ...current,
        selectedGroupId: group.id,
        selectedUserId: actorUser.id,
      },
    };
  }

  const memberId = makeId(context, "member");
  const member: GroupMember = {
    id: memberId,
    groupId: group.id,
    userId: actorUser.id,
    displayNameSnapshot: actorUser.displayName,
    role: "member",
    status: "active",
    joinSource: "invite",
    invitedByUserId: invite.createdByUserId,
    inviteId: invite.id,
    joinedAt,
  };
  const updatedInvite: GroupInvite = {
    ...invite,
    lastUsedAt: joinedAt,
  };
  const event = activityEvent(
    context,
    group.id,
    actorUser.id,
    "member_joined",
    "member",
    member.id,
    `${actorUser.displayName} se unió al grupo`,
    joinedAt,
  );

  return {
    ok: true,
    data: {
      ...current,
      activityEvents: [event, ...(current.activityEvents ?? [])],
      groupInvites: (current.groupInvites ?? []).map((item) => item.id === updatedInvite.id ? updatedInvite : item),
      groupMembers: [...(current.groupMembers ?? []), member],
      members: [
        ...current.members,
        {
          id: member.id,
          userId: member.userId,
          name: member.displayNameSnapshot,
          avatarColor: actorUser.avatarColor,
          role: member.role,
          status: member.status,
          joinSource: member.joinSource,
          joinedAt: member.joinedAt,
        },
      ],
      groups: current.groups.map((item) =>
        item.id === group.id
          ? { ...item, memberIds: [...item.memberIds, member.id], updatedAt: joinedAt }
          : item,
      ),
      selectedGroupId: group.id,
      selectedUserId: actorUser.id,
      syncOutbox: [
        ...(current.syncOutbox ?? []),
        createSyncOutboxItem({ operation: "update", entityType: "group_invite", entityId: updatedInvite.id, payload: updatedInvite, createdAt: joinedAt }),
        createSyncOutboxItem({
          operation: "create",
          entityType: "group_member",
          entityId: member.id,
          payload: member,
          createdAt: joinedAt,
        }),
        createSyncOutboxItem({ operation: "create", entityType: "activity_event", entityId: event.id, payload: event, createdAt: joinedAt }),
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
    status: "active",
    joinSource: "manual",
    joinedAt: createdAt,
  };
  const member = {
    id: groupMember.id,
    userId: groupMember.userId,
    name: groupMember.displayNameSnapshot,
    avatarColor: user.avatarColor,
    role: groupMember.role,
    status: groupMember.status,
    joinSource: groupMember.joinSource,
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

export function renameMemberMutation(
  current: AppData,
  groupId: string,
  memberId: string,
  name: string,
  context?: MutationContext,
): MutationResult {
  const validation = validateMemberInput(name);
  if (!validation.ok) {
    return { ok: false, error: validation.error, data: current };
  }

  const groupMember = (current.groupMembers ?? []).find((member) => member.id === memberId && member.groupId === groupId);
  if (!groupMember || groupMember.leftAt) {
    return { ok: false, error: "No encontramos ese integrante activo.", data: current };
  }

  const updatedAt = currentTime(context);
  const updatedGroupMember: GroupMember = {
    ...groupMember,
    displayNameSnapshot: validation.value.name,
  };
  const updatedUser = current.users?.find((user) => user.id === groupMember.userId && !user.deletedAt)
    ? current.users.map((user) =>
        user.id === groupMember.userId
          ? { ...user, displayName: validation.value.name, updatedAt }
          : user,
      )
    : current.users;

  return {
    ok: true,
    data: {
      ...current,
      users: updatedUser,
      groupMembers: (current.groupMembers ?? []).map((member) =>
        member.id === memberId ? updatedGroupMember : member,
      ),
      members: current.members.map((member) =>
        member.id === memberId ? { ...member, name: validation.value.name } : member,
      ),
      groups: current.groups.map((group) =>
        group.id === groupId ? { ...group, updatedAt } : group,
      ),
      syncOutbox: [
        ...(current.syncOutbox ?? []),
        createSyncOutboxItem({
          operation: "update",
          entityType: "group_member",
          entityId: updatedGroupMember.id,
          payload: updatedGroupMember,
          createdAt: updatedAt,
        }),
      ],
    },
  };
}

export function removeMemberMutation(
  current: AppData,
  groupId: string,
  memberId: string,
  context?: MutationContext,
): MutationResult {
  const group = current.groups.find((item) => item.id === groupId);
  if (!group) {
    return { ok: false, error: "No se encontró el grupo.", data: current };
  }

  const groupMember = (current.groupMembers ?? []).find((member) => member.id === memberId && member.groupId === groupId);
  if (!groupMember || groupMember.leftAt) {
    return { ok: false, error: "No encontramos ese integrante activo.", data: current };
  }

  const activeMemberCount = (current.groupMembers ?? []).filter((member) => member.groupId === groupId && !member.leftAt).length;
  if (activeMemberCount <= 1) {
    return { ok: false, error: "El grupo necesita al menos un integrante.", data: current };
  }

  if (memberHasMoneyReferences(current, memberId)) {
    return {
      ok: false,
      error: "No se puede quitar porque ya tiene gastos o arreglos. Edita el nombre si necesitas corregirlo.",
      data: current,
    };
  }

  const removedAt = currentTime(context);
  return {
    ok: true,
    data: {
      ...current,
      groupMembers: (current.groupMembers ?? []).filter((member) => member.id !== memberId),
      members: current.members.filter((member) => member.id !== memberId),
      groups: current.groups.map((item) =>
        item.id === groupId
          ? { ...item, memberIds: item.memberIds.filter((id) => id !== memberId), updatedAt: removedAt }
          : item,
      ),
      syncOutbox: [
        ...(current.syncOutbox ?? []),
        createSyncOutboxItem({
          operation: "delete",
          entityType: "group_member",
          entityId: groupMember.id,
          payload: groupMember,
          createdAt: removedAt,
        }),
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
    split: input.split,
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
  const participants = validation.value.splitShares.map((share) => ({
    id: makeId(context, "participant"),
    expenseId: expense.id,
    memberId: share.memberId,
    shareMethod: share.method,
    shareCents: share.amountCents,
    shareUnits: share.units,
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

export function updateExpenseMutation(
  current: AppData,
  groupId: string,
  expenseId: string,
  input: UpdateExpenseMutationInput,
  context?: MutationContext,
): MutationResult {
  const existingExpense = current.expenses.find((expense) => expense.id === expenseId && expense.groupId === groupId);
  if (!existingExpense) {
    return { ok: false, error: "No se encontró el gasto local.", data: current };
  }

  const groupMemberIds = getGroupMembers(current, groupId).map((member) => member.id);
  const validation = validateExpenseInput({
    amount: input.amount,
    memberIds: groupMemberIds,
    note: input.note,
    participantIds: input.participantIds,
    payerId: input.payerId,
    split: input.split,
    title: input.title,
  });

  if (!validation.ok) {
    return { ok: false, error: validation.error, data: current };
  }

  const updatedAt = currentTime(context);
  const actorUserId = resolveActorUserId(current, input.actorUserId);
  const updatedExpense: Expense = {
    ...existingExpense,
    title: validation.value.title,
    amountCents: validation.value.amountCents,
    payerId: validation.value.payerId,
    paidByMemberId: validation.value.payerId,
    createdByUserId: existingExpense.createdByUserId ?? actorUserId,
    categoryId: input.categoryId,
    participantIds: validation.value.participantIds,
    note: validation.value.note,
    updatedAt,
  };
  const participants = validation.value.splitShares.map((share) => ({
    id: makeId(context, "participant"),
    expenseId: updatedExpense.id,
    memberId: share.memberId,
    shareMethod: share.method,
    shareCents: share.amountCents,
    shareUnits: share.units,
    createdAt: updatedAt,
  }));
  const event = activityEvent(
    context,
    groupId,
    actorUserId,
    "expense_updated",
    "expense",
    updatedExpense.id,
    `Se editó ${updatedExpense.title}`,
    updatedAt,
  );
  const previousParticipants = current.expenseParticipants?.filter((share) => share.expenseId === expenseId) ?? [];

  return {
    ok: true,
    data: {
      ...current,
      activityEvents: [event, ...(current.activityEvents ?? [])],
      expenses: current.expenses.map((expense) => (expense.id === expenseId ? updatedExpense : expense)),
      expenseParticipants: [
        ...participants,
        ...((current.expenseParticipants ?? []).filter((share) => share.expenseId !== expenseId)),
      ],
      syncOutbox: [
        ...(current.syncOutbox ?? []),
        createSyncOutboxItem({ operation: "update", entityType: "expense", entityId: updatedExpense.id, payload: updatedExpense, createdAt: updatedAt }),
        ...previousParticipants.map((participant) =>
          createSyncOutboxItem({ operation: "delete", entityType: "expense_participant", entityId: participant.id, payload: participant, createdAt: updatedAt }),
        ),
        ...participants.map((participant) =>
          createSyncOutboxItem({
            operation: "create",
            entityType: "expense_participant",
            entityId: participant.id,
            payload: participant,
            createdAt: updatedAt,
          }),
        ),
        createSyncOutboxItem({ operation: "create", entityType: "activity_event", entityId: event.id, payload: event, createdAt: updatedAt }),
      ],
    },
  };
}

export function deleteExpenseMutation(
  current: AppData,
  groupId: string,
  expenseId: string,
  actorUserId?: string,
  context?: MutationContext,
): MutationResult {
  const existingExpense = current.expenses.find((expense) => expense.id === expenseId && expense.groupId === groupId);
  if (!existingExpense) {
    return { ok: false, error: "No se encontró el gasto local.", data: current };
  }

  const deletedAt = currentTime(context);
  const resolvedActorUserId = resolveActorUserId(current, actorUserId);
  const deletedParticipants = current.expenseParticipants?.filter((share) => share.expenseId === expenseId) ?? [];
  const event = activityEvent(
    context,
    groupId,
    resolvedActorUserId,
    "expense_deleted",
    "expense",
    expenseId,
    `Se eliminó ${existingExpense.title}`,
    deletedAt,
  );

  return {
    ok: true,
    data: {
      ...current,
      activityEvents: [event, ...(current.activityEvents ?? [])],
      expenses: current.expenses.filter((expense) => expense.id !== expenseId),
      expenseParticipants: (current.expenseParticipants ?? []).filter((share) => share.expenseId !== expenseId),
      syncOutbox: [
        ...(current.syncOutbox ?? []),
        createSyncOutboxItem({ operation: "delete", entityType: "expense", entityId: existingExpense.id, payload: existingExpense, createdAt: deletedAt }),
        ...deletedParticipants.map((participant) =>
          createSyncOutboxItem({ operation: "delete", entityType: "expense_participant", entityId: participant.id, payload: participant, createdAt: deletedAt }),
        ),
        createSyncOutboxItem({ operation: "create", entityType: "activity_event", entityId: event.id, payload: event, createdAt: deletedAt }),
      ],
    },
  };
}

export function markSettlementPaidMutation(
  current: AppData,
  groupId: string,
  suggestion: SettlementSuggestion,
  actorUserId?: string,
  helper?: SettlementHelperInput,
  context?: MutationContext,
): MutationResult {
  const createdAt = currentTime(context);
  const resolvedActorUserId = resolveActorUserId(current, actorUserId);
  const localBankAlias = helper?.localBankAlias?.trim();
  const localClabeReference = helper?.localClabeReference?.trim();
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
    note: localBankAlias || localClabeReference
      ? "Registro local de pago externo con nota de referencia."
      : "Registro local de pago externo.",
    localBankAlias: localBankAlias || undefined,
    localClabeReference: localClabeReference || undefined,
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
