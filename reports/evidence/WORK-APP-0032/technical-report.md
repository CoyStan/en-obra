# WORK-APP-0032 Technical Report

## Summary

Added a deterministic backend release manifest for Play internal testing
readiness. The manifest summarizes schema/seed checksums, backend gate status,
required capabilities, known blockers, and verification commands.

## Changes

- Exported `deterministicChecksum` from `src/backend/dataExport.ts`.
- Added `src/backend/backendReleaseManifest.ts`.
- Added `src/__tests__/backendReleaseManifest.test.ts`.
- Added manifest capability to backend readiness and release gate.
- Updated backend documentation.

## Manifest Coverage

- app and release target
- local-first provider-neutral backend mode
- real payments disabled
- SQL schema version and table names
- checksums for schema SQL, seed SQL, gate report, and manifest body
- required and ready backend capabilities
- known and unexpected blockers
- release verification commands

## Verification

- `npm run release:android:check` passed.
  - `npm run typecheck` passed.
  - `npm test` passed: 22 files, 89 tests.
  - `npm run release:backend:gate` passed.
  - `npx expo config --type public` passed.
- `./bin/company-os validate` passed.
- `./bin/company-os scope WORK-APP-0032` passed.

## Out Of Scope

- No production backend provider.
- No auth/storage decision.
- No remote endpoint.
- No secrets, paid services, deployment, or real payments.
