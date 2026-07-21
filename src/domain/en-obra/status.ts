import { isIsoDate, todayIsoDate } from "./dates";
import type { Material, MaterialStatus } from "./types";

export type MaterialUrgency = "late" | "today" | "waiting" | "normal" | "complete";

const materialStatuses = new Set<MaterialStatus>(["to_order", "ordered", "received", "installed"]);

export function canTransition(from: MaterialStatus, to: MaterialStatus) {
  if (from === to || !materialStatuses.has(from) || !materialStatuses.has(to)) {
    return false;
  }
  return true;
}

type StatusChangeOptions = {
  expectedOn?: string;
  receivedOn?: string;
  now: string;
};

export function applyStatusChange(
  material: Material,
  nextStatus: MaterialStatus,
  options: StatusChangeOptions,
): Material {
  const today = todayIsoDate(new Date(options.now));
  const hasReceivedState = nextStatus === "received" || nextStatus === "installed";
  const requestedReceivedOn = options.receivedOn ?? material.receivedOn ?? today;
  const receivedOn = hasReceivedState && isIsoDate(requestedReceivedOn) && requestedReceivedOn <= today
    ? requestedReceivedOn
    : hasReceivedState
      ? today
      : undefined;
  const installedOn = nextStatus === "installed" ? receivedOn ?? today : undefined;
  const expectedOn = nextStatus === "ordered"
    ? isIsoDate(options.expectedOn) ? options.expectedOn : undefined
    : undefined;
  const receiptChanged = receivedOn !== material.receivedOn || installedOn !== material.installedOn;
  const proofNote = !hasReceivedState
    ? undefined
    : nextStatus === "received"
      ? receiptChanged ? "Marcado como recibido por el prestador." : material.proofNote ?? "Marcado como recibido por el prestador."
      : receiptChanged ? "Marcado como usado por el prestador." : material.proofNote ?? "Marcado como usado por el prestador.";

  if (
    material.status === nextStatus
    && material.expectedOn === expectedOn
    && material.receivedOn === receivedOn
    && material.installedOn === installedOn
    && material.proofNote === proofNote
  ) {
    return material;
  }

  return {
    ...material,
    status: nextStatus,
    expectedOn,
    receivedOn,
    installedOn,
    proofNote,
    statusChangedAt: options.now,
    updatedAt: options.now,
  };
}

export function urgency(material: Material, todayIso: string): MaterialUrgency {
  if (material.status === "received" || material.status === "installed") {
    return "complete";
  }
  if (material.status === "ordered" && !material.expectedOn) {
    return "waiting";
  }
  if (material.expectedOn) {
    if (material.expectedOn < todayIso) {
      return "late";
    }
    if (material.expectedOn === todayIso) {
      return "today";
    }
  }
  return "normal";
}

export function latestReceiptDate(materials: Material[]) {
  let latest: string | undefined;
  for (const material of materials) {
    for (const candidate of [material.receivedOn, material.installedOn]) {
      if (!candidate || !isIsoDate(candidate)) {
        continue;
      }
      if (!latest || candidate > latest) {
        latest = candidate;
      }
    }
  }
  return latest;
}

export function clientReadyCount(materials: Material[]) {
  return materials.filter((material) => material.status === "received" || material.status === "installed").length;
}
