import AsyncStorage from "@react-native-async-storage/async-storage";
import { demoData } from "../data/demoData";
import type { AppData } from "../domain/types";

const STORAGE_KEY = "cuentas-claras:v1";

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<AppData>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.groups) &&
    Array.isArray(candidate.members) &&
    Array.isArray(candidate.expenses) &&
    Array.isArray(candidate.settlements) &&
    typeof candidate.selectedGroupId === "string"
  );
}

export function cloneDemoData(): AppData {
  return JSON.parse(JSON.stringify(demoData)) as AppData;
}

export async function loadPersistedData(): Promise<AppData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return cloneDemoData();
  }

  const parsed = JSON.parse(raw) as unknown;
  return isAppData(parsed) ? parsed : cloneDemoData();
}

export async function persistData(data: AppData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function clearPersistedData() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
