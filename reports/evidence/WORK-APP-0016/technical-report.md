# WORK-APP-0016 Technical Report

## Summary

Rebalanced the `Balances por integrante` rows so member identity, status,
explanation, and net amount use horizontal space more evenly on Android-width
screens.

## Changes

- Replaced the previous single-line member balance row composition with a
  structured card body:
  - avatar column
  - flexible member identity/status/detail area
  - reserved right-side money rail
- Kept all existing content:
  - member name
  - balance status pill
  - detailed paid/share/settlement explanation
  - exact MXN amount with decimals
- Added compact density styles for narrow screens so the amount rail remains
  aligned without squeezing the detail copy.
- Recorded the product decision in `docs/product/decisions.md`.

## Files Changed

- `src/screens/MainScreen.tsx`
- `docs/product/decisions.md`
- `reports/evidence/WORK-APP-0016/technical-report.md`
- `reports/evidence/WORK-APP-0016/screenshots/`
- `company-os/workspace.json`

## Verification

- `npm run typecheck` passed.
- `npm test` passed.
- `npm run export:web` passed.
- Chromium/CDP screenshots captured from the refreshed web export:
  - `reports/evidence/WORK-APP-0016/screenshots/balances-360x740.png`
  - `reports/evidence/WORK-APP-0016/screenshots/balances-390x844.png`
  - `reports/evidence/WORK-APP-0016/screenshots/balances-412x915.png`

## Visual QA Notes

- At 360 px width, rows remain readable with no amount/detail overlap.
- At 390 px width, the amount rail aligns consistently and the left copy has
  more breathing room than the previous layout.
- At 412 px width, the card keeps the same scan pattern while allowing the
  explanation text to wrap naturally.

## Limitations

- Verification used Expo web export at Android viewport sizes, not a native
  Android emulator build.
- No production payment, backend, or secret-dependent behavior was changed.
