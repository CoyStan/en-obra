import { describe, expect, it } from "vitest";
import { demoData } from "../data/demoData";
import { auditAndRepairAppData, auditAppDataIntegrity } from "../backend/dataIntegrity";
import type { AppData } from "../domain/types";

function cloneData(): AppData {
  return JSON.parse(JSON.stringify(demoData)) as AppData;
}

describe("backend data integrity", () => {
  it("accepts the shipped demo data without integrity issues", () => {
    expect(auditAppDataIntegrity(demoData)).toEqual([]);
  });

  it("repairs a missing selected group", () => {
    const data = cloneData();
    data.selectedGroupId = "missing-group";

    const result = auditAndRepairAppData(data);

    expect(result.issues.map((issue) => issue.code)).toContain("selected_group_missing");
    expect(result.data.groups.some((group) => group.id === result.data.selectedGroupId)).toBe(true);
  });

  it("rebuilds missing participant share rows from expense participants", () => {
    const data = cloneData();
    const targetExpense = data.expenses[0];
    data.expenseParticipants = data.expenseParticipants?.filter(
      (participant) => participant.expenseId !== targetExpense.id,
    );

    const result = auditAndRepairAppData(data);
    const repairedShares = result.data.expenseParticipants?.filter(
      (participant) => participant.expenseId === targetExpense.id,
    ) ?? [];

    expect(result.issues.map((issue) => issue.code)).toContain("expense_participants_missing");
    expect(repairedShares.reduce((sum, share) => sum + share.shareCents, 0)).toBe(targetExpense.amountCents);
  });

  it("removes dangling expense participants and participant ids outside the group", () => {
    const data = cloneData();
    data.expenses[0] = {
      ...data.expenses[0],
      participantIds: [...data.expenses[0].participantIds, "member-roma-fer"],
    };
    data.expenseParticipants = [
      ...(data.expenseParticipants ?? []),
      {
        id: "participant-dangling",
        expenseId: data.expenses[0].id,
        memberId: "member-roma-fer",
        shareMethod: "equal",
        shareCents: 123,
        createdAt: data.expenses[0].createdAt,
      },
    ];

    const result = auditAndRepairAppData(data);
    const repairedExpense = result.data.expenses.find((expense) => expense.id === data.expenses[0].id);
    const repairedShares = result.data.expenseParticipants?.filter(
      (participant) => participant.expenseId === data.expenses[0].id,
    ) ?? [];

    expect(result.issues.map((issue) => issue.code)).toContain("expense_participant_missing");
    expect(repairedExpense?.participantIds).not.toContain("member-roma-fer");
    expect(repairedShares.some((share) => share.memberId === "member-roma-fer")).toBe(false);
    expect(repairedShares.reduce((sum, share) => sum + share.shareCents, 0)).toBe(data.expenses[0].amountCents);
  });

  it("drops settlements that point outside the selected group model", () => {
    const data = cloneData();
    data.settlements = [
      ...data.settlements,
      {
        id: "settlement-bad",
        groupId: "group-oaxaca",
        fromMemberId: "member-oaxaca-ana",
        toMemberId: "member-roma-fer",
        amountCents: 5000,
        currency: "MXN",
        status: "paid",
        createdAt: "2026-06-12T10:00:00Z",
      },
    ];

    const result = auditAndRepairAppData(data);

    expect(result.issues.map((issue) => issue.code)).toContain("settlement_member_missing");
    expect(result.data.settlements.some((settlement) => settlement.id === "settlement-bad")).toBe(false);
  });

  it("drops invalid outbox payloads and invalid attempt counts", () => {
    const data = cloneData();
    data.syncOutbox = [
      {
        id: "outbox-bad-json",
        operation: "create",
        entityType: "expense",
        entityId: "expense-oaxaca-hotel",
        payloadJson: "{bad json",
        status: "pending",
        attemptCount: 0,
        createdAt: "2026-06-12T10:00:00Z",
      },
      {
        id: "outbox-bad-attempts",
        operation: "create",
        entityType: "expense",
        entityId: "expense-oaxaca-hotel",
        payloadJson: "{}",
        status: "pending",
        attemptCount: -1,
        createdAt: "2026-06-12T10:00:00Z",
      },
    ];

    const result = auditAndRepairAppData(data);

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["outbox_payload_invalid", "outbox_attempt_count_invalid"]),
    );
    expect(result.data.syncOutbox).toEqual([]);
  });
});
