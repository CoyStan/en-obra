# Backend And Sync Architecture

## Current Decision

Use a local mock sync adapter before choosing or provisioning any backend. The
app now has a `SyncAdapter` contract that can later be implemented by a real API
client without changing the domain data model.

## Adapter Contract

- `enqueue(state, item)`: record local changes that would need backend sync.
- `pushSnapshot(data, state)`: send or simulate a full app-data snapshot.
- `clearRemoteData(accountId)`: delete backend-held account data when a real
  backend exists.

Current implementation: `local-mock-sync`.

## Planned Backend Model

Replaceable production shape:

- Auth service creates an account identity.
- API service owns groups, members, expenses, settlements, and deletion jobs.
- Client keeps local AsyncStorage cache for offline-first behavior.
- Client queues writes and syncs when signed in and online.
- Server should use optimistic concurrency with `updatedAt` and server revision
  values.

## Sync Conflict Policy

The provider-neutral policy lives in `src/backend/syncConflictPolicy.ts`.
Current tested behavior:

- append-only support rows can be sent safely,
- duplicate non-settlement creates can be skipped,
- duplicate settlements require refresh before retry,
- stale local revisions require refresh,
- newer local revisions can be sent,
- remote deletions win until restore semantics are designed,
- deletes without revision context require explicit refresh.

Future production adapters should call this policy before applying local or
remote changes. They should preserve the user-facing rule: keep the local app
recoverable, never silently duplicate settlements, and surface retry-after-
refresh conflicts as controlled errors.

## Data Safety Implications

Until a real backend is connected, no app data leaves the device. Once backend
sync is implemented, Data Safety likely includes:

- account identifiers,
- app activity,
- financial information entered by the user,
- diagnostics if crash/analytics SDKs are added.

## Hard Blockers Before Real Backend

- provider and region decision,
- privacy/legal review,
- data deletion URL and fulfillment process,
- secrets/API keys,
- production deployment,
- security review.
