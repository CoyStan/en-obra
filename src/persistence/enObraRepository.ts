import AsyncStorage from "@react-native-async-storage/async-storage";
import { createDemoData } from "../domain/en-obra/demo";
import { loadFromUnknown, parseEnvelope } from "../domain/en-obra/envelope";
import { migrateV1ToV2 } from "../domain/en-obra/migrate";
import type { DatasetKind, StorageEnvelope, TrackerDataV2 } from "../domain/en-obra/types";
import {
  EN_OBRA_DEMO_STORAGE_KEY,
  EN_OBRA_RECOVERY_KEY,
  EN_OBRA_STORAGE_KEY,
  LEGACY_TRACKER_V1_KEY,
} from "./keys";

export type SaveState = "idle" | "saving" | "saved" | "failed";

export type LoadResult =
  | {
      status: "empty";
      data: TrackerDataV2;
      datasetKind: "user";
      mutationsBlocked: false;
    }
  | {
      status: "ready";
      data: TrackerDataV2;
      datasetKind: DatasetKind;
      envelope: StorageEnvelope;
      mutationsBlocked: false;
      migrated?: boolean;
    }
  | {
      status: "corrupt";
      reason: string;
      recoveryRaw: string | null;
      data: TrackerDataV2;
      datasetKind: "user";
      mutationsBlocked: true;
    }
  | {
      status: "read_failed";
      reason: string;
      recoveryRaw: string | null;
      data: TrackerDataV2;
      datasetKind: "user";
      mutationsBlocked: true;
    };

function emptyData(): TrackerDataV2 {
  return {
    schemaVersion: 2,
    projects: [],
    suppliers: [],
    materials: [],
  };
}

function wrapEnvelope(data: TrackerDataV2, datasetKind: DatasetKind, writtenAt = new Date().toISOString()): StorageEnvelope {
  return {
    datasetKind,
    schemaVersion: 2,
    data,
    writtenAt,
  };
}

async function preserveRecovery(raw: string) {
  try {
    await AsyncStorage.setItem(EN_OBRA_RECOVERY_KEY, raw);
  } catch {
    // Best-effort: never throw from recovery backup alone.
  }
}

export async function readRecoveryPayload(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(EN_OBRA_RECOVERY_KEY);
  } catch {
    return null;
  }
}

function storageKeyFor(kind: DatasetKind) {
  return kind === "demo" ? EN_OBRA_DEMO_STORAGE_KEY : EN_OBRA_STORAGE_KEY;
}

/**
 * Load user workspace. Never invents demo into user storage.
 * Never overwrites unreadable payloads with demo.
 */
export async function loadUserWorkspace(): Promise<LoadResult> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(EN_OBRA_STORAGE_KEY);
    if (!raw) {
      const legacy = await AsyncStorage.getItem(LEGACY_TRACKER_V1_KEY);
      if (legacy) {
        await preserveRecovery(legacy);
        try {
          const parsed = JSON.parse(legacy) as unknown;
          const loaded = loadFromUnknown(parsed);
          if (loaded.kind === "v1") {
            const migrated = migrateV1ToV2(loaded.data);
            const envelope = wrapEnvelope(migrated, "user");
            await AsyncStorage.setItem(EN_OBRA_STORAGE_KEY, JSON.stringify(envelope));
            return {
              status: "ready",
              data: migrated,
              datasetKind: "user",
              envelope,
              mutationsBlocked: false,
              migrated: true,
            };
          }
          if (loaded.kind === "v2") {
            await AsyncStorage.setItem(EN_OBRA_STORAGE_KEY, JSON.stringify(loaded.envelope));
            return {
              status: "ready",
              data: loaded.envelope.data,
              datasetKind: loaded.envelope.datasetKind === "demo" ? "user" : loaded.envelope.datasetKind,
              envelope: { ...loaded.envelope, datasetKind: "user" },
              mutationsBlocked: false,
              migrated: true,
            };
          }
          return {
            status: "corrupt",
            reason: loaded.reason,
            recoveryRaw: legacy,
            data: emptyData(),
            datasetKind: "user",
            mutationsBlocked: true,
          };
        } catch {
          return {
            status: "corrupt",
            reason: "El archivo legado no es JSON válido.",
            recoveryRaw: legacy,
            data: emptyData(),
            datasetKind: "user",
            mutationsBlocked: true,
          };
        }
      }
      return {
        status: "empty",
        data: emptyData(),
        datasetKind: "user",
        mutationsBlocked: false,
      };
    }
  } catch {
    const recoveryRaw = await readRecoveryPayload();
    return {
      status: "read_failed",
      reason: "No se pudieron leer los datos guardados en este dispositivo.",
      recoveryRaw,
      data: emptyData(),
      datasetKind: "user",
      mutationsBlocked: true,
    };
  }

  await preserveRecovery(raw);

  try {
    const parsed = JSON.parse(raw) as unknown;
    const loaded = loadFromUnknown(parsed);
    if (loaded.kind === "v2") {
      if (loaded.envelope.datasetKind === "demo") {
        // Demo must never live in the user key; treat as corrupt rather than merge.
        return {
          status: "corrupt",
          reason: "Se encontró un conjunto demo en el almacenamiento de usuario.",
          recoveryRaw: raw,
          data: emptyData(),
          datasetKind: "user",
          mutationsBlocked: true,
        };
      }
      return {
        status: "ready",
        data: loaded.envelope.data,
        datasetKind: "user",
        envelope: loaded.envelope,
        mutationsBlocked: false,
      };
    }
    if (loaded.kind === "v1") {
      const migrated = migrateV1ToV2(loaded.data);
      const envelope = wrapEnvelope(migrated, "user");
      await AsyncStorage.setItem(EN_OBRA_STORAGE_KEY, JSON.stringify(envelope));
      return {
        status: "ready",
        data: migrated,
        datasetKind: "user",
        envelope,
        mutationsBlocked: false,
        migrated: true,
      };
    }
    return {
      status: "corrupt",
      reason: loaded.reason,
      recoveryRaw: raw,
      data: emptyData(),
      datasetKind: "user",
      mutationsBlocked: true,
    };
  } catch {
    return {
      status: "corrupt",
      reason: "Los datos guardados no son JSON válido.",
      recoveryRaw: raw,
      data: emptyData(),
      datasetKind: "user",
      mutationsBlocked: true,
    };
  }
}

