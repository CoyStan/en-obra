# WORK-APP-0093 Technical Report

## Summary

Simplified the add-expense composer into a lighter Android-first receipt capture
surface. The flow now keeps category, amount, concept, payer, participants,
optional note, equal split preview, and the local save action in one compact
progressive surface instead of three visually heavy stacked sections.

## Changes

- Replaced the three-section add-expense composer with one compact `Nuevo gasto`
  receipt surface.
- Kept category, payer, and participants as dropdown/list controls with smooth
  existing `SelectPanel` animation.
- Removed the progress-pill strip and money-route bridge decoration from the
  default view.
- Added a compact equal-split preview that appears only after amount and
  participant input are available.
- Added a shared `expenseCanSave` guard so button state and validation stay
  legible.
- Recorded the design decision in `docs/product/decisions.md`.

## Evidence

- `reports/evidence/WORK-APP-0093/screenshots/add-expense-360x740.png`
- `reports/evidence/WORK-APP-0093/screenshots/add-expense-390x844.png`
- `reports/evidence/WORK-APP-0093/screenshots/add-expense-412x915.png`

## Verification

- `npm run typecheck` passed.
- `npm test -- src/__tests__/flowValidation.test.ts src/__tests__/appMutations.test.ts` passed: 2 files, 20 tests.
- `npm test` passed: 37 files, 157 tests.
- `npx expo config --type public` passed.
- `npm run export:web` passed and exported `dist`.
- `./bin/company-os scope WORK-APP-0093` passed.
- `./bin/company-os validate` passed.

## Residual Risk

- This ticket simplifies the equal-split composer only. Exact amount/share-unit
  editing is intentionally deferred to `WORK-APP-0094`.
- Screenshots were captured from the exported web preview at Android-like
  widths; native emulator/device verification remains part of the later Android
  readiness work.
