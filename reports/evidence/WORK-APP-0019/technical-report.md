# WORK-APP-0019 Technical Report

## Summary

Added backend-grade integrity audit and repair for persisted local app data. This
protects release-candidate flows from stale legacy snapshots, dangling
references, missing participant shares, invalid settlement members, and broken
outbox rows.

## Changes

- Added `src/backend/dataIntegrity.ts`.
  - `auditAppDataIntegrity(data)` returns structured integrity issues.
  - `auditAndRepairAppData(data)` normalizes then repairs safe issues.
- Wired persisted data loading through `auditAndRepairAppData` in
  `src/state/storage.ts`.
- Added `src/__tests__/dataIntegrity.test.ts`.
  - Verifies shipped demo data is clean.
  - Verifies stale selected group repair.
  - Verifies missing participant shares are rebuilt.
  - Verifies dangling participants are removed.
  - Verifies invalid settlements are dropped.
  - Verifies invalid sync outbox rows are dropped.
- Updated `docs/backend/sql-readiness.md` with the integrity guard model.

## Verification

- `npm run typecheck` passed.
- `npm test` passed:
  - 10 test files passed.
  - 36 tests passed.

## Play Store Readiness Impact

- The app can now tolerate older or partially corrupt local snapshots more
  safely during internal testing.
- Money remains integer cents.
- The local SQL-ready model keeps referential integrity before future backend
  sync/storage is chosen.

## Limitations

- No production backend is deployed.
- No native database package was added.
- Repairs are intentionally conservative; records with unsafe missing roots
  such as missing group or invalid payer are dropped rather than guessed.
