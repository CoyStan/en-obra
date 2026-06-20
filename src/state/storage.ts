import AsyncStorage from "@react-native-async-storage/async-storage";
import { auditAndRepairAppData } from "../backend/dataIntegrity";
import { demoData } from "../data/demoData";
import type { AppData } from "../domain/types";

export const APP_DATA_STORAGE_KEY = "cuentas-claras:v1";

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<AppData>;
  return (
    (candidate.version === 1 || candidate.version === 2) &&
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
  const raw = await AsyncStorage.getItem(APP_DATA_STORAGE_KEY);
  if (!raw) {
    return cloneDemoData();
  }

  const parsed = JSON.parse(raw) as unknown;
  return isAppData(parsed) ? auditAndRepairAppData(parsed).data : cloneDemoData();
}

export async function persistData(data: AppData) {
  await AsyncStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(data));
}

export async function clearPersistedData() {
  await AsyncStorage.removeItem(APP_DATA_STORAGE_KEY);
}
