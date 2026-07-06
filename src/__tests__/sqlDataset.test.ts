import { describe, expect, it } from "vitest";
import { demoData } from "../data/demoData";
import { createSqlDataset, createSqlInserts, createSqlSnapshot } from "../backend/sqlDataset";
import { SQL_SCHEMA_VERSION, SQL_TABLES, createSqlSchema } from "../backend/sqlSchema";

function ids(rows: Record<string, unknown>[]) {
  return new Set(rows.map((row) => row.id));
}

describe("SQL backend dataset foundation", () => {
  it("defines the release-critical backend tables", () => {
    expect(SQL_TABLES.map((table) => table.name)).toEqual([
      "app_metadata",
      "users",
      "groups",
      "group_members",
      "group_invites",
      "expenses",
      "expense_participants",
      "settlements",
      "activity_events",
      "sync_outbox",
    ]);

    const schema = createSqlSchema();

    expect(schema).toContain("PRAGMA foreign_keys = ON;");
    expect(schema).toContain("CREATE TABLE IF NOT EXISTS users");
    expect(schema).toContain("CREATE TABLE IF NOT EXISTS group_invites");
    expect(schema).toContain("CREATE TABLE IF NOT EXISTS sync_outbox");
    expect(schema).toContain("join_source TEXT NOT NULL DEFAULT 'seed'");
    expect(schema).toContain("amount_cents INTEGER NOT NULL CHECK");
    expect(schema).toContain("share_cents INTEGER NOT NULL CHECK");
    expect(schema).toContain("share_method IN ('equal', 'exact', 'shares')");
    expect(schema).toContain("share_units INTEGER");
    expect(schema).toContain("currency_code TEXT NOT NULL DEFAULT 'MXN'");
  });

  it("exports current demo data as ordered SQL rows", () => {
    const dataset = createSqlDataset(demoData);

    expect(dataset.users).toHaveLength(demoData.users?.length ?? 0);
    expect(dataset.groups).toHaveLength(demoData.groups.length);
    expect(dataset.group_members).toHaveLength(demoData.groupMembers?.length ?? 0);
    expect(dataset.group_invites).toHaveLength(demoData.groupInvites?.length ?? 0);
    expect(dataset.expenses).toHaveLength(demoData.expenses.length);
    expect(dataset.expense_participants).toHaveLength(demoData.expenseParticipants?.length ?? 0);
    expect(dataset.settlements).toHaveLength(demoData.settlements.length);
    expect(dataset.activity_events).toHaveLength(demoData.activityEvents?.length ?? 0);
    expect(dataset.app_metadata).toContainEqual({
      key: "schema_version",
      value: String(SQL_SCHEMA_VERSION),
      updated_at: expect.any(String),
    });
  });

  it("keeps SQL seed references internally valid", () => {
    const dataset = createSqlDataset(demoData);
    const userIds = ids(dataset.users);
    const groupIds = ids(dataset.groups);
    const memberIds = ids(dataset.group_members);
    const inviteIds = ids(dataset.group_invites);
    const expenseIds = ids(dataset.expenses);

    for (const group of dataset.groups) {
      if (group.created_by_user_id) {
        expect(userIds.has(group.created_by_user_id)).toBe(true);
      }
    }

    for (const member of dataset.group_members) {
      expect(groupIds.has(member.group_id)).toBe(true);
      expect(userIds.has(member.user_id)).toBe(true);
      expect(["active", "invited", "left"]).toContain(member.status);
      expect(["seed", "created", "manual", "invite"]).toContain(member.join_source);
      if (member.invited_by_user_id) {
        expect(userIds.has(member.invited_by_user_id)).toBe(true);
      }
      if (member.invite_id) {
        expect(inviteIds.has(member.invite_id)).toBe(true);
      }
    }

    for (const invite of dataset.group_invites) {
      expect(groupIds.has(invite.group_id)).toBe(true);
      expect(userIds.has(invite.created_by_user_id)).toBe(true);
      expect(invite.status).toBe("active");
    }

    for (const expense of dataset.expenses) {
      expect(groupIds.has(expense.group_id)).toBe(true);
      expect(memberIds.has(expense.payer_member_id)).toBe(true);
      expect(memberIds.has(expense.paid_by_member_id)).toBe(true);
      expect(userIds.has(expense.created_by_user_id)).toBe(true);
      expect(Number.isInteger(expense.amount_cents)).toBe(true);
      expect(expense.currency).toBe("MXN");
    }

    for (const participant of dataset.expense_participants) {
      expect(expenseIds.has(participant.expense_id)).toBe(true);
      expect(memberIds.has(participant.member_id)).toBe(true);
      expect(["equal", "exact", "shares"]).toContain(participant.share_method);
      expect(Number.isInteger(participant.share_cents)).toBe(true);
      if (participant.share_units !== null) {
        expect(Number.isInteger(participant.share_units)).toBe(true);
      }
    }

    for (const settlement of dataset.settlements) {
      expect(groupIds.has(settlement.group_id)).toBe(true);
      expect(memberIds.has(settlement.from_member_id)).toBe(true);
      expect(memberIds.has(settlement.to_member_id)).toBe(true);
      expect(userIds.has(settlement.recorded_by_user_id)).toBe(true);
      expect(Number.isInteger(settlement.amount_cents)).toBe(true);
      expect(settlement.currency).toBe("MXN");
      expect(settlement.status).toBe("paid");
    }

    for (const event of dataset.activity_events) {
      expect(groupIds.has(event.group_id)).toBe(true);
      expect(userIds.has(event.actor_user_id)).toBe(true);
    }
  });

  it("creates deterministic insert statements with escaped literals", () => {
    const inserts = createSqlInserts(createSqlDataset(demoData));
    const secondRun = createSqlInserts(createSqlDataset(demoData));

    expect(inserts).toEqual(secondRun);
    expect(inserts[0]).toMatch(/^INSERT INTO app_metadata/);
    expect(inserts.some((statement) => statement.includes("INSERT INTO expense_participants"))).toBe(true);
    expect(inserts.some((statement) => statement.includes("INSERT INTO group_invites"))).toBe(true);
    expect(inserts.join("\n")).toContain("Sofía");
  });

  it("packages schema and seed SQL as a provider-neutral snapshot", () => {
    const snapshot = createSqlSnapshot(demoData);

    expect(snapshot.schemaVersion).toBe(SQL_SCHEMA_VERSION);
    expect(snapshot.tableNames).toContain("sync_outbox");
    expect(snapshot.schemaSql).toContain("CREATE TABLE IF NOT EXISTS activity_events");
    expect(snapshot.seedSql).toContain("INSERT INTO groups");
  });
});
