import { describe, expect, it } from "vitest";
import {
  applyStatusChange,
  clientReadyCount,
  latestReceiptDate,
  urgency,
} from "../en-obra/status";
import type { Material } from "../en-obra/types";

const baseMaterial: Material = {
  id: "material-1",
  projectId: "project-1",
  supplierId: "supplier-1",
  name: "Piedra de río",
  quantity: "4 sacos",
  status: "ordered",
  expectedOn: "2026-07-16",
  statusChangedAt: "2026-07-18T09:00:00Z",
  createdAt: "2026-07-18T09:00:00Z",
  updatedAt: "2026-07-18T09:00:00Z",
};

describe("status helpers", () => {
  it("computes urgency with injected today", () => {
    expect(urgency({ ...baseMaterial, expectedOn: "2026-07-16" }, "2026-07-18")).toBe("late");
    expect(urgency({ ...baseMaterial, expectedOn: "2026-07-18" }, "2026-07-18")).toBe("today");
    expect(urgency({ ...baseMaterial, expectedOn: undefined }, "2026-07-18")).toBe("waiting");
    expect(urgency({ ...baseMaterial, expectedOn: "2026-07-21" }, "2026-07-18")).toBe("normal");
    expect(urgency({ ...baseMaterial, status: "received", receivedOn: "2026-07-18" }, "2026-07-18")).toBe("complete");
  });

  it("uses receipt dates only for latestReceiptDate", () => {
    const latest = latestReceiptDate([
      {
        ...baseMaterial,
        receivedOn: "2026-07-17",
        updatedAt: "2026-07-20T09:00:00Z",
      },
      {
        ...baseMaterial,
        id: "material-2",
        installedOn: "2026-07-18",
        updatedAt: "2026-07-19T09:00:00Z",
      },
    ]);

    expect(latest).toBe("2026-07-18");
  });

  it("counts client-ready materials as received plus installed", () => {
    expect(clientReadyCount([
      { ...baseMaterial, status: "received" },
      { ...baseMaterial, id: "material-2", status: "installed" },
      { ...baseMaterial, id: "material-3", status: "ordered" },
    ])).toBe(2);
  });

  it("only keeps expected delivery when status is ordered", () => {
    const ordered = applyStatusChange(baseMaterial, "ordered", {
      expectedOn: "2026-07-21",
      now: "2026-07-18T17:30:00Z",
    });
    const received = applyStatusChange(ordered, "received", {
      expectedOn: "2026-07-25",
      receivedOn: "2026-07-18",
      now: "2026-07-18T18:00:00Z",
    });

    expect(ordered.expectedOn).toBe("2026-07-21");
    expect(received.expectedOn).toBeUndefined();
    expect(received.receivedOn).toBe("2026-07-18");
    expect(received.proofNote).toBe("Marcado como recibido por el prestador.");
  });
});
