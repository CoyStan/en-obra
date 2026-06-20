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
- Local export package: `src/backend/dataExport.ts`
- Repository contract: `src/backend/repository.ts`

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
- Current schema migration no-op and unsupported future-version handling.

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
SQL handoff, integrity guard, export package, and repository boundary are in
place for the access/storage discussion.
