# Backend Release Readiness Audit

Generated for Play internal testing readiness work. This is not a production
deployment approval.

## Ready Locally

- SQL schema contract: `src/backend/sqlSchema.ts`,
  `docs/backend/schema-v1.sql`
- SQL demo seed: `src/backend/sqlDataset.ts`,
  `docs/backend/seed-demo-v1.sql`
- SQL artifact drift tests: `src/__tests__/sqlArtifacts.test.ts`
- Schema migration planner: `src/backend/sqlMigrations.ts`
- Data integrity audit/repair: `src/backend/dataIntegrity.ts`
- Backend mutation service: `src/backend/appMutations.ts`
- Sync outbox lifecycle: `src/backend/syncOutbox.ts`
- Provider-neutral sync engine: `src/backend/syncEngine.ts`
- Local export package: `src/backend/dataExport.ts`
- Repository contract: `src/backend/repository.ts`
- AsyncStorage repository adapter: `src/backend/asyncStorageRepository.ts`
- Backend release gate verifier: `src/backend/backendReleaseGate.ts`

## Tested Coverage

- Demo data referential integrity.
- Integer-cent money invariants.
- MXN-only MVP schema constraints.
- SQL schema/seed artifact drift.
- Mutation outputs for groups, members, expenses, settlements, activity events,
  and sync outbox rows.
- Corrupt local snapshot repair.
- Local data export checksum.
- Repository load/save/mutate/export/delete semantics.
- AsyncStorage load/save/mutate/export/delete behavior across app, account, and
  sync storage keys.
- Outbox processing order, limits, sent/failed states, retryable errors, and
  immutable repository snapshots.
- Machine-readable backend gate semantics:
  `src/__tests__/backendReleaseGate.test.ts`
- Current schema migration no-op and unsupported future-version handling.

## Local Release Gate

Run:

```bash
npm run release:backend:gate
```

The gate passes only when all provider-neutral backend capabilities are ready
and the only remaining blockers are the expected human/provider decisions:

- production auth/access provider
- production storage/backend provider
- remote deletion endpoint/process

`npm run release:android:check` also includes this backend gate.

## Remaining Human/External Blockers

- Production auth/access provider.
- Production storage/backend provider.
- Hosted remote deletion endpoint and public process.
- Legal/security approval for privacy, deletion, retention, and support
  promises.
- Play Console credentials and signed internal testing upload.

## Current Position

The backend is now close to provider-ready for internal testing. The app still
runs local-first with demo/mock adapters, but the data model, mutation behavior,
SQL handoff, integrity guard, export package, repository boundary, and sync
engine are in place for the access/storage discussion. The real local storage
keys now also have a tested repository adapter, so replacing local storage with
a selected production provider can happen behind the same contract.
