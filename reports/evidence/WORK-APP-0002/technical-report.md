# WORK-APP-0002 Technical Report

## Summary

Implemented a SQL-ready local-first account and group data model while preserving the existing offline demo behavior. The app still runs without backend services, secrets, real payments, or production auth.

## Scope Completed

- Added first-class local entities for users, group memberships, expense participants, activity events, and sync outbox items.
- Expanded group, expense, settlement, and app data types to carry future backend-ready identifiers and timestamps.
- Updated demo data to use realistic Mexico/LATAM users, groups, member rows, equal-split participant rows, settlement records, activity rows, and an empty sync outbox.
- Updated balance calculation to prefer SQL-ready participant/member rows while retaining legacy fallback behavior.
- Updated local app actions so creating groups, adding members, adding expenses, and marking settlements also produce companion SQL-ready rows and sync outbox entries.
- Fixed the expense participant write path so future subset participant selections are preserved instead of being overwritten with all group members.
- Added normalization for older local data so legacy v1 documents are upgraded into the v2 local model on load.
- Documented the auth/account model and architecture decisions for the local-first SQL-ready phase.

## Verification

- `npm run typecheck` passed.
- `npm test` passed: 6 test files, 19 tests.
- `npx expo config --type public` passed.
- `npm run export:web` passed.
- `./bin/company-os validate` passed.
- `./bin/company-os scope WORK-APP-0002 ...` passed.
- Captured Android-width smoke screenshot: `reports/evidence/WORK-APP-0002/mobile-360x740.png`.
- GLM 5.2 code-only review initially found a participant-subset bug; the issue was fixed, covered with a focused validation test, and then follow-up reviewed as accept-ready.

## Evidence Notes

- New unit coverage verifies the demo data includes SQL-ready entities, participant shares sum to the expense amount, balances can be calculated from participant rows, and legacy data normalizes to the v2 shape.
- New validation coverage verifies expense participant subsets remain explicit and invalid participant IDs are rejected.
- The screenshot confirms the current UI renders successfully at 360x740 after switching to v2 demo data.

## Limits

- No production auth provider was implemented.
- No backend sync service was implemented.
- No real payment handling was implemented.
- No Android emulator/device build was run for this work item.
- Human product/review acceptance remains required under Company OS.
