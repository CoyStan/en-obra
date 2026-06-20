# Backend Release Readiness Audit

Generated for Play internal testing readiness work. This is not a production
deployment approval.

## Ready Locally

- SQL schema contract: `src/backend/sqlSchema.ts`,
  `docs/backend/schema-v1.sql`
- SQL demo seed: `src/backend/sqlDataset.ts`,
  `docs/backend/seed-demo-v1.sql`
- Backend release manifest artifact: `docs/backend/release-manifest-v1.json`
- Backend Play preflight artifact: `docs/backend/play-preflight-v1.json`
- SQL artifact drift tests: `src/__tests__/sqlArtifacts.test.ts`
- Schema migration planner: `src/backend/sqlMigrations.ts`
- Data integrity audit/repair: `src/backend/dataIntegrity.ts`
- Backend mutation service: `src/backend/appMutations.ts`
- Sync outbox lifecycle: `src/backend/syncOutbox.ts`
- Provider-neutral sync engine: `src/backend/syncEngine.ts`
- Provider-neutral conflict policy: `src/backend/syncConflictPolicy.ts`
- Backend release manifest: `src/backend/backendReleaseManifest.ts`
- Local import/restore validator: `src/backend/dataImport.ts`
- Backend health diagnostics: `src/backend/backendDiagnostics.ts`
- Provider-neutral deletion workflow: `src/backend/deletionWorkflow.ts`
- Provider-neutral retention and backup readiness contract:
  `src/backend/retentionReadiness.ts`
- Provider-neutral account access readiness contract:
  `src/backend/accessReadiness.ts`
- Technical Data Safety inventory: `src/backend/dataSafetyInventory.ts`
- Release privacy/dependency scan: `src/backend/releasePrivacyScan.ts`
- Release secret/config safety scan: `src/backend/secretSafetyScan.ts`
- Redacted backend support bundle: `src/backend/supportBundle.ts`
- Backend Play preflight report: `src/backend/playPreflight.ts`
- Local export package: `src/backend/dataExport.ts`
- Repository contract: `src/backend/repository.ts`
- AsyncStorage repository adapter: `src/backend/asyncStorageRepository.ts`
- Provider-neutral storage readiness contract:
  `src/backend/storageReadiness.ts`
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
- Storage readiness model that marks local AsyncStorage safe for internal
  testing while keeping production storage blocked until provider, region,
  endpoint, remote deletion fulfillment, and security review decisions exist.
- Outbox processing order, limits, sent/failed states, retryable errors, and
  immutable repository snapshots.
- Sync conflict policy for append-only rows, duplicate settlement protection,
  stale revisions, deletes, and remote deletion handling.
- Deterministic release manifest checksums for schema SQL, seed SQL, backend
  gate status, required capabilities, known blockers, and evidence commands.
- Committed release manifest drift against generator:
  `docs/backend/release-manifest-v1.json`
- Local export import validation for checksum, app boundary, real-payment
  boundary, schema compatibility, and repaired backend snapshots.
- Support-safe backend diagnostics for integrity state, sync queue counts,
  account/sync modes, release gate status, and known blockers without raw
  expense titles, notes, payload JSON, or contact fields.
- Provider-neutral deletion request lifecycle for requested, verified, queued,
  completed, failed, and cancelled states without configuring a remote endpoint.
- Retention and backup readiness model that marks local clear-data, uninstall,
  export/import validation, and support redaction ready for internal testing
  while keeping production retention policy, server backups, restore drills,
  remote deletion fulfillment, public deletion URL, and legal approval blocked.
- Account/access readiness model that marks local mock access ready for internal
  testing while keeping production auth blocked until provider, secrets,
  deletion endpoint, and privacy URL decisions exist.
- Technical Data Safety inventory showing the current build is local-first,
  has no real payments, no ads/analytics SDK, no backend sharing, and still
  requires human legal/Play Console submission.
- Release privacy/dependency scan covering `package.json` and `app.json` for
  ads, analytics, payment, location/contact SDK signals, and Android
  permissions.
- Secret/config safety scan covering release-facing config files for API keys,
  payment keys, Play service-account credentials, private keys, and premature
  production backend endpoint literals.
- Redacted backend support bundle that aggregates diagnostics, preflight,
  release manifest summary, privacy scan, and Data Safety posture without raw
  account contacts, user rows, expense rows, notes, or outbox payload JSON.
- Backend Play preflight report that summarizes release gate state, local
  backend readiness, no-real-payment posture, and remaining human/provider
  blockers for internal testing handoff.
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

`src/backend/playPreflight.ts` is intentionally downstream from the release
gate. It aggregates the gate plus access, storage, retention, deletion, and
Data Safety readiness into one handoff report without becoming part of the gate
itself.
The committed artifact is `docs/backend/play-preflight-v1.json`, and
`src/__tests__/playPreflight.test.ts` keeps it synchronized with the generator.

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
engine/conflict policy are in place for the access/storage discussion. The real local storage
keys now also have a tested repository adapter, so replacing local storage with
a selected production provider can happen behind the same contract.
