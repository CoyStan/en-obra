export type SqlColumn = {
  name: string;
  definition: string;
  references?: string;
};

export type SqlTable = {
  name: string;
  columns: SqlColumn[];
  constraints?: string[];
  indexes?: string[];
};

export const SQL_SCHEMA_VERSION = 1;

export const SQL_TABLES: SqlTable[] = [
  {
    name: "app_metadata",
    columns: [
      { name: "key", definition: "TEXT PRIMARY KEY" },
      { name: "value", definition: "TEXT NOT NULL" },
      { name: "updated_at", definition: "TEXT NOT NULL" },
    ],
  },
  {
    name: "users",
    columns: [
      { name: "id", definition: "TEXT PRIMARY KEY" },
      { name: "display_name", definition: "TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80)" },
      { name: "phone_or_email", definition: "TEXT" },
      { name: "avatar_color", definition: "TEXT NOT NULL" },
      { name: "created_at", definition: "TEXT NOT NULL" },
      { name: "updated_at", definition: "TEXT NOT NULL" },
      { name: "deleted_at", definition: "TEXT" },
    ],
  },
  {
    name: "groups",
    columns: [
      { name: "id", definition: "TEXT PRIMARY KEY" },
      { name: "name", definition: "TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 90)" },
      { name: "description", definition: "TEXT NOT NULL DEFAULT ''" },
      { name: "currency_code", definition: "TEXT NOT NULL DEFAULT 'MXN' CHECK (currency_code = 'MXN')" },
      { name: "created_by_user_id", definition: "TEXT", references: "users(id)" },
      { name: "created_at", definition: "TEXT NOT NULL" },
      { name: "updated_at", definition: "TEXT NOT NULL" },
      { name: "archived_at", definition: "TEXT" },
    ],
    indexes: ["CREATE INDEX idx_groups_created_by_user_id ON groups(created_by_user_id);"],
  },
  {
    name: "group_members",
    columns: [
      { name: "id", definition: "TEXT PRIMARY KEY" },
      { name: "group_id", definition: "TEXT NOT NULL", references: "groups(id)" },
      { name: "user_id", definition: "TEXT NOT NULL", references: "users(id)" },
      { name: "display_name_snapshot", definition: "TEXT NOT NULL" },
      { name: "role", definition: "TEXT NOT NULL CHECK (role IN ('owner', 'member'))" },
      { name: "status", definition: "TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'left'))" },
      { name: "join_source", definition: "TEXT NOT NULL DEFAULT 'seed' CHECK (join_source IN ('seed', 'created', 'manual', 'invite'))" },
      { name: "invited_by_user_id", definition: "TEXT", references: "users(id)" },
      { name: "invite_id", definition: "TEXT" },
      { name: "joined_at", definition: "TEXT NOT NULL" },
      { name: "left_at", definition: "TEXT" },
    ],
    constraints: ["UNIQUE (group_id, user_id, joined_at)"],
    indexes: [
      "CREATE INDEX idx_group_members_group_id ON group_members(group_id);",
      "CREATE INDEX idx_group_members_user_id ON group_members(user_id);",
    ],
  },
  {
    name: "group_invites",
    columns: [
      { name: "id", definition: "TEXT PRIMARY KEY" },
      { name: "group_id", definition: "TEXT NOT NULL", references: "groups(id)" },
      { name: "code", definition: "TEXT NOT NULL UNIQUE" },
      { name: "label", definition: "TEXT NOT NULL" },
      { name: "status", definition: "TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired'))" },
      { name: "created_by_user_id", definition: "TEXT NOT NULL", references: "users(id)" },
      { name: "created_at", definition: "TEXT NOT NULL" },
      { name: "expires_at", definition: "TEXT" },
      { name: "last_used_at", definition: "TEXT" },
    ],
    indexes: [
      "CREATE INDEX idx_group_invites_group_id ON group_invites(group_id);",
      "CREATE INDEX idx_group_invites_status ON group_invites(status);",
    ],
  },
  {
    name: "expenses",
    columns: [
      { name: "id", definition: "TEXT PRIMARY KEY" },
      { name: "group_id", definition: "TEXT NOT NULL", references: "groups(id)" },
      { name: "title", definition: "TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100)" },
      { name: "amount_cents", definition: "INTEGER NOT NULL CHECK (amount_cents > 0)" },
      { name: "currency", definition: "TEXT NOT NULL DEFAULT 'MXN' CHECK (currency = 'MXN')" },
      { name: "payer_member_id", definition: "TEXT NOT NULL", references: "group_members(id)" },
      { name: "paid_by_member_id", definition: "TEXT NOT NULL", references: "group_members(id)" },
      { name: "created_by_user_id", definition: "TEXT", references: "users(id)" },
      { name: "category_id", definition: "TEXT" },
      { name: "note", definition: "TEXT" },
      { name: "expense_date", definition: "TEXT NOT NULL" },
      { name: "created_at", definition: "TEXT NOT NULL" },
      { name: "updated_at", definition: "TEXT NOT NULL" },
      { name: "deleted_at", definition: "TEXT" },
    ],
    indexes: [
      "CREATE INDEX idx_expenses_group_id_created_at ON expenses(group_id, created_at DESC);",
      "CREATE INDEX idx_expenses_paid_by_member_id ON expenses(paid_by_member_id);",
    ],
  },
  {
    name: "expense_participants",
    columns: [
      { name: "id", definition: "TEXT PRIMARY KEY" },
      { name: "expense_id", definition: "TEXT NOT NULL", references: "expenses(id)" },
      { name: "member_id", definition: "TEXT NOT NULL", references: "group_members(id)" },
      { name: "share_method", definition: "TEXT NOT NULL CHECK (share_method = 'equal')" },
      { name: "share_cents", definition: "INTEGER NOT NULL CHECK (share_cents >= 0)" },
      { name: "created_at", definition: "TEXT NOT NULL" },
    ],
    constraints: ["UNIQUE (expense_id, member_id)"],
    indexes: [
      "CREATE INDEX idx_expense_participants_expense_id ON expense_participants(expense_id);",
      "CREATE INDEX idx_expense_participants_member_id ON expense_participants(member_id);",
    ],
  },
  {
    name: "settlements",
    columns: [
      { name: "id", definition: "TEXT PRIMARY KEY" },
      { name: "group_id", definition: "TEXT NOT NULL", references: "groups(id)" },
      { name: "from_member_id", definition: "TEXT NOT NULL", references: "group_members(id)" },
      { name: "to_member_id", definition: "TEXT NOT NULL", references: "group_members(id)" },
      { name: "amount_cents", definition: "INTEGER NOT NULL CHECK (amount_cents > 0)" },
      { name: "currency", definition: "TEXT NOT NULL DEFAULT 'MXN' CHECK (currency = 'MXN')" },
      { name: "status", definition: "TEXT NOT NULL CHECK (status = 'paid')" },
      { name: "recorded_by_user_id", definition: "TEXT", references: "users(id)" },
      { name: "recorded_at", definition: "TEXT NOT NULL" },
      { name: "note", definition: "TEXT" },
      { name: "created_at", definition: "TEXT NOT NULL" },
    ],
    constraints: ["CHECK (from_member_id <> to_member_id)"],
    indexes: [
      "CREATE INDEX idx_settlements_group_id_recorded_at ON settlements(group_id, recorded_at DESC);",
      "CREATE INDEX idx_settlements_from_to ON settlements(from_member_id, to_member_id);",
    ],
  },
  {
    name: "activity_events",
    columns: [
      { name: "id", definition: "TEXT PRIMARY KEY" },
      { name: "group_id", definition: "TEXT NOT NULL", references: "groups(id)" },
      { name: "actor_user_id", definition: "TEXT NOT NULL", references: "users(id)" },
      {
        name: "event_type",
        definition:
          "TEXT NOT NULL CHECK (event_type IN ('expense_created', 'settlement_recorded', 'member_added', 'member_joined', 'group_created', 'group_invite_created'))",
      },
      { name: "entity_type", definition: "TEXT NOT NULL CHECK (entity_type IN ('expense', 'settlement', 'member', 'group', 'group_invite'))" },
      { name: "entity_id", definition: "TEXT NOT NULL" },
      { name: "summary", definition: "TEXT NOT NULL" },
      { name: "created_at", definition: "TEXT NOT NULL" },
    ],
    indexes: ["CREATE INDEX idx_activity_events_group_id_created_at ON activity_events(group_id, created_at DESC);"],
  },
  {
    name: "sync_outbox",
    columns: [
      { name: "id", definition: "TEXT PRIMARY KEY" },
      { name: "operation", definition: "TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'snapshot'))" },
      {
        name: "entity_type",
        definition:
          "TEXT NOT NULL CHECK (entity_type IN ('user', 'group', 'group_member', 'group_invite', 'expense', 'expense_participant', 'settlement', 'activity_event'))",
      },
      { name: "entity_id", definition: "TEXT NOT NULL" },
      { name: "payload_json", definition: "TEXT NOT NULL" },
      { name: "status", definition: "TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed'))" },
      { name: "attempt_count", definition: "INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0)" },
      { name: "created_at", definition: "TEXT NOT NULL" },
      { name: "last_attempt_at", definition: "TEXT" },
    ],
    indexes: ["CREATE INDEX idx_sync_outbox_status_created_at ON sync_outbox(status, created_at ASC);"],
  },
];

function columnSql(column: SqlColumn) {
  return `${column.name} ${column.definition}${column.references ? ` REFERENCES ${column.references}` : ""}`;
}

export function createTableSql(table: SqlTable) {
  const definitions = [
    ...table.columns.map(columnSql),
    ...(table.constraints ?? []),
  ];

  return `CREATE TABLE IF NOT EXISTS ${table.name} (\n  ${definitions.join(",\n  ")}\n);`;
}

export function createSqlSchema() {
  return [
    "PRAGMA foreign_keys = ON;",
    ...SQL_TABLES.map(createTableSql),
    ...SQL_TABLES.flatMap((table) => table.indexes ?? []),
  ].join("\n\n");
}
