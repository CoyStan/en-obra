# WORK-APP-0094 Technical Report

## Summary

Added a compact participant split editor to the add-expense composer. Users can
choose equal, exact amount, or share-unit splits, edit participant rows in place,
see deterministic cent-rounded preview amounts, and save through the local
mutation path introduced by the split engine ticket.

## Changes

- Added split mode state for `Igual`, `Exacto`, and `Partes`.
- Built a `SplitInput` from the composer state and resolved it with the domain
  split engine before save.
- Passed split input through `useAppData` into the existing add-expense mutation.
- Added exact amount inputs for participants.
- Added share-unit inputs for participants.
- Kept split selection list-based and inline, avoiding a separate heavy editor.
- Updated the decision log.

## Evidence

- `reports/evidence/WORK-APP-0094/screenshots/split-editor-exact-360x740.png`
- `reports/evidence/WORK-APP-0094/screenshots/split-editor-exact-390x844.png`
- `reports/evidence/WORK-APP-0094/screenshots/split-editor-exact-412x915.png`

## Verification

- `npm run typecheck` passed.
- `npm test -- src/__tests__/splits.test.ts src/__tests__/flowValidation.test.ts src/__tests__/appMutations.test.ts` passed: 3 files, 24 tests.
- `npm test` passed: 37 files, 157 tests.
- `npx expo config --type public` passed.
- `npm run export:web` passed and exported `dist`.
- `./bin/company-os scope WORK-APP-0094` passed.
- `./bin/company-os validate` passed.

## Residual Risk

- The editor is local/mock only and does not add production sync, real payments,
  secrets, paid services, or external messaging.
- Native emulator/device testing remains deferred to the Android verification
  readiness ticket.
