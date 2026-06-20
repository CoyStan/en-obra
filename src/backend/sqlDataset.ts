import { demoData } from "../data/demoData";
import { normalizeAppData } from "../domain/appDataNormalization";
import type { AppData } from "../domain/types";
import { SQL_SCHEMA_VERSION, SQL_TABLES, createSqlSchema } from "./sqlSchema";

type SqlValue = string | number | null;

export type SqlRow = Record<string, SqlValue>;
export type SqlDataset = Record<string, SqlRow[]> & {
  app_metadata: SqlRow[];
};

const TABLE_NAMES = SQL_TABLES.map((table) => table.name);

function maybe(value: string | undefined) {
  return value ?? null;
}

function tableColumns(tableName: string) {
  const table = SQL_TABLES.find((item) => item.name === tableName);
  if (!table) {
    throw new Error(`Unknown SQL table: ${tableName}`);
  }
  return table.columns.map((column) => column.name);
}

function assertIntegerCents(label: string, value: number) {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer cent value.`);
  }
}

function sqlLiteral(value: SqlValue) {
  if (value === null) {
    return "NULL";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("SQL numeric literal must be finite.");
    }
    return String(value);
  }
  return `'${value.replaceAll("'", "''")}'`;
}

function rowForColumns(row: SqlRow, columns: string[]) {
  return columns.map((column) => {
    if (!(column in row)) {
      throw new Error(`Missing SQL column ${column}.`);
    }
    return row[column];
  });
}

function sortById<T extends { id: string }>(items: T[]) {
  return [...items].sort((left, right) => left.id.localeCompare(right.id));
}

export function createSqlDataset(input: AppData = demoData): SqlDataset {
  const data = normalizeAppData(input);
  const generatedAt =
    data.groups.map((group) => group.updatedAt).sort().at(-1) ??
    data.users?.map((user) => user.updatedAt).sort().at(-1) ??
    new Date(0).toISOString();

  for (const expense of data.expenses) {
    assertIntegerCents(`expense ${expense.id} amount`, expense.amountCents);
  }
  for (const share of data.expenseParticipants ?? []) {
    assertIntegerCents(`expense participant ${share.id} share`, share.shareCents);
  }
  for (const settlement of data.settlements) {
    assertIntegerCents(`settlement ${settlement.id} amount`, settlement.amountCents);
  }

  return {
    app_metadata: [
      { key: "schema_version", value: String(SQL_SCHEMA_VERSION), updated_at: generatedAt },
      { key: "selected_group_id", value: data.selectedGroupId, updated_at: generatedAt },
      { key: "selected_user_id", value: data.selectedUserId ?? "", updated_at: generatedAt },
      { key: "sync_mode", value: "local-only", updated_at: generatedAt },
    ],
    users: sortById(data.users ?? []).map((user) => ({
      id: user.id,
      display_name: user.displayName,
      phone_or_email: maybe(user.phoneOrEmail),
      avatar_color: user.avatarColor,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      deleted_at: maybe(user.deletedAt),
    })),
    groups: sortById(data.groups).map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      currency_code: group.currencyCode ?? "MXN",
      created_by_user_id: maybe(group.createdByUserId),
      created_at: group.createdAt,
      updated_at: group.updatedAt,
      archived_at: maybe(group.archivedAt),
    })),
    group_members: sortById(data.groupMembers ?? []).map((member) => ({
      id: member.id,
      group_id: member.groupId,
      user_id: member.userId,
      display_name_snapshot: member.displayNameSnapshot,
      role: member.role,
      joined_at: member.joinedAt,
      left_at: maybe(member.leftAt),
    })),
    expenses: sortById(data.expenses).map((expense) => ({
      id: expense.id,
      group_id: expense.groupId,
      title: expense.title,
      amount_cents: expense.amountCents,
      currency: expense.currency,
      payer_member_id: expense.payerId,
      paid_by_member_id: expense.paidByMemberId ?? expense.payerId,
      created_by_user_id: maybe(expense.createdByUserId),
      category_id: maybe(expense.categoryId),
      note: maybe(expense.note),
      expense_date: expense.expenseDate ?? expense.createdAt.slice(0, 10),
      created_at: expense.createdAt,
      updated_at: expense.updatedAt ?? expense.createdAt,
      deleted_at: maybe(expense.deletedAt),
    })),
    expense_participants: sortById(data.expenseParticipants ?? []).map((participant) => ({
      id: participant.id,
      expense_id: participant.expenseId,
      member_id: participant.memberId,
      share_method: participant.shareMethod,
      share_cents: participant.shareCents,
      created_at: participant.createdAt,
    })),
    settlements: sortById(data.settlements).map((settlement) => ({
      id: settlement.id,
      group_id: settlement.groupId,
      from_member_id: settlement.fromMemberId,
      to_member_id: settlement.toMemberId,
      amount_cents: settlement.amountCents,
      currency: settlement.currency,
      status: settlement.status,
      recorded_by_user_id: maybe(settlement.recordedByUserId),
      recorded_at: settlement.recordedAt ?? settlement.createdAt,
      note: maybe(settlement.note),
      created_at: settlement.createdAt,
    })),
    activity_events: sortById(data.activityEvents ?? []).map((event) => ({
      id: event.id,
      group_id: event.groupId,
      actor_user_id: event.actorUserId,
      event_type: event.eventType,
      entity_type: event.entityType,
      entity_id: event.entityId,
      summary: event.summary,
      created_at: event.createdAt,
    })),
    sync_outbox: sortById(data.syncOutbox ?? []).map((item) => ({
      id: item.id,
      operation: item.operation,
      entity_type: item.entityType,
      entity_id: item.entityId,
      payload_json: item.payloadJson,
      status: item.status,
      attempt_count: item.attemptCount,
      created_at: item.createdAt,
      last_attempt_at: maybe(item.lastAttemptAt),
    })),
  };
}

export function createSqlInserts(dataset: SqlDataset = createSqlDataset()) {
  return TABLE_NAMES.flatMap((tableName) => {
    const rows = dataset[tableName] ?? [];
    const columns = tableColumns(tableName);
    if (rows.length === 0) {
      return [];
    }

    return rows.map((row) => {
      const values = rowForColumns(row, columns).map(sqlLiteral).join(", ");
      return `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values});`;
    });
  });
}

export function createSqlSnapshot(input: AppData = demoData) {
  const dataset = createSqlDataset(input);
  return {
    schemaVersion: SQL_SCHEMA_VERSION,
    tableNames: TABLE_NAMES,
    dataset,
    schemaSql: createSqlSchema(),
    seedSql: createSqlInserts(dataset).join("\n"),
  };
}
