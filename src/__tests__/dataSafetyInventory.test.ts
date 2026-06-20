import { describe, expect, it } from "vitest";
import { createDataSafetyInventory } from "../backend/dataSafetyInventory";

describe("data safety inventory", () => {
  it("describes the current build as local-first with no backend sharing", () => {
    const inventory = createDataSafetyInventory();

    expect(inventory.buildMode).toBe("local-first-demo");
    expect(inventory.remoteBackendEnabled).toBe(false);
    expect(inventory.realPaymentsEnabled).toBe(false);
    expect(inventory.adsEnabled).toBe(false);
    expect(inventory.analyticsEnabled).toBe(false);
    expect(inventory.items.every((item) => item.sharedWithThirdParties === false)).toBe(true);
  });

  it("tracks local-only account, financial, activity, and diagnostics data", () => {
    const byId = new Map(createDataSafetyInventory().items.map((item) => [item.id, item]));

    expect(byId.get("account-info")?.handling).toBe("local-only");
    expect(byId.get("financial-info")?.handling).toBe("local-only");
    expect(byId.get("app-activity")?.handling).toBe("local-only");
    expect(byId.get("diagnostics")?.handling).toBe("local-only");
    expect(byId.get("financial-info")?.evidence).toContain("src/backend/sqlSchema.ts");
  });

  it("marks payments, location, contacts, and advertising as not collected", () => {
    const byId = new Map(createDataSafetyInventory().items.map((item) => [item.id, item]));

    expect(byId.get("payments")?.handling).toBe("not-collected");
    expect(byId.get("location")?.handling).toBe("not-collected");
    expect(byId.get("contacts")?.handling).toBe("not-collected");
    expect(byId.get("advertising")?.handling).toBe("not-collected");
  });

  it("keeps final Play submission blocked for human/legal work", () => {
    const inventory = createDataSafetyInventory();

    expect(inventory.legalSubmissionReady).toBe(false);
    expect(inventory.blockers).toContain("human legal/privacy approval");
    expect(inventory.blockers).toContain("final Play Console Data Safety answers");
  });
});
