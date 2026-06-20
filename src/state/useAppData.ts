import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addExpenseMutation,
  addMemberMutation,
  createGroupMutation,
  markSettlementPaidMutation,
} from "../backend/appMutations";
import { calculateGroupSummary, getGroupMembers } from "../domain/balances";
import type {
  AppData,
  SettlementSuggestion,
} from "../domain/types";
import { cloneDemoData, loadPersistedData, persistData } from "./storage";

type AddExpenseInput = {
  title: string;
  amount: string;
  payerId: string;
  categoryId?: string;
  participantIds?: string[];
  actorUserId?: string;
  note?: string;
};

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
    const result = createGroupMutation(data, name, description);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setData(result.data);
    persistData(result.data).catch(() => {
      setError("No se pudo guardar el cambio localmente.");
    });
    setError(null);
    return true;
  }, [data]);

  const addMember = useCallback((groupId: string, name: string) => {
    const result = addMemberMutation(data, groupId, name);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setData(result.data);
    persistData(result.data).catch(() => {
      setError("No se pudo guardar el cambio localmente.");
    });
    setError(null);
    return true;
  }, [data]);

  const addExpense = useCallback((groupId: string, input: AddExpenseInput) => {
    const result = addExpenseMutation(data, groupId, input);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setData(result.data);
    persistData(result.data).catch(() => {
      setError("No se pudo guardar el cambio localmente.");
    });
    setError(null);
    return true;
  }, [data]);

  const markSettlementPaid = useCallback((groupId: string, suggestion: SettlementSuggestion, actorUserId?: string) => {
    const result = markSettlementPaidMutation(data, groupId, suggestion, actorUserId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setData(result.data);
    persistData(result.data).catch(() => {
      setError("No se pudo guardar el cambio localmente.");
    });
    setError(null);
  }, [data]);

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
