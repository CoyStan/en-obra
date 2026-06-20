import { describe, expect, it, vi } from "vitest";
import {
  createBackendReleaseManifestJson,
  createBackendReleaseManifest,
  verifyBackendReleaseManifest,
} from "../backend/backendReleaseManifest";
import { REQUIRED_BACKEND_CAPABILITIES } from "../backend/backendReleaseGate";

declare const require: (moduleName: string) => { readFileSync: (path: string, encoding: "utf8") => string };

const { readFileSync } = require("fs");

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe("backend release manifest", () => {
  it("creates a deterministic provider-neutral release manifest", () => {
    const first = createBackendReleaseManifest("2026-06-20T12:00:00Z");
    const second = createBackendReleaseManifest("2026-06-20T12:00:00Z");

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      version: 1,
      app: "Cuentas Claras",
      target: "play-internal-testing",
      backendMode: "local-first-provider-neutral",
      realPaymentsEnabled: false,
      schemaVersion: 1,
    });
    expect(first.tableNames).toContain("sync_outbox");
    expect(first.requiredCapabilities).toEqual([...REQUIRED_BACKEND_CAPABILITIES]);
    expect(first.readyCapabilities).toEqual([...REQUIRED_BACKEND_CAPABILITIES].sort());
    expect(first.knownBlockers).toEqual([
      "production-auth",
      "production-storage",
      "remote-deletion",
    ]);
    expect(first.unexpectedBlockers).toEqual([]);
    expect(first.commands).toContain("npm run release:android:check");
    expect(first.checksums.schemaSql).toMatch(/^fnv1a32:/);
    expect(first.checksums.seedSql).toMatch(/^fnv1a32:/);
    expect(first.checksums.gate).toMatch(/^fnv1a32:/);
    expect(first.checksums.manifestBody).toMatch(/^fnv1a32:/);
    expect(verifyBackendReleaseManifest(first)).toBe(true);
  });

  it("changes checksum when generation time changes", () => {
    const first = createBackendReleaseManifest("2026-06-20T12:00:00Z");
    const second = createBackendReleaseManifest("2026-06-20T12:00:01Z");

    expect(first.checksums.manifestBody).not.toBe(second.checksums.manifestBody);
  });

  it("detects tampered manifest content", () => {
    const manifest = createBackendReleaseManifest("2026-06-20T12:00:00Z");
    const tampered = {
      ...manifest,
      knownBlockers: manifest.knownBlockers.filter((id) => id !== "remote-deletion"),
    };

    expect(verifyBackendReleaseManifest(tampered)).toBe(false);
  });

  it("keeps the committed backend release manifest synchronized", () => {
    const committed = readFileSync("docs/backend/release-manifest-v1.json", "utf8");
    const generated = createBackendReleaseManifestJson("2026-06-20T12:00:00Z");
    const parsed = JSON.parse(committed);

    expect(committed).toBe(generated);
    expect(verifyBackendReleaseManifest(parsed)).toBe(true);
  });
});
