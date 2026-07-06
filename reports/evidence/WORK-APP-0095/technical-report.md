# WORK-APP-0095 Technical Report

## Summary

Added local edit/delete expense flows with audit events and recalculated
balances. Existing expenses can be reopened in the composer, updated with the
same validation/split path as new expenses, or removed locally from activity
rows. Deletes remove participant share rows but preserve a local audit event.

## Changes

- Added `expense_updated` and `expense_deleted` activity event types.
- Added `updateExpenseMutation` and `deleteExpenseMutation`.
- Rebuilt participant share rows on edit.
- Removed expense and participant rows on delete.
- Added sync outbox rows for local update/delete/create audit intent.
- Added `entityId` to activity items so UI rows can target their source record.
- Exposed `updateExpense` and `deleteExpense` in `useAppData`.
- Added activity-row edit/delete controls for local expenses.
- Reused the composer in edit mode with prefilled category, amount, payer,
  participants, split method, note, and title.
- Added mutation tests for edit/delete behavior and integrity.

## Evidence

- `reports/evidence/WORK-APP-0095/screenshots/activity-edit-delete-360x740.png`
- `reports/evidence/WORK-APP-0095/screenshots/activity-edit-delete-390x844.png`
- `reports/evidence/WORK-APP-0095/screenshots/activity-edit-delete-412x915.png`
- `reports/evidence/WORK-APP-0095/screenshots/edit-expense-sheet-360x740.png`
- `reports/evidence/WORK-APP-0095/screenshots/edit-expense-sheet-390x844.png`
- `reports/evidence/WORK-APP-0095/screenshots/edit-expense-sheet-412x915.png`

## Verification

- `npm run typecheck` passed.
- `npm test -- src/__tests__/appMutations.test.ts src/__tests__/balances.test.ts src/__tests__/dataIntegrity.test.ts` passed: 3 files, 29 tests.
- `npm test` passed: 37 files, 159 tests.
- `npx expo config --type public` passed.
- `npm run export:web` passed and exported `dist`.
- `./bin/company-os scope WORK-APP-0095` passed.
- `./bin/company-os validate` passed.

## Residual Risk

- Delete is local/demo only and does not represent production authorization,
  remote deletion, or backend sync.
- Native emulator/device verification remains deferred to the Android
  verification readiness ticket.
