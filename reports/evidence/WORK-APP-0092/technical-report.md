# WORK-APP-0092 Technical Report

## Summary

Upgraded the local split engine so Cuentas Claras can represent equal, exact
amount, and share-unit splits with deterministic integer-cent rounding. The
domain, validation, mutation, SQL-ready schema/dataset, demo data, integrity
repair, and tests now carry split method metadata without adding real payments,
production sync, secrets, paid services, or deployment behavior.

## Changes

- Added `src/domain/splits.ts` with `resolveSplit` and a compatibility
  `splitEqual` wrapper.
- Extended domain types with `SplitMethod`, `SplitInput`, and optional
  `ExpenseParticipant.shareUnits`.
- Updated add-expense validation and mutations to accept optional split input
  and persist resolved participant share rows.
- Expanded SQL-ready participant rows with `equal`, `exact`, and `shares`
  methods plus `share_units`.
- Seeded demo data with one exact split and one share-unit split while keeping
  the existing equal-flow UI behavior.
- Added split-focused unit tests and updated backend dataset/model tests.
- Regenerated backend SQL/release artifacts under `docs/backend/`.

## Verification

- `npm run typecheck` passed.
- `npm test -- src/__tests__/splits.test.ts src/__tests__/flowValidation.test.ts src/__tests__/appMutations.test.ts src/__tests__/sqlDataset.test.ts src/__tests__/sqlReadyModel.test.ts` passed: 5 files, 32 tests.
- `npm test` passed: 37 files, 157 tests.
- `npx expo config --type public` passed.
- `npm run export:web` passed and exported `dist`.
- `./bin/company-os scope WORK-APP-0092` passed.
- `./bin/company-os validate` passed.

## Residual Risk

- The visible add-expense UI still defaults to the current equal split flow.
  The richer exact/share editor remains intentionally deferred to the next UI
  ticket.
- The model is still local/mock only. No production backend, auth, sync, real
  payments, secrets, paid services, or Play submission was introduced.
