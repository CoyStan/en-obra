import { describe, expect, it } from "vitest";
import {
  addExpenseMutation,
  addMemberMutation,
  createGroupMutation,
  markSettlementPaidMutation,
  type MutationContext,
} from "../backend/appMutations";
import { demoData } from "../data/demoData";
import { auditAppDataIntegrity } from "../backend/dataIntegrity";
import type { AppData } from "../domain/types";

function cloneData(): AppData {
  return JSON.parse(JSON.stringify(demoData)) as AppData;
}

function deterministicContext(): MutationContext {
  const counters = new Map<string, number>();
  return {
    now: () => "2026-06-20T12:00:00Z",
    id: (prefix) => {
      const next = (counters.get(prefix) ?? 0) + 1;
      counters.set(prefix, next);
      return `${prefix}-test-${next}`;
    },
  };
}

describe("backend app mutations", () => {
  it("creates a group with owner membership, activity, and outbox rows", () => {
    const result = createGroupMutation(cloneData(), "  Cine CDMX  ", "  Boletos y cena  ", deterministicContext());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const group = result.data.groups[0];
    expect(group).toMatchObject({
      id: "group-test-1",
      name: "Cine CDMX",
      description: "Boletos y cena",
      currencyCode: "MXN",
      createdByUserId: "user-ana",
    });
    expect(result.data.selectedGroupId).toBe(group.id);
    expect(result.data.groupMembers?.some((member) => member.groupId === group.id && member.role === "owner")).toBe(true);
    expect(result.data.activityEvents?.[0]).toMatchObject({
      eventType: "group_created",
      entityType: "group",
      entityId: group.id,
    });
    expect(result.data.syncOutbox?.map((item) => item.entityType).slice(-3)).toEqual([
      "group",
      "group_member",
      "activity_event",
    ]);
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
  });

  it("rejects invalid group input without changing data", () => {
    const data = cloneData();
    const result = createGroupMutation(data, "", "", deterministicContext());

    expect(result.ok).toBe(false);
    expect(result.data).toBe(data);
  });

  it("adds a member with linked user, group member, activity, and outbox rows", () => {
    const data = cloneData();
    const result = addMemberMutation(data, "group-oaxaca", "Valeria", deterministicContext());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.users?.some((user) => user.id === "user-test-1" && user.displayName === "Valeria")).toBe(true);
    expect(result.data.groupMembers?.some((member) => member.id === "member-test-1" && member.groupId === "group-oaxaca")).toBe(true);
    expect(result.data.groups.find((group) => group.id === "group-oaxaca")?.memberIds).toContain("member-test-1");
    expect(result.data.syncOutbox?.map((item) => item.entityType).slice(-3)).toEqual([
      "user",
      "group_member",
      "activity_event",
    ]);
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
  });

  it("adds an expense with equal participant shares and backend outbox rows", () => {
    const data = cloneData();
    const result = addExpenseMutation(
      data,
      "group-oaxaca",
      {
        title: "Café",
        amount: "100.01",
        payerId: "member-oaxaca-ana",
        participantIds: ["member-oaxaca-ana", "member-oaxaca-luis"],
        categoryId: "food",
        actorUserId: "user-ana",
      },
      deterministicContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const expense = result.data.expenses[0];
    const shares = result.data.expenseParticipants?.filter((share) => share.expenseId === expense.id) ?? [];

    expect(expense).toMatchObject({
      id: "expense-test-1",
      title: "Café",
      amountCents: 10001,
      currency: "MXN",
      paidByMemberId: "member-oaxaca-ana",
    });
    expect(shares.reduce((sum, share) => sum + share.shareCents, 0)).toBe(10001);
    expect(result.data.syncOutbox?.map((item) => item.entityType).slice(-4)).toEqual([
      "expense",
      "expense_participant",
      "expense_participant",
      "activity_event",
    ]);
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
  });

  it("rejects invalid expense input without changing data", () => {
    const data = cloneData();
    const result = addExpenseMutation(
      data,
      "group-oaxaca",
      {
        title: "",
        amount: "0",
        payerId: "member-oaxaca-ana",
      },
      deterministicContext(),
    );

    expect(result.ok).toBe(false);
    expect(result.data).toBe(data);
  });

  it("records settlement as local paid record plus activity and outbox rows", () => {
    const data = cloneData();
    const result = markSettlementPaidMutation(
      data,
      "group-oaxaca",
      {
        fromMemberId: "member-oaxaca-diego",
        toMemberId: "member-oaxaca-ana",
        amountCents: 168810,
        currency: "MXN",
      },
      "user-diego",
      deterministicContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.settlements[0]).toMatchObject({
      id: "settlement-test-1",
      status: "paid",
      recordedByUserId: "user-diego",
      note: "Registro local de pago externo.",
    });
    expect(result.data.syncOutbox?.map((item) => item.entityType).slice(-2)).toEqual([
      "settlement",
      "activity_event",
    ]);
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
  });
});
