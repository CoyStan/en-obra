import { useCallback, useEffect, useState } from "react";
import { localAccountAdapter } from "./localAccountAdapter";
import type { AccountState, CreateAccountInput } from "./types";

const initialState: AccountState = {
  version: 1,
  profile: null,
  mode: "guest",
};

export function useAccount() {
  const [account, setAccount] = useState<AccountState>(initialState);
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    localAccountAdapter
      .restoreSession()
      .then((state) => {
        if (isMounted) {
          setAccount(state);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccountError("No se pudo cargar la cuenta local.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsAccountLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const createAccount = useCallback(async (input: CreateAccountInput) => {
    try {
      const state = await localAccountAdapter.createAccount(input);
      setAccount(state);
      setAccountError(null);
      return true;
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "No se pudo crear la cuenta demo.");
      return false;
    }
  }, []);

  const setActiveGroupMember = useCallback(async (groupId: string, memberId: string) => {
    try {
      const state = await localAccountAdapter.setActiveGroupMember(groupId, memberId);
      setAccount(state);
      setAccountError(null);
      return true;
    } catch {
      setAccountError("No se pudo guardar tu integrante activo.");
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const state = await localAccountAdapter.signOut();
      setAccount(state);
      setAccountError(null);
    } catch {
      setAccountError("No se pudo cerrar la sesion local.");
    }
  }, []);

  const clearAccountError = useCallback(() => {
    setAccountError(null);
  }, []);

  return {
    account,
    accountError,
    clearAccountError,
    createAccount,
    isAccountLoading,
    setActiveGroupMember,
    signOut,
  };
}
