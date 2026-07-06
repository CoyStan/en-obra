import { describe, expect, it } from "vitest";
import { buildActivity, calculateGroupBalances, describeBalance, simplifySettlements } from "../domain/balances";
import { formatMoney, parseMoneyInput } from "../domain/money";
import { splitEqual } from "../domain/splits";
import type { AppData } from "../domain/types";

const simpleData: AppData = {
  version: 1,
  selectedGroupId: "group",
  groups: [
    {
      id: "group",
      name: "Cena",
      description: "",
      createdAt: "2026-06-10T00:00:00Z",
      updatedAt: "2026-06-10T00:00:00Z",
      memberIds: ["ana", "luis", "maru"],
    },
  ],
  members: [
    { id: "ana", name: "Ana", avatarColor: "#0F7B63", joinedAt: "2026-06-10T00:00:00Z" },
    { id: "luis", name: "Luis", avatarColor: "#2F5D8C", joinedAt: "2026-06-10T00:00:00Z" },
    { id: "maru", name: "Maru", avatarColor: "#D95F43", joinedAt: "2026-06-10T00:00:00Z" },
  ],
  expenses: [
    {
      id: "expense",
      groupId: "group",
      title: "Cena",
      amountCents: 90000,
      currency: "MXN",
      payerId: "ana",
      categoryId: "food",
      participantIds: ["ana", "luis", "maru"],
      createdAt: "2026-06-10T01:00:00Z",
    },
  ],
  settlements: [],
};

describe("money helpers", () => {
  it("parses and formats MXN amounts", () => {
    expect(parseMoneyInput("$1,234.50 MXN")).toBe(123450);
    expect(parseMoneyInput("120,25")).toBe(12025);
    expect(parseMoneyInput("0")).toBeNull();
    expect(formatMoney(123450)).toContain("MXN");
  });

  it("splits cents equally without losing the remainder", () => {
    const shares = splitEqual(100, ["a", "b", "c"]);

    expect(shares).toEqual([
      { memberId: "a", amountCents: 34 },
      { memberId: "b", amountCents: 33 },
      { memberId: "c", amountCents: 33 },
    ]);
    expect(shares.reduce((sum, share) => sum + share.amountCents, 0)).toBe(100);
  });
});

describe("group balances", () => {
  it("calculates who should pay whom after an equal split", () => {
    const balances = calculateGroupBalances(simpleData, "group");
    const suggestions = simplifySettlements(balances);
    const anaBalance = balances.find((balance) => balance.member.id === "ana");

    expect(anaBalance?.netCents).toBe(60000);
    expect(balances.find((balance) => balance.member.id === "luis")?.netCents).toBe(-30000);
    expect(balances.find((balance) => balance.member.id === "maru")?.netCents).toBe(-30000);
    expect(anaBalance ? describeBalance(anaBalance) : "").toMatch(/Le tocaba MXN\s300\.00/);
    expect(suggestions).toEqual([
      { fromMemberId: "luis", toMemberId: "ana", amountCents: 30000, currency: "MXN" },
      { fromMemberId: "maru", toMemberId: "ana", amountCents: 30000, currency: "MXN" },
    ]);
  });

  it("applies paid settlements to the ledger", () => {
    const settledData: AppData = {
      ...simpleData,
      settlements: [
        {
          id: "settlement",
          groupId: "group",
          fromMemberId: "luis",
          toMemberId: "ana",
          amountCents: 30000,
          currency: "MXN",
          status: "paid",
          createdAt: "2026-06-10T02:00:00Z",
        },
      ],
    };

    const balances = calculateGroupBalances(settledData, "group");
    const suggestions = simplifySettlements(balances);

    expect(balances.find((balance) => balance.member.id === "ana")?.netCents).toBe(30000);
    expect(balances.find((balance) => balance.member.id === "luis")?.netCents).toBe(0);
    expect(suggestions).toEqual([
      { fromMemberId: "maru", toMemberId: "ana", amountCents: 30000, currency: "MXN" },
    ]);
  });

  it("explains activity and paid settlements without payment-rail language", () => {
    const settledData: AppData = {
      ...simpleData,
      settlements: [
        {
          id: "settlement",
          groupId: "group",
          fromMemberId: "luis",
          toMemberId: "ana",
          amountCents: 30000,
          currency: "MXN",
          status: "paid",
          createdAt: "2026-06-10T02:00:00Z",
        },
      ],
    };

    const activity = buildActivity(settledData, "group");

    expect(activity[0]).toMatchObject({
      title: "Luis pagó a Ana",
      subtitle: "Marcado pagado localmente · Sin pagos reales",
    });
    expect(activity[1].subtitle).toBe("Pagó Ana · Dividido entre 3 participantes");
    expect(activity[1].categoryId).toBe("food");
  });

  it("builds an actor-aware audit trail from activity events", () => {
    const eventData: AppData = {
      ...simpleData,
      version: 2,
      selectedUserId: "user-ana",
      users: [
        {
          id: "user-ana",
          displayName: "Ana",
          avatarColor: "#0E7C66",
          createdAt: "2026-06-10T00:00:00Z",
          updatedAt: "2026-06-10T00:00:00Z",
        },
      ],
      activityEvents: [
        {
          id: "activity-expense",
          groupId: "group",
          actorUserId: "user-ana",
          eventType: "expense_created",
          entityType: "expense",
          entityId: "expense",
          summary: "Se agregó Cena",
          createdAt: "2026-06-10T01:05:00Z",
        },
      ],
    };

    const activity = buildActivity(eventData, "group");

    expect(activity).toHaveLength(1);
    expect(activity[0]).toMatchObject({
      actorName: "Ana",
      categoryId: "food",
      label: "Gasto",
      subtitle: "Ana registró · Pagó Ana · 3 participantes",
      title: "Cena",
      type: "expense",
    });
  });

  it("keeps orphaned activity events as local audit rows", () => {
    const eventData: AppData = {
      ...simpleData,
      version: 2,
      users: [
        {
          id: "user-ana",
          displayName: "Ana",
          avatarColor: "#0E7C66",
          createdAt: "2026-06-10T00:00:00Z",
          updatedAt: "2026-06-10T00:00:00Z",
        },
      ],
      activityEvents: [
        {
          id: "activity-missing",
          groupId: "group",
          actorUserId: "user-ana",
          eventType: "settlement_recorded",
          entityType: "settlement",
          entityId: "missing-settlement",
          summary: "Se marcó un arreglo local",
          createdAt: "2026-06-10T03:00:00Z",
        },
      ],
    };

    expect(buildActivity(eventData, "group")[0]).toMatchObject({
      actorName: "Ana",
      label: "Registro local",
      subtitle: "Ana registró un cambio local · Cena",
      title: "Se marcó un arreglo local",
      type: "settlement",
    });
  });
});
