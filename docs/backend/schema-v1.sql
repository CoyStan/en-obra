PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
  phone_or_email TEXT,
  avatar_color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 90),
  description TEXT NOT NULL DEFAULT '',
  currency_code TEXT NOT NULL DEFAULT 'MXN' CHECK (currency_code = 'MXN'),
  created_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  display_name_snapshot TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'left')),
  join_source TEXT NOT NULL DEFAULT 'seed' CHECK (join_source IN ('seed', 'created', 'manual', 'invite')),
  invited_by_user_id TEXT REFERENCES users(id),
  invite_id TEXT,
  joined_at TEXT NOT NULL,
  left_at TEXT,
  UNIQUE (group_id, user_id, joined_at)
);

CREATE TABLE IF NOT EXISTS group_invites (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired')),
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT,
  last_used_at TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'MXN' CHECK (currency = 'MXN'),
  payer_member_id TEXT NOT NULL REFERENCES group_members(id),
  paid_by_member_id TEXT NOT NULL REFERENCES group_members(id),
  created_by_user_id TEXT REFERENCES users(id),
  category_id TEXT,
  note TEXT,
  expense_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS expense_participants (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL REFERENCES expenses(id),
  member_id TEXT NOT NULL REFERENCES group_members(id),
  share_method TEXT NOT NULL CHECK (share_method = 'equal'),
  share_cents INTEGER NOT NULL CHECK (share_cents >= 0),
  created_at TEXT NOT NULL,
  UNIQUE (expense_id, member_id)
);

CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id),
  from_member_id TEXT NOT NULL REFERENCES group_members(id),
  to_member_id TEXT NOT NULL REFERENCES group_members(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'MXN' CHECK (currency = 'MXN'),
  status TEXT NOT NULL CHECK (status = 'paid'),
  recorded_by_user_id TEXT REFERENCES users(id),
  recorded_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  CHECK (from_member_id <> to_member_id)
);

CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id),
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('expense_created', 'settlement_recorded', 'member_added', 'member_joined', 'group_created', 'group_invite_created')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('expense', 'settlement', 'member', 'group', 'group_invite')),
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'snapshot')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'group', 'group_member', 'group_invite', 'expense', 'expense_participant', 'settlement', 'activity_event')),
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  created_at TEXT NOT NULL,
  last_attempt_at TEXT
);

CREATE INDEX idx_groups_created_by_user_id ON groups(created_by_user_id);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);

CREATE INDEX idx_group_members_user_id ON group_members(user_id);

CREATE INDEX idx_group_invites_group_id ON group_invites(group_id);

CREATE INDEX idx_group_invites_status ON group_invites(status);

CREATE INDEX idx_expenses_group_id_created_at ON expenses(group_id, created_at DESC);

CREATE INDEX idx_expenses_paid_by_member_id ON expenses(paid_by_member_id);

CREATE INDEX idx_expense_participants_expense_id ON expense_participants(expense_id);

CREATE INDEX idx_expense_participants_member_id ON expense_participants(member_id);

CREATE INDEX idx_settlements_group_id_recorded_at ON settlements(group_id, recorded_at DESC);

CREATE INDEX idx_settlements_from_to ON settlements(from_member_id, to_member_id);

CREATE INDEX idx_activity_events_group_id_created_at ON activity_events(group_id, created_at DESC);

CREATE INDEX idx_sync_outbox_status_created_at ON sync_outbox(status, created_at ASC);
