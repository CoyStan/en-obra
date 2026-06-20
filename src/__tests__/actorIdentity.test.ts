import { describe, expect, it } from "vitest";
import { resolveActorUserId } from "../state/actorIdentity";

const data = {
  selectedUserId: "user-ana",
  users: [
    {
      id: "user-ana",
      displayName: "Ana",
      avatarColor: "#0E7C66",
      createdAt: "2026-06-10T00:00:00Z",
      updatedAt: "2026-06-10T00:00:00Z",
    },
    {
      id: "user-diego",
      displayName: "Diego",
      avatarColor: "#2A4FD4",
      createdAt: "2026-06-10T00:00:00Z",
      updatedAt: "2026-06-10T00:00:00Z",
    },
  ],
};

describe("actor identity resolution", () => {
  it("uses the active group user when it exists locally", () => {
    expect(resolveActorUserId(data, "user-diego")).toBe("user-diego");
  });

  it("falls back to the selected demo user for stale identities", () => {
    expect(resolveActorUserId(data, "user-missing")).toBe("user-ana");
  });

  it("uses the selected demo user when no active group user is supplied", () => {
    expect(resolveActorUserId(data)).toBe("user-ana");
  });
});
