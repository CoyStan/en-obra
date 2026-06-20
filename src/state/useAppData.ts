import { useCallback, useEffect, useMemo, useState } from "react";
import { createSyncOutboxItem } from "../backend/syncOutbox";
import { calculateGroupSummary, getGroupMembers } from "../domain/balances";
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
import { createId } from "../utils/id";
import { resolveActorUserId } from "./actorIdentity";
import { validateExpenseInput, validateGroupInput, validateMemberInput } from "./flowValidation";
import { cloneDemoData, loadPersistedData, persistData } from "./storage";

const avatarColors = ["#229ED9", "#168AC0", "#4F9BC7", "#6B7C93", "#3B82B8", "#7C8DA1"];

type AddExpenseInput = {
  title: string;
  amount: string;
  payerId: string;
  categoryId?: string;
  participantIds?: string[];
  actorUserId?: string;
  note?: string;
};

function now() {
  return new Date().toISOString();
}

function pickAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length];
}

function defaultActorUserId(data: AppData) {
  return resolveActorUserId(data);
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
      const actorUserId = defaultActorUserId(current);
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
        defaultActorUserId(current),
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
      participantIds: input.participantIds,
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
      const participantIds = validation.value.participantIds;
      const actorUserId = resolveActorUserId(current, input.actorUserId);
      const expense: Expense = {
        id: createId("expense"),
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
      };
    });
    setError(null);
    return true;
  }, [data, updateData]);

  const markSettlementPaid = useCallback((groupId: string, suggestion: SettlementSuggestion, actorUserId?: string) => {
    updateData((current) => {
      const createdAt = now();
      const resolvedActorUserId = resolveActorUserId(current, actorUserId);
      const settlement: Settlement = {
        id: createId("settlement"),
        groupId,
        fromMemberId: suggestion.fromMemberId,
        toMemberId: suggestion.toMemberId,
        amountCents: suggestion.amountCents,
        currency: "MXN" as const,
        status: "paid" as const,
        recordedByUserId: resolvedActorUserId,
        recordedAt: createdAt,
        createdAt,
        note: "Registro local de pago externo.",
      };
      const event = activityEvent(
        groupId,
        resolvedActorUserId,
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
          createSyncOutboxItem({
            operation: "create",
            entityType: "settlement",
            entityId: settlement.id,
            payload: settlement,
            createdAt,
          }),
          createSyncOutboxItem({ operation: "create", entityType: "activity_event", entityId: event.id, payload: event, createdAt }),
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
