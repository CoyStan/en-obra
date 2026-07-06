# WORK-APP-0090 Technical Report

## Summary

Added local create/join group flow support on top of the `WORK-APP-0089` invite and membership model.

The flow remains local/mock only. It does not create production invite links, backend sync, real accounts, secrets, or payment behavior.

## What Changed

- `createGroupMutation` now creates a local active `GroupInvite` for newly created groups.
- Added `joinGroupByInviteMutation` for mock local invite codes.
- Joining an invite:
  - selects the invited group if the active user is already a member;
  - otherwise creates an active group membership for the selected local user;
  - updates invite `lastUsedAt`;
  - records a `member_joined` activity event;
  - writes provider-neutral sync outbox entries.
- `useAppData` exposes `joinGroupByInvite`.
- Groups screen now has a compact `Crear` / `Unirme` segmented flow.
- Join copy explicitly says the code is local demo behavior and not a real synced backend link.
- Data integrity repair now preserves valid group invite metadata and invite activity events.

## Files Changed

- `src/backend/appMutations.ts`
- `src/backend/dataIntegrity.ts`
- `src/state/useAppData.ts`
- `src/screens/MainScreen.tsx`
- `src/__tests__/appMutations.test.ts`
- `reports/evidence/WORK-APP-0090/*`

## Visual Evidence

Screenshots captured at:

- `360x740`
- `390x844`
- `412x915`

Artifacts:

- `create-group-*.png`
- `join-group-*.png`
- `joined-group-*.png`
- `runtime-proof.json`

Runtime proof confirms the create panel, join panel, local-only cue, and successful mock join to `Asada Monterrey` at all three widths.

## Verification

Passed:

- `npm run typecheck`
- `npm test`
- `npx expo config --type public`
- `npm run export:web`
- `./bin/company-os scope WORK-APP-0090`
- `./bin/company-os validate`

## Remaining Work

`WORK-APP-0091` should add richer member management: edit/remove local members, choose active identity more directly, and keep balances consistent.
