import { describe, expect, it } from "vitest";
import {
  addExpenseMutation,
  addMemberMutation,
  createGroupMutation,
  deleteExpenseMutation,
  joinGroupByInviteMutation,
  markSettlementPaidMutation,
  removeMemberMutation,
  renameMemberMutation,
  updateExpenseMutation,
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
    expect(result.data.groupInvites?.[0]).toMatchObject({
      groupId: group.id,
      status: "active",
      createdByUserId: "user-ana",
    });
    expect(result.data.groupMembers?.some((member) => member.groupId === group.id && member.role === "owner")).toBe(true);
    expect(result.data.activityEvents?.[0]).toMatchObject({
      eventType: "group_created",
      entityType: "group",
      entityId: group.id,
    });
    expect(result.data.syncOutbox?.map((item) => item.entityType).slice(-4)).toEqual([
      "group",
      "group_member",
      "group_invite",
      "activity_event",
    ]);
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
  });

  it("joins a local group from an active invite code", () => {
    const data = cloneData();
    const result = joinGroupByInviteMutation(
      { ...data, selectedUserId: "user-ana" },
      { inviteCode: " cc-asada-mty " },
      deterministicContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.selectedGroupId).toBe("group-asada");
    expect(result.data.groupMembers?.some((member) =>
      member.id === "member-test-1" &&
      member.groupId === "group-asada" &&
      member.userId === "user-ana" &&
      member.joinSource === "invite" &&
      member.inviteId === "invite-asada",
    )).toBe(true);
    expect(result.data.groups.find((group) => group.id === "group-asada")?.memberIds).toContain("member-test-1");
    expect(result.data.groupInvites?.find((invite) => invite.id === "invite-asada")?.lastUsedAt).toBe("2026-06-20T12:00:00Z");
    expect(result.data.syncOutbox?.map((item) => item.entityType).slice(-3)).toEqual([
      "group_invite",
      "group_member",
      "activity_event",
    ]);
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
  });

  it("selects an existing group when the invite user is already a member", () => {
    const data = cloneData();
    const result = joinGroupByInviteMutation(
      { ...data, selectedGroupId: "group-roma", selectedUserId: "user-ana" },
      { inviteCode: "CC-OAXACA-2026" },
      deterministicContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.selectedGroupId).toBe("group-oaxaca");
    expect(result.data.groupMembers).toHaveLength(data.groupMembers?.length ?? 0);
    expect(result.data.syncOutbox).toEqual(data.syncOutbox);
  });

  it("rejects unknown local invite codes", () => {
    const data = cloneData();
    const result = joinGroupByInviteMutation(data, { inviteCode: "NOPE" }, deterministicContext());

    expect(result.ok).toBe(false);
    expect(result.data).toBe(data);
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

  it("renames a local group member without changing balances", () => {
    const data = cloneData();
    const beforeBalanceCount = data.expenseParticipants?.length;
    const result = renameMemberMutation(data, "group-oaxaca", "member-oaxaca-luis", "Luis Ángel", deterministicContext());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.groupMembers?.find((member) => member.id === "member-oaxaca-luis")?.displayNameSnapshot).toBe("Luis Ángel");
    expect(result.data.users?.find((user) => user.id === "user-luis")?.displayName).toBe("Luis Ángel");
    expect(result.data.expenseParticipants?.length).toBe(beforeBalanceCount);
    expect(result.data.syncOutbox?.at(-1)?.operation).toBe("update");
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
  });

  it("removes a local member only when they have no money references", () => {
    const data = cloneData();
    const added = addMemberMutation(data, "group-oaxaca", "Valeria", deterministicContext());
    expect(added.ok).toBe(true);
    if (!added.ok) return;

    const result = removeMemberMutation(added.data, "group-oaxaca", "member-test-1", deterministicContext());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.groupMembers?.some((member) => member.id === "member-test-1")).toBe(false);
    expect(result.data.groups.find((group) => group.id === "group-oaxaca")?.memberIds).not.toContain("member-test-1");
    expect(result.data.syncOutbox?.at(-1)).toMatchObject({
      entityType: "group_member",
      operation: "delete",
    });
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
  });

  it("blocks removing members with expenses or settlements", () => {
    const data = cloneData();
    const result = removeMemberMutation(data, "group-oaxaca", "member-oaxaca-luis", deterministicContext());

    expect(result.ok).toBe(false);
    expect(result.data).toBe(data);
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

  it("adds an expense with exact participant shares", () => {
    const data = cloneData();
    const result = addExpenseMutation(
      data,
      "group-oaxaca",
      {
        title: "Cena parcial",
        amount: "100.01",
        payerId: "member-oaxaca-ana",
        split: {
          method: "exact",
          shares: [
            { memberId: "member-oaxaca-ana", amountCents: 6000 },
            { memberId: "member-oaxaca-luis", amountCents: 4001 },
          ],
        },
      },
      deterministicContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const expense = result.data.expenses[0];
    const shares = result.data.expenseParticipants?.filter((share) => share.expenseId === expense.id) ?? [];

    expect(expense.participantIds).toEqual(["member-oaxaca-ana", "member-oaxaca-luis"]);
    expect(shares.map((share) => [share.memberId, share.shareMethod, share.shareCents])).toEqual([
      ["member-oaxaca-ana", "exact", 6000],
      ["member-oaxaca-luis", "exact", 4001],
    ]);
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
  });

  it("adds an expense with share units and rounded cents", () => {
    const data = cloneData();
    const result = addExpenseMutation(
      data,
      "group-oaxaca",
      {
        title: "Hotel por partes",
        amount: "100.00",
        payerId: "member-oaxaca-ana",
        split: {
          method: "shares",
          shares: [
            { memberId: "member-oaxaca-ana", units: 2 },
            { memberId: "member-oaxaca-luis", units: 1 },
            { memberId: "member-oaxaca-maru", units: 1 },
          ],
        },
      },
      deterministicContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const expense = result.data.expenses[0];
    const shares = result.data.expenseParticipants?.filter((share) => share.expenseId === expense.id) ?? [];

    expect(shares.map((share) => [share.memberId, share.shareMethod, share.shareCents, share.shareUnits])).toEqual([
      ["member-oaxaca-ana", "shares", 5000, 2],
      ["member-oaxaca-luis", "shares", 2500, 1],
      ["member-oaxaca-maru", "shares", 2500, 1],
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

  it("updates an expense with new participant shares and an audit event", () => {
    const data = cloneData();
    const result = updateExpenseMutation(
      data,
      "group-oaxaca",
      "expense-oaxaca-taxi",
      {
        title: "Taxi aeropuerto editado",
        amount: "900.00",
        payerId: "member-oaxaca-diego",
        categoryId: "transport",
        actorUserId: "user-diego",
        split: {
          method: "exact",
          shares: [
            { memberId: "member-oaxaca-diego", amountCents: 50000 },
            { memberId: "member-oaxaca-ana", amountCents: 40000 },
          ],
        },
      },
      deterministicContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const expense = result.data.expenses.find((item) => item.id === "expense-oaxaca-taxi");
    const shares = result.data.expenseParticipants?.filter((share) => share.expenseId === "expense-oaxaca-taxi") ?? [];

    expect(expense).toMatchObject({
      title: "Taxi aeropuerto editado",
      amountCents: 90000,
      paidByMemberId: "member-oaxaca-diego",
      participantIds: ["member-oaxaca-diego", "member-oaxaca-ana"],
    });
    expect(shares.map((share) => [share.memberId, share.shareMethod, share.shareCents])).toEqual([
      ["member-oaxaca-diego", "exact", 50000],
      ["member-oaxaca-ana", "exact", 40000],
    ]);
    expect(result.data.activityEvents?.[0]).toMatchObject({
      eventType: "expense_updated",
      entityType: "expense",
      entityId: "expense-oaxaca-taxi",
    });
    expect(result.data.syncOutbox?.some((item) => item.operation === "update" && item.entityType === "expense")).toBe(true);
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
  });

  it("deletes a local expense, removes shares, and keeps an orphan audit event", () => {
    const data = cloneData();
    const result = deleteExpenseMutation(
      data,
      "group-oaxaca",
      "expense-oaxaca-taxi",
      "user-maru",
      deterministicContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.expenses.some((expense) => expense.id === "expense-oaxaca-taxi")).toBe(false);
    expect(result.data.expenseParticipants?.some((share) => share.expenseId === "expense-oaxaca-taxi")).toBe(false);
    expect(result.data.activityEvents?.[0]).toMatchObject({
      eventType: "expense_deleted",
      entityType: "expense",
      entityId: "expense-oaxaca-taxi",
      summary: "Se eliminó Taxi aeropuerto",
    });
    expect(result.data.syncOutbox?.some((item) => item.operation === "delete" && item.entityType === "expense")).toBe(true);
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
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
      {
        localBankAlias: "  BBVA Ana  ",
        localClabeReference: " CLABE demo terminación 1234 ",
      },
      deterministicContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.settlements[0]).toMatchObject({
      id: "settlement-test-1",
      localBankAlias: "BBVA Ana",
      localClabeReference: "CLABE demo terminación 1234",
      status: "paid",
      recordedByUserId: "user-diego",
      note: "Registro local de pago externo con nota de referencia.",
    });
    expect(result.data.syncOutbox?.map((item) => item.entityType).slice(-2)).toEqual([
      "settlement",
      "activity_event",
    ]);
    expect(auditAppDataIntegrity(result.data)).toEqual([]);
  });

  it("does not store empty settlement helper fields", () => {
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
      {
        localBankAlias: " ",
        localClabeReference: "",
      },
      deterministicContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.settlements[0]).toMatchObject({
      localBankAlias: undefined,
      localClabeReference: undefined,
      note: "Registro local de pago externo.",
    });
  });
});
