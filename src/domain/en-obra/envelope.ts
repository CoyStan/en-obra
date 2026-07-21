import type { DatasetKind, StorageEnvelope, TrackerDataV2 } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDatasetKind(value: unknown): value is DatasetKind {
  return value === "user" || value === "demo";
}

function isTrackerDataV2(value: unknown): value is TrackerDataV2 {
  if (!isRecord(value) || value.schemaVersion !== 2) {
    return false;
  }
  return Array.isArray(value.projects) && Array.isArray(value.suppliers) && Array.isArray(value.materials);
}

function isTrackerDataV1(value: unknown) {
  return isRecord(value) && value.version === 1 && Array.isArray(value.projects) && Array.isArray(value.suppliers) && Array.isArray(value.materials);
}

export function parseEnvelope(raw: unknown):
  | { ok: true; envelope: StorageEnvelope }
  | { ok: false; reason: string } {
  if (!isRecord(raw)) {
    return { ok: false, reason: "Storage payload is not an object." };
  }
  if (raw.schemaVersion !== 2) {
    return { ok: false, reason: "Storage envelope must use schema version 2." };
  }
  if (!isDatasetKind(raw.datasetKind)) {
    return { ok: false, reason: "Storage envelope is missing dataset kind." };
  }
  if (typeof raw.writtenAt !== "string" || !raw.writtenAt) {
    return { ok: false, reason: "Storage envelope is missing writtenAt." };
  }
  if (!isTrackerDataV2(raw.data)) {
    return { ok: false, reason: "Storage envelope data is not valid tracker data v2." };
  }

  return {
    ok: true,
    envelope: {
      datasetKind: raw.datasetKind,
      schemaVersion: 2,
      data: raw.data,
      writtenAt: raw.writtenAt,
    },
  };
}

export function loadFromUnknown(raw: unknown):
  | { kind: "v2"; envelope: StorageEnvelope }
  | { kind: "v1"; data: Record<string, unknown> }
  | { kind: "corrupt"; reason: string } {
  const envelopeResult = parseEnvelope(raw);
  if (envelopeResult.ok) {
    return { kind: "v2", envelope: envelopeResult.envelope };
  }

  if (isTrackerDataV1(raw)) {
    return { kind: "v1", data: raw as Record<string, unknown> };
  }

  if (isTrackerDataV2(raw)) {
    return { kind: "corrupt", reason: "Bare tracker v2 data must be wrapped in a storage envelope." };
  }

  return { kind: "corrupt", reason: envelopeResult.reason };
}
