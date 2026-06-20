# WORK-APP-0034 Technical Report

## Summary

Added a local export import/restore validator for backend release readiness. The
validator turns a verified local export package into a sanitized backend
snapshot without choosing production storage or cloud restore.

## Changes

- Added `src/backend/dataImport.ts`.
- Added `src/__tests__/dataImport.test.ts`.
- Added `import-restore` to backend readiness and release gate required
  capabilities.
- Updated `docs/backend/release-manifest-v1.json` checksums and capabilities.
- Updated backend readiness documentation.

## Import Boundaries

- Verifies export package checksums.
- Rejects wrong app/default currency packages.
- Rejects packages claiming real payment support.
- Rejects unsupported SQL schema versions.
- Accepts only `local-only` packages.
- Repairs app data through the integrity guard before returning a
  `BackendSnapshot`.

## Verification

- `npm run release:android:check` passed.
  - `npm run typecheck` passed.
  - `npm test` passed: 23 files, 96 tests.
  - `npm run release:backend:gate` passed.
  - `npx expo config --type public` passed.
- `./bin/company-os validate` passed.
- `./bin/company-os scope WORK-APP-0034` passed.

## Out Of Scope

- No cloud restore.
- No production auth/storage decision.
- No production backend.
- No remote endpoint.
- No secrets, paid services, deployment, or real payments.
