import { describe, expect, it } from "vitest";
import { demoData } from "../data/demoData";
import { normalizeAppData } from "../domain/appDataNormalization";
import { calculateGroupBalances } from "../domain/balances";
import type { AppData } from "../domain/types";

describe("SQL-ready local model", () => {
  it("ships demo data with users, group members, participants, activity, and outbox", () => {
    expect(demoData.version).toBe(2);
    expect(demoData.users?.length).toBeGreaterThanOrEqual(4);
    expect(demoData.groupInvites?.length).toBeGreaterThanOrEqual(3);
    expect(demoData.groupMembers?.length).toBeGreaterThanOrEqual(8);
    expect(demoData.expenseParticipants?.length).toBeGreaterThan(0);
    expect(demoData.activityEvents?.length).toBeGreaterThan(0);
    expect(demoData.syncOutbox).toEqual([]);

    for (const member of demoData.groupMembers ?? []) {
      expect(member.status).toBe("active");
      expect(["seed", "created", "manual", "invite"]).toContain(member.joinSource);
      if (member.joinSource === "invite") {
        expect(member.inviteId).toMatch(/^invite-/);
        expect(member.invitedByUserId).toMatch(/^user-/);
      }
    }

    for (const expense of demoData.expenses) {
      const shares = demoData.expenseParticipants?.filter((share) => share.expenseId === expense.id) ?? [];
      expect(shares.reduce((sum, share) => sum + share.shareCents, 0)).toBe(expense.amountCents);
    }
  });

  it("calculates balances from expense participant rows", () => {
    const balances = calculateGroupBalances(demoData, "group-oaxaca");
    const ana = balances.find((balance) => balance.member.id === "member-oaxaca-ana");

    expect(ana?.member.userId).toBe("user-ana");
    expect(ana?.netCents).toBeGreaterThan(0);
  });

  it("normalizes legacy v1 data into v2 SQL-ready entities", () => {
    const legacy: AppData = {
      version: 1,
      selectedGroupId: "group-demo",
      groups: [
        {
          id: "group-demo",
          name: "Cena",
          description: "",
          createdAt: "2026-06-10T00:00:00Z",
          updatedAt: "2026-06-10T00:00:00Z",
          memberIds: ["member-ana", "member-luis"],
        },
      ],
      members: [
        { id: "member-ana", name: "Ana", avatarColor: "#0E7C66", joinedAt: "2026-06-10T00:00:00Z" },
        { id: "member-luis", name: "Luis", avatarColor: "#2A4FD4", joinedAt: "2026-06-10T00:00:00Z" },
      ],
      expenses: [
        {
          id: "expense-cena",
          groupId: "group-demo",
          title: "Cena",
          amountCents: 10001,
          currency: "MXN",
          payerId: "member-ana",
          participantIds: ["member-ana", "member-luis"],
          createdAt: "2026-06-10T01:00:00Z",
        },
      ],
      settlements: [],
    };

    const normalized = normalizeAppData(legacy);

    expect(normalized.version).toBe(2);
    expect(normalized.users?.map((user) => user.displayName)).toEqual(["Ana", "Luis"]);
    expect(normalized.groupMembers?.map((member) => member.groupId)).toEqual(["group-demo", "group-demo"]);
    expect(normalized.groupInvites?.[0]).toMatchObject({
      groupId: "group-demo",
      status: "active",
    });
    expect(normalized.groupMembers?.map((member) => member.status)).toEqual(["active", "active"]);
    expect(normalized.expenseParticipants?.reduce((sum, share) => sum + share.shareCents, 0)).toBe(10001);
    expect(normalized.groups[0].currencyCode).toBe("MXN");
    expect(normalized.expenses[0].paidByMemberId).toBe("member-ana");
  });
});
