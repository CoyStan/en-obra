import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateGroupSummary } from "../domain/balances";
import type { AppData, Expense, Group, SettlementSuggestion } from "../domain/types";
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
      const group: Group = {
        id: groupId,
        name: validation.value.name,
        description: validation.value.description,
        createdAt,
        updatedAt: createdAt,
        memberIds: [],
      };
      return {
        ...current,
        groups: [group, ...current.groups],
        selectedGroupId: groupId,
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
      const memberId = createId("member");
      const member = {
        id: memberId,
        name: validation.value.name,
        avatarColor: pickAvatarColor(current.members.length),
        joinedAt: now(),
      };

      return {
        ...current,
        members: [...current.members, member],
        groups: current.groups.map((group) =>
          group.id === groupId
            ? { ...group, memberIds: [...group.memberIds, memberId], updatedAt: now() }
            : group,
        ),
      };
    });
    setError(null);
    return true;
  }, [updateData]);

  const addExpense = useCallback((groupId: string, input: AddExpenseInput) => {
    const group = data.groups.find((item) => item.id === groupId);
    const validation = validateExpenseInput({
      amount: input.amount,
      memberIds: group?.memberIds ?? [],
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
      const expense: Expense = {
        id: createId("expense"),
        groupId,
        title: validation.value.title,
        amountCents: validation.value.amountCents,
        currency: "MXN",
        payerId: validation.value.payerId,
        participantIds: currentGroup.memberIds,
        note: validation.value.note,
        createdAt,
      };

      return {
        ...current,
        expenses: [expense, ...current.expenses],
        groups: current.groups.map((item) =>
          item.id === groupId ? { ...item, updatedAt: createdAt } : item,
        ),
      };
    });
    setError(null);
    return true;
  }, [data.groups, updateData]);

  const markSettlementPaid = useCallback((groupId: string, suggestion: SettlementSuggestion) => {
    updateData((current) => {
      const createdAt = now();
      return {
        ...current,
        settlements: [
          {
            id: createId("settlement"),
            groupId,
            fromMemberId: suggestion.fromMemberId,
            toMemberId: suggestion.toMemberId,
            amountCents: suggestion.amountCents,
            currency: "MXN",
            status: "paid",
            createdAt,
          },
          ...current.settlements,
        ],
        groups: current.groups.map((group) =>
          group.id === groupId ? { ...group, updatedAt: createdAt } : group,
        ),
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
