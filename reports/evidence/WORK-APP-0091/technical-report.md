# WORK-APP-0091 Technical Report

## Summary

Added safe local member management for the selected group.

The implementation supports adding, renaming, and guarded removal of members while protecting historical balance consistency. It remains local/mock only and does not introduce production auth, backend sync, real payments, secrets, paid services, or Play submission behavior.

## What Changed

- Added `renameMemberMutation`.
- Added `removeMemberMutation`.
- Removal is blocked when a member is referenced by expenses, participant rows, or settlements.
- Removal is blocked when it would leave the group empty.
- Rename updates the user display name, group member snapshot, local member mirror, group timestamp, and sync outbox.
- Balance screen now exposes a persistent `Gestionar` action for member management.
- Member sheet now supports:
  - adding an integrante;
  - editing a visible name;
  - removing members only when safe;
  - showing validation/error messages in context.

## Files Changed

- `src/backend/appMutations.ts`
- `src/state/useAppData.ts`
- `src/screens/MainScreen.tsx`
- `src/__tests__/appMutations.test.ts`
- `reports/evidence/WORK-APP-0091/*`

## Visual Evidence

Screenshots captured at:

- `360x740`
- `390x844`
- `412x915`

Artifacts:

- `member-manager-*.png`
- `member-edit-*.png`
- `runtime-proof.json`

Runtime proof confirms the manager, edit action, remove action, and save state are visible at all three widths.

## Verification

Passed:

- `npm run typecheck`
- `npm test`
- `npx expo config --type public`
- `npm run export:web`
- `./bin/company-os scope WORK-APP-0091`
- `./bin/company-os validate`

## Remaining Work

The next phase should start flexible split support with `WORK-APP-0092`.
