import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateGroupSummary, getGroupMembers } from "../domain/balances";
import { splitEqual } from "../domain/money";
import type {
  ActivityEvent,
  AppData,
  Expense,
  Group,
  GroupMember,
  SettlementSuggestion,
  SyncOutboxItem,
  User,
} from "../domain/types";
import { createId } from "../utils/id";
import { validateExpenseInput, validateGroupInput, validateMemberInput } from "./flowValidation";
import { cloneDemoData, loadPersistedData, persistData } from "./storage";

const avatarColors = ["#229ED9", "#168AC0", "#4F9BC7", "#6B7C93", "#3B82B8", "#7C8DA1"];

type AddExpenseInput = {
  title: string;
  amount: string;
  payerId: string;
  note?: string;
};

function now() {
  return new Date().toISOString();
}

function pickAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length];
}

function selectedUserId(data: AppData) {
  return data.selectedUserId ?? data.users?.[0]?.id ?? "user-local-demo";
}

function outboxItem(
  operation: SyncOutboxItem["operation"],
  entityType: SyncOutboxItem["entityType"],
  entityId: string,
  payload: unknown,
  createdAt: string,
): SyncOutboxItem {
  return {
    id: createId("outbox"),
    operation,
    entityType,
    entityId,
    payloadJson: JSON.stringify(payload),
    status: "pending",
    attemptCount: 0,
    createdAt,
  };
}

function activityEvent(
  groupId: string,
  actorUserId: string,
  eventType: ActivityEvent["eventType"],
  entityType: ActivityEvent["entityType"],
  entityId: string,
  summary: string,
  createdAt: string,
): ActivityEvent {
  return {
    id: createId("activity"),
    groupId,
    actorUserId,
    eventType,
    entityType,
    entityId,
    summary,
    createdAt,
  };
}

