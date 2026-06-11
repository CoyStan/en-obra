import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearPersistedData, APP_DATA_STORAGE_KEY } from "../state/storage";
import { clearSyncState, SYNC_STORAGE_KEY } from "../state/syncStorage";

export const LOCAL_ACCOUNT_STORAGE_KEY = "cuentas-claras:account:v1";

export type LocalDataTargetId = "app-data" | "sync-state" | "account-state";

export type LocalDataTarget = {
  id: LocalDataTargetId;
  storageKey: string;
  label: string;
  containsUserInput: boolean;
};

export type RemoteDeletionStatus = {
  status: "not-configured";
  reason: string;
};

export type LocalDataDeletionResult = {
  mode: "local-only";
  completedAt: string;
  clearedTargets: LocalDataTarget[];
  remoteDeletion: RemoteDeletionStatus;
  nextLaunchBehavior: string;
};

export const localDataTargets: LocalDataTarget[] = [
  {
    id: "app-data",
    storageKey: APP_DATA_STORAGE_KEY,
    label: "Grupos, integrantes, gastos, liquidaciones e historial local",
    containsUserInput: true,
  },
  {
    id: "sync-state",
    storageKey: SYNC_STORAGE_KEY,
    label: "Cola local de sincronizacion mock y estado de sync",
    containsUserInput: false,
  },
  {
    id: "account-state",
    storageKey: LOCAL_ACCOUNT_STORAGE_KEY,
    label: "Cuenta demo local, nombre y correo capturados en el dispositivo",
    containsUserInput: true,
  },
];

export function getLocalDataInventory() {
  return localDataTargets.map((target) => ({ ...target }));
}

export function getRemoteDeletionStatus(): RemoteDeletionStatus {
  return {
    status: "not-configured",
    reason:
      "La app actual no tiene backend de produccion; la eliminacion remota requiere proveedor, URL publica y proceso humano antes de lanzamiento.",
  };
}

export async function deleteLocalUserData(
  completedAt = new Date().toISOString(),
): Promise<LocalDataDeletionResult> {
  await clearPersistedData();
  await clearSyncState();
  await AsyncStorage.removeItem(LOCAL_ACCOUNT_STORAGE_KEY);

  return {
    mode: "local-only",
    completedAt,
    clearedTargets: getLocalDataInventory(),
    remoteDeletion: getRemoteDeletionStatus(),
    nextLaunchBehavior:
      "Al abrir de nuevo la app, el almacenamiento local vacio cargara datos demo sin cuenta local.",
  };
}
