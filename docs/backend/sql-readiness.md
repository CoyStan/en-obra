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

Committed backend handoff artifacts:

- `docs/backend/schema-v1.sql`
- `docs/backend/seed-demo-v1.sql`

`src/__tests__/sqlArtifacts.test.ts` verifies both files match the TypeScript
schema/seed generator exactly.

## Schema Versioning

`src/backend/sqlMigrations.ts` defines the migration planner for SQL schema
versions.

Current state:

- current schema version: `1`
- migration list: empty, because v1 is the first release-candidate schema
- app metadata stores `schema_version`

Future schema changes must add:

1. a new `SQL_SCHEMA_VERSION`
2. a migration entry from the previous version
3. updated committed SQL artifacts
4. tests for old-version planning and current-version no-op behavior

If the app sees missing/invalid schema metadata or a local schema newer than the
current build, it must refuse to guess and surface a controlled recovery path.

## Replacement Path

When access/storage is selected, implement a concrete repository/adapter that:

1. Creates the schema from `createSqlSchema()`.
2. Seeds or migrates local data using `createSqlDataset()`.
3. Persists app actions into the same tables.
4. Writes pending remote operations to `sync_outbox`.
5. Replays/sends outbox operations through the chosen backend.
6. Keeps local-first behavior when offline.

## Sync Outbox Lifecycle

`src/backend/syncOutbox.ts` owns local mutation queue helpers for future backend
adapters:

- deterministic payload JSON via sorted keys
- `pending` outbox record creation
- oldest-first pending reads
- attempt timestamp/count updates
- sent and failed status transitions
- typed payload parsing

`useAppData` creates mutation outbox rows through this shared module. A future
backend adapter can process the same rows without changing group, member,
expense, settlement, or activity mutations.

## Mutation Service

`src/backend/appMutations.ts` owns pure write operations for:

- creating groups
- adding members
- adding expenses with equal participant shares
- recording local paid settlements

The React hook remains responsible for loading, setting state, and persisting
the returned data. The mutation service owns validation, created records,
activity events, and sync outbox rows. Tests inject deterministic clocks and ids
so future SQLite or hosted backend adapters can reuse the same behavior without
depending on React.

## Repository Boundary

`src/backend/repository.ts` defines a provider-neutral `BackendRepository`
contract:

- `load`
- `save`
- `mutate`
- `exportData`
- `deleteLocalData`

The included `InMemoryBackendRepository` is for tests and adapter development.
It proves the shape needed by future storage providers without selecting one.
Concrete adapters can be added later for AsyncStorage, SQLite, or a hosted API
while preserving the same mutation/export/delete semantics.

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

## Local Data Export Package

`src/backend/dataExport.ts` builds a deterministic local-only export package for
support, migration, and deletion-readiness workflows.

The package includes:

- app identity and `realPaymentsEnabled: false`
- local storage inventory
- remote deletion status
- local account state
- sync state
- normalized app data
- SQL schema/seed snapshot
- deterministic checksum

This is not a cloud backup and does not upload data. A future access/storage
decision can reuse the same package for explicit user export, support bundles,
or migration into a hosted backend.

## Verification

`src/__tests__/sqlDataset.test.ts` verifies:

- required table coverage
- schema constraints for MXN and integer cents
- referential integrity of the demo seed rows
- deterministic SQL insert generation
- provider-neutral snapshot packaging
- local snapshot integrity audit and repair
