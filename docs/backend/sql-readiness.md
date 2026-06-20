# SQL Backend Readiness

`Cuentas Claras` remains local-first for the current release candidate. This
document defines the provider-neutral SQL contract we can reuse when the access
and storage decisions are made.

## Current Boundary

- No production backend is deployed.
- No secrets, API keys, paid services, or real payment rails are required.
- The app stores demo/user-entered data locally today.
- The schema and seed export are deterministic so a future SQLite, Supabase,
  Postgres, Turso, or custom API adapter can use the same entities.

## Tables

The SQL contract lives in `src/backend/sqlSchema.ts` and covers:

- `app_metadata`
- `users`
- `groups`
- `group_members`
- `expenses`
- `expense_participants`
- `settlements`
- `activity_events`
- `sync_outbox`

Money is stored only as integer cents. Currency is constrained to `MXN` for the
MVP. Settlements are local records of external payments and do not move money.

## Seed/Export

`src/backend/sqlDataset.ts` converts the current normalized app data into:

- ordered SQL rows
- deterministic `INSERT` statements
- a snapshot containing schema SQL plus seed SQL

The seed uses the realistic Mexico/LATAM demo groups already present in the
app. It includes users, group memberships, expense participants, activity
events, and an empty `sync_outbox` ready for future backend operations.

## Replacement Path

When access/storage is selected, implement a concrete repository/adapter that:

1. Creates the schema from `createSqlSchema()`.
2. Seeds or migrates local data using `createSqlDataset()`.
3. Persists app actions into the same tables.
4. Writes pending remote operations to `sync_outbox`.
5. Replays/sends outbox operations through the chosen backend.
6. Keeps local-first behavior when offline.

## Integrity Guard

`src/backend/dataIntegrity.ts` audits and safely repairs persisted local
snapshots before the app loads them into state.

It checks:

- selected group existence
- user/group/member references
- expense payer and participant membership
- integer-cent amounts
- participant share totals
- settlement participants
- activity event actors/groups
- parseable sync outbox payloads

Safe repairs include:

- choosing a valid selected group when the stored selection is stale
- rebuilding equal participant share rows
- removing dangling participants, settlements, activity events, and outbox rows
- forcing MVP currency fields back to `MXN`

Unsafe records such as expenses with missing groups, invalid payers, or invalid
money amounts are dropped instead of being rendered.

## Verification

`src/__tests__/sqlDataset.test.ts` verifies:

- required table coverage
- schema constraints for MXN and integer cents
- referential integrity of the demo seed rows
- deterministic SQL insert generation
- provider-neutral snapshot packaging
- local snapshot integrity audit and repair
