import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateGroupSummary } from "../domain/balances";
import { parseMoneyInput } from "../domain/money";
import type { AppData, Expense, Group, SettlementSuggestion } from "../domain/types";
import { createId } from "../utils/id";
import { cloneDemoData, loadPersistedData, persistData } from "./storage";

const avatarColors = ["#0F7B63", "#2F5D8C", "#D95F43", "#C58B2C", "#7357A4", "#357C8A"];

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
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Ponle nombre al grupo.");
      return;
    }

    updateData((current) => {
      const group: Group = {
        id: groupId,
        name: cleanName,
        description: description.trim(),
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
  }, [updateData]);

  const addMember = useCallback((groupId: string, name: string) => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Escribe el nombre del integrante.");
      return;
    }

    updateData((current) => {
      const memberId = createId("member");
      const member = {
        id: memberId,
        name: cleanName,
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
  }, [updateData]);

  const addExpense = useCallback((groupId: string, input: AddExpenseInput) => {
    const amountCents = parseMoneyInput(input.amount);
    const title = input.title.trim();
    if (!title) {
      setError("Agrega un concepto para el gasto.");
      return;
    }
    if (!amountCents) {
      setError("Ingresa un monto valido mayor a cero.");
      return;
    }

    updateData((current) => {
      const group = current.groups.find((item) => item.id === groupId);
      if (!group || group.memberIds.length === 0) {
        setError("Agrega integrantes antes de registrar gastos.");
        return current;
      }

      const payerId = input.payerId || group.memberIds[0];
      const createdAt = now();
      const expense: Expense = {
        id: createId("expense"),
        groupId,
        title,
        amountCents,
        currency: "MXN",
        payerId,
        participantIds: group.memberIds,
        note: input.note?.trim() || undefined,
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
  }, [updateData]);

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
