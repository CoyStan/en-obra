import AsyncStorage from "@react-native-async-storage/async-storage";
import { createId } from "../utils/id";
import { validateAccountInput } from "./accountValidation";
import type { AccountProfile, AccountState, CreateAccountInput } from "./types";

export const ACCOUNT_STORAGE_KEY = "cuentas-claras:account:v1";

const emptyAccountState: AccountState = {
  version: 1,
  profile: null,
  mode: "guest",
};

function now() {
  return new Date().toISOString();
}

function isAccountState(value: unknown): value is AccountState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<AccountState>;
  return (
    candidate.version === 1 &&
    (candidate.mode === "guest" || candidate.mode === "signed-in") &&
    ("profile" in candidate)
  );
}

async function saveAccountState(state: AccountState) {
  await AsyncStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(state));
}

export const localAccountAdapter = {
  async clearLocalAccount(): Promise<AccountState> {
    await AsyncStorage.removeItem(ACCOUNT_STORAGE_KEY);
    return emptyAccountState;
  },

  async setActiveGroupMember(groupId: string, memberId: string): Promise<AccountState> {
    const current = await this.load();
    if (!current.profile) {
      return current;
    }

    const activeMemberByGroupId = {
      ...current.profile.activeMemberByGroupId,
      [groupId]: memberId,
    };

    const state: AccountState = {
      ...current,
      profile: {
        ...current.profile,
        activeMemberByGroupId,
      },
    };
    await saveAccountState(state);
    return state;
  },

  async createAccount(input: CreateAccountInput): Promise<AccountState> {
    const validation = validateAccountInput(input);
    if (!validation.ok) {
      throw new Error(validation.error);
    }

    const createdAt = now();
    const profile: AccountProfile = {
      id: createId("account"),
      displayName: validation.value.displayName,
      activeMemberByGroupId: {},
      email: validation.value.email,
      provider: "local-mock",
      createdAt,
      lastSignedInAt: createdAt,
    };
    const state: AccountState = {
      version: 1,
      profile,
      mode: "signed-in",
    };
    await saveAccountState(state);
    return state;
  },

  async load(): Promise<AccountState> {
    const raw = await AsyncStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) {
      return emptyAccountState;
    }

    const parsed = JSON.parse(raw) as unknown;
    return isAccountState(parsed) ? parsed : emptyAccountState;
  },

  async signOut(): Promise<AccountState> {
    const state = await this.load();
    const nextState: AccountState = {
      ...state,
      mode: "guest",
    };
    await saveAccountState(nextState);
    return nextState;
  },

  async restoreSession(): Promise<AccountState> {
    const state = await this.load();
    if (!state.profile) {
      return emptyAccountState;
    }

    const nextState: AccountState = {
      ...state,
      mode: "signed-in",
      profile: {
        ...state.profile,
        lastSignedInAt: now(),
      },
    };
    await saveAccountState(nextState);
    return nextState;
  },
};
