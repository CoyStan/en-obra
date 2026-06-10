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

MVP production policy should be:

- Append-only expenses and settlements are safest.
- Edits and deletes require explicit revision checks.
- If a conflict occurs, keep the local copy, show a recoverable error, and let
  the user retry after refresh.
- Never silently duplicate settlements.

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
