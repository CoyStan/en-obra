import { describe, expect, it } from "vitest";
import { cloneTrackerDemoData } from "../tracker/demoData";
import { normalizeTrackerData } from "../tracker/storage";

describe("tracker storage normalization", () => {
  it("accepts the supported tracker shape without changing valid demo data", () => {
    const normalized = normalizeTrackerData(cloneTrackerDemoData());

    expect(normalized?.repaired).toBe(false);
    expect(normalized?.data.projects).toHaveLength(7);
    expect(normalized?.data.materials).toHaveLength(36);
  });

  it("falls back when storage does not contain a usable tracker record", () => {
    expect(normalizeTrackerData({ version: 1, projects: [], suppliers: [], materials: [] })).toBeUndefined();
    expect(normalizeTrackerData("not a record")).toBeUndefined();
  });

  it("repairs bad active projects and drops records that cannot be rendered safely", () => {
    const corrupt = cloneTrackerDemoData();
    corrupt.activeProjectId = "missing-project";
    corrupt.materials[0] = { ...corrupt.materials[0], status: "not-a-status" as never };
    corrupt.materials[1] = { ...corrupt.materials[1], expectedOn: "2026-02-31" };

    const normalized = normalizeTrackerData(corrupt);

    expect(normalized?.repaired).toBe(true);
    expect(normalized?.data.activeProjectId).toBe(normalized?.data.projects[0].id);
    expect(normalized?.data.materials).toHaveLength(35);
    expect(normalized?.data.materials.some((m: { expectedOn?: string }) => m.expectedOn === "2026-02-31")).toBe(false);
  });
});
