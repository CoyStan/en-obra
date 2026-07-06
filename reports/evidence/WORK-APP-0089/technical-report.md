# WORK-APP-0089 Technical Report

## Summary

Extended the local SQL-ready model so Cuentas Claras has a concrete pre-production collaboration contract before building create/join flows.

The app still has no production backend, auth provider, real payments, secrets, paid services, or Play submission behavior.

## What Changed

- Added local invite metadata through `GroupInvite`.
- Added group member `status`, `joinSource`, `invitedByUserId`, and `inviteId`.
- Added join-related activity events:
  - `member_joined`
  - `group_invite_created`
- Added `group_invites` to the SQL schema and deterministic SQL dataset.
- Updated demo data with local invite codes for Oaxaca, Roma Norte, and Monterrey groups.
- Updated mutation defaults so newly created groups and manually added members have explicit join state.
- Regenerated SQL/backend release artifacts that checksum schema and seed output.
- Updated tests for the new model invariants.

## Files Changed

- `src/domain/types.ts`
- `src/domain/appDataNormalization.ts`
- `src/data/demoData.ts`
- `src/backend/appMutations.ts`
- `src/backend/sqlSchema.ts`
- `src/backend/sqlDataset.ts`
- `src/__tests__/sqlReadyModel.test.ts`
- `src/__tests__/sqlDataset.test.ts`
- `docs/backend/schema-v1.sql`
- `docs/backend/seed-demo-v1.sql`
- `docs/backend/release-manifest-v1.json`
- `docs/backend/play-preflight-v1.json`
- `docs/backend/release-handoff-v1.json`
- `docs/backend/sql-readiness.md`
- `docs/product/decisions.md`
- `reports/evidence/WORK-APP-0089/technical-report.md`

## Verification

Passed:

- `npm run typecheck`
- `npm test`
- `npx expo config --type public`
- `npm run export:web`
- `./bin/company-os scope WORK-APP-0089`
- `./bin/company-os validate`

## Acceptance Coverage

- Users remain first-class local entities.
- Groups remain MXN-scoped and created by users.
- Membership now includes active/left/invited-ready state and join source.
- Local invite metadata exists without production invite links or backend sync.
- Active identity remains represented by selected user plus profile-to-group member mapping.
- Provider-neutral SQL artifacts include the new invite contract.

## Remaining Work

`WORK-APP-0090` should build the create/join group UI on top of this local contract.
