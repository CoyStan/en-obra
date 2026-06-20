# WORK-APP-0023 Technical Report

## Summary

Added committed SQL schema and demo seed artifacts for backend handoff, plus
drift tests that compare the files against the TypeScript SQL generator.

## Changes

- Added `docs/backend/schema-v1.sql`.
  - 9-table provider-neutral SQL schema.
  - Foreign keys, indexes, MXN constraints, integer-cent checks.
- Added `docs/backend/seed-demo-v1.sql`.
  - Deterministic demo dataset for users, groups, group members, expenses,
    expense participants, settlements, and activity events.
  - Empty `sync_outbox` by design, ready for future queued operations.
- Added `src/__tests__/sqlArtifacts.test.ts`.
  - Verifies `schema-v1.sql` matches `createSqlSnapshot(demoData).schemaSql`.
  - Verifies `seed-demo-v1.sql` matches `createSqlSnapshot(demoData).seedSql`.
- Updated `docs/backend/sql-readiness.md` with artifact paths.

## Verification

- `npm run typecheck` passed.
- `npm test` passed:
  - 14 test files passed.
  - 50 tests passed.
- Artifact size check:
  - `docs/backend/schema-v1.sql`: 126 lines.
  - `docs/backend/seed-demo-v1.sql`: 61 lines.

## Play Store Readiness Impact

- Backend handoff no longer depends only on TypeScript code.
- The repo has concrete SQL files that can be inspected, imported, or reviewed
  when access/storage is selected.
- Drift tests prevent docs/backend SQL artifacts from becoming stale.

## Limitations

- No production database was provisioned.
- No migrations runner was added.
- No secrets, paid services, or deployment were used.