export async function loadDemoWorkspace(now = new Date()): Promise<LoadResult> {
  try {
    const raw = await AsyncStorage.getItem(EN_OBRA_DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      const envelopeResult = parseEnvelope(parsed);
      if (envelopeResult.ok && envelopeResult.envelope.datasetKind === "demo") {
        return {
          status: "ready",
          data: envelopeResult.envelope.data,
          datasetKind: "demo",
          envelope: envelopeResult.envelope,
          mutationsBlocked: false,
        };
      }
    }
  } catch {
    // Fall through to fresh demo.
  }
  const data = createDemoData(now);
  const envelope = wrapEnvelope(data, "demo");
  try {
    await AsyncStorage.setItem(EN_OBRA_DEMO_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Demo can still be used in memory.
  }
  return {
    status: "ready",
    data,
    datasetKind: "demo",
    envelope,
    mutationsBlocked: false,
  };
}

export type WriteQueue = {
  enqueue: (data: TrackerDataV2, datasetKind: DatasetKind) => Promise<void>;
  getLastConfirmed: () => TrackerDataV2 | null;
  getSaveState: () => SaveState;
};

export function createWriteQueue(
  onState?: (state: SaveState) => void,
): WriteQueue {
  let chain: Promise<void> = Promise.resolve();
  let lastConfirmed: TrackerDataV2 | null = null;
  let saveState: SaveState = "idle";
  let pendingCount = 0;

  const setState = (next: SaveState) => {
    saveState = next;
    onState?.(next);
  };

  return {
    getLastConfirmed: () => lastConfirmed,
    getSaveState: () => saveState,
    enqueue(data, datasetKind) {
      pendingCount += 1;
      setState("saving");
      const snapshot = JSON.parse(JSON.stringify(data)) as TrackerDataV2;
      const run = chain.catch(() => undefined).then(async () => {
        const envelope = wrapEnvelope(snapshot, datasetKind);
        await AsyncStorage.setItem(storageKeyFor(datasetKind), JSON.stringify(envelope));
        lastConfirmed = snapshot;
      });
      const tracked = run.then(
        () => {
          pendingCount = Math.max(0, pendingCount - 1);
          if (pendingCount === 0) {
            setState("saved");
          }
        },
        (error) => {
          pendingCount = Math.max(0, pendingCount - 1);
          setState("failed");
          throw error;
        },
      );
      // Keep the queue alive after a failure so later writes still serialize.
      chain = tracked.catch(() => undefined);
      return tracked;
    },
  };
}

export async function eraseAllUserData(): Promise<void> {
  await AsyncStorage.multiRemove([EN_OBRA_STORAGE_KEY, LEGACY_TRACKER_V1_KEY]);
}

export async function exportEnvelopeJson(data: TrackerDataV2, datasetKind: DatasetKind): Promise<string> {
  return JSON.stringify(wrapEnvelope(data, datasetKind), null, 2);
}

export function emptyWorkspace(): TrackerDataV2 {
  return emptyData();
}

export { wrapEnvelope, parseEnvelope };
