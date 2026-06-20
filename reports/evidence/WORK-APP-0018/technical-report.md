# WORK-APP-0018 Technical Report

## Summary

Added a provider-neutral SQL backend dataset foundation for Cuentas Claras so
the app has a concrete backend contract before production access/storage
decisions are made.

## Changes

- Added `src/backend/sqlSchema.ts`.
  - Defines `SQL_SCHEMA_VERSION`.
  - Defines SQL table contracts for `app_metadata`, `users`, `groups`,
    `group_members`, `expenses`, `expense_participants`, `settlements`,
    `activity_events`, and `sync_outbox`.
  - Includes integer-cent money constraints and MXN-only MVP constraints.
  - Includes foreign-key references and indexes for group/activity/outbox
    access paths.
- Added `src/backend/sqlDataset.ts`.
  - Converts normalized app data into ordered SQL rows.
  - Generates deterministic SQL insert statements.
  - Packages schema SQL and seed SQL as a provider-neutral snapshot.
- Added `src/__tests__/sqlDataset.test.ts`.
  - Verifies required table coverage.
  - Verifies schema constraints for integer cents and MXN.
  - Verifies seed referential integrity across users, groups, members,
    expenses, participants, settlements, and activity events.
  - Verifies deterministic insert generation.
- Added `docs/backend/sql-readiness.md`.
  - Documents the backend boundary, table contract, seed/export path, and
    future replacement path.
- Recorded the provider-neutral backend decision in
  `docs/product/decisions.md`.

## Verification

- `npm run typecheck` passed.
- `npm test` passed:
  - 9 test files passed.
  - 30 tests passed.

## Play Store Readiness Impact

- Moves the app closer to release readiness by making the local data model
  concrete enough for a future SQLite or hosted SQL backend.
- Keeps the app local-first and offline-capable.
- Avoids secrets, paid services, production deployment, and real payments.
- Leaves access/storage/provider choice for the founder discussion.

## Limitations

- No production backend is deployed.
- No real account provider is selected.
- No native Android database package was added.
- No remote sync service is configured.
- The schema is a contract and seed/export foundation, not yet a live database
  adapter.
