# WORK-APP-0022 Technical Report

## Summary

Extracted app write behavior into pure backend mutation functions. This makes
group, member, expense, and settlement mutations reusable by local storage,
future SQLite, or a hosted backend adapter without depending on React.

## Changes

- Added `src/backend/appMutations.ts`.
  - `createGroupMutation`
  - `addMemberMutation`
  - `addExpenseMutation`
  - `markSettlementPaidMutation`
- Refactored `src/state/useAppData.ts`.
  - React state now acts as the persistence shell.
  - Mutation rules, activity events, participant shares, and outbox rows come
    from the backend mutation service.
- Added `src/__tests__/appMutations.test.ts`.
  - Verifies group creation records.
  - Verifies member/user membership creation.
  - Verifies expense shares and outbox rows.
  - Verifies settlement records.
  - Verifies validation failures do not mutate data.
  - Runs integrity audit after successful mutations.
- Updated `docs/backend/sql-readiness.md` with the mutation service boundary.

## Verification

- `npm run typecheck` passed.
- `npm test` passed:
  - 13 test files passed.
  - 48 tests passed.

## Play Store Readiness Impact

- Core local write behavior is now testable outside the UI.
- Future storage and sync adapters can reuse the same mutation outputs.
- The app keeps local-first behavior and no-real-payments semantics.

## Limitations

- No production backend provider was selected.
- No native database adapter was added.
- No remote conflict resolution was implemented.