export function useAppData() {
  const [data, setData] = useState<AppData>(() => cloneDemoData());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadPersistedData()
      .then((nextData) => {
        if (isMounted) {
          setData(nextData);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("No se pudo cargar el almacenamiento local. Seguimos con datos demo.");
          setData(cloneDemoData());
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateData = useCallback((producer: (current: AppData) => AppData) => {
    setData((current) => {
      const nextData = producer(current);
      persistData(nextData).catch(() => {
        setError("No se pudo guardar el cambio localmente.");
      });
      return nextData;
    });
  }, []);

  const selectedGroup =
    data.groups.find((group) => group.id === data.selectedGroupId) ?? data.groups[0] ?? null;

  const selectedSummary = useMemo(
    () => (selectedGroup ? calculateGroupSummary(data, selectedGroup.id) : null),
    [data, selectedGroup],
  );

  const selectGroup = useCallback((groupId: string) => {
    updateData((current) => ({ ...current, selectedGroupId: groupId }));
  }, [updateData]);

  const createGroup = useCallback((name: string, description = "") => {
    const createdAt = now();
    const groupId = createId("group");
    const validation = validateGroupInput(name, description);
    if (!validation.ok) {
      setError(validation.error);
      return false;
    }

    updateData((current) => {
      const actorUserId = selectedUserId(current);
      const ownerMemberId = createId("member");
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
        groupId,
        actorUserId,
        "group_created",
        "group",
        groupId,
        `Se creó ${group.name}`,
        createdAt,
      );
      return {
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
          outboxItem("create", "group", group.id, group, createdAt),
          ...(ownerMember ? [outboxItem("create", "group_member", ownerMember.id, ownerMember, createdAt)] : []),
          outboxItem("create", "activity_event", event.id, event, createdAt),
        ],
      };
    });
    setError(null);
    return true;
  }, [updateData]);

  const addMember = useCallback((groupId: string, name: string) => {
    const validation = validateMemberInput(name);
    if (!validation.ok) {
      setError(validation.error);
      return false;
    }

    updateData((current) => {
      const createdAt = now();
      const userId = createId("user");
      const memberId = createId("member");
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
        groupId,
        selectedUserId(current),
        "member_added",
        "member",
        memberId,
        `Se agregó ${member.name}`,
        createdAt,
      );

      return {
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
          outboxItem("create", "user", user.id, user, createdAt),
          outboxItem("create", "group_member", groupMember.id, groupMember, createdAt),
          outboxItem("create", "activity_event", event.id, event, createdAt),
        ],
      };
    });
    setError(null);
    return true;
  }, [updateData]);

  const addExpense = useCallback((groupId: string, input: AddExpenseInput) => {
    const group = data.groups.find((item) => item.id === groupId);
    const groupMemberIds = getGroupMembers(data, groupId).map((member) => member.id);
    const validation = validateExpenseInput({
      amount: input.amount,
      memberIds: groupMemberIds,
      note: input.note,
      payerId: input.payerId,
      title: input.title,
    });

    if (!validation.ok) {
      setError(validation.error);
      return false;
    }

    updateData((current) => {
      const currentGroup = current.groups.find((item) => item.id === groupId);
      if (!currentGroup) {
        return current;
      }
      const createdAt = now();
      const participantIds = getGroupMembers(current, groupId).map((member) => member.id);
      const actorUserId = selectedUserId(current);
      const expense: Expense = {
        id: createId("expense"),
        groupId,
        title: validation.value.title,
        amountCents: validation.value.amountCents,
        currency: "MXN",
        payerId: validation.value.payerId,
        paidByMemberId: validation.value.payerId,
        createdByUserId: actorUserId,
        participantIds,
        note: validation.value.note,
        expenseDate: createdAt.slice(0, 10),
        createdAt,
        updatedAt: createdAt,
      };
      const participants = splitEqual(expense.amountCents, participantIds).map((share) => ({
        id: createId("participant"),
        expenseId: expense.id,
        memberId: share.memberId,
        shareMethod: "equal" as const,
        shareCents: share.amountCents,
        createdAt,
      }));
      const event = activityEvent(
        groupId,
        actorUserId,
        "expense_created",
        "expense",
        expense.id,
        `Se agregó ${expense.title}`,
        createdAt,
      );

      return {
        ...current,
        activityEvents: [event, ...(current.activityEvents ?? [])],
        expenses: [expense, ...current.expenses],
        expenseParticipants: [...participants, ...(current.expenseParticipants ?? [])],
        groups: current.groups.map((item) =>
          item.id === groupId ? { ...item, updatedAt: createdAt } : item,
        ),
        syncOutbox: [
          ...(current.syncOutbox ?? []),
          outboxItem("create", "expense", expense.id, expense, createdAt),
          ...participants.map((participant) =>
            outboxItem("create", "expense_participant", participant.id, participant, createdAt),
          ),
          outboxItem("create", "activity_event", event.id, event, createdAt),
        ],
      };
    });
    setError(null);
    return true;
  }, [data.groups, updateData]);

  const markSettlementPaid = useCallback((groupId: string, suggestion: SettlementSuggestion) => {
    updateData((current) => {
      const createdAt = now();
      const settlement = {
        id: createId("settlement"),
        groupId,
        fromMemberId: suggestion.fromMemberId,
        toMemberId: suggestion.toMemberId,
        amountCents: suggestion.amountCents,
        currency: "MXN" as const,
        status: "paid" as const,
        recordedByUserId: selectedUserId(current),
        recordedAt: createdAt,
        createdAt,
        note: "Registro local de pago externo.",
      };
      const event = activityEvent(
        groupId,
        settlement.recordedByUserId,
        "settlement_recorded",
        "settlement",
        settlement.id,
        "Se marcó un arreglo local como pagado",
        createdAt,
      );
      return {
        ...current,
        activityEvents: [event, ...(current.activityEvents ?? [])],
        settlements: [settlement, ...current.settlements],
        groups: current.groups.map((group) =>
          group.id === groupId ? { ...group, updatedAt: createdAt } : group,
        ),
        syncOutbox: [
          ...(current.syncOutbox ?? []),
          outboxItem("create", "settlement", settlement.id, settlement, createdAt),
          outboxItem("create", "activity_event", event.id, event, createdAt),
        ],
      };
    });
  }, [updateData]);

  const resetDemo = useCallback(() => {
    const nextData = cloneDemoData();
    setData(nextData);
    persistData(nextData).catch(() => {
      setError("No se pudo reiniciar el demo local.");
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
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
  };
}
