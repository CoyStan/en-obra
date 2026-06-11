# CUE-0027 Technical Report

## Summary

Implemented the CUE-0026 hybrid visual direction in the app shell and primary
balance screen. The app now starts on a balance-first Android view with an
active group module, receive/pay balance, quick actions, local settlement cue,
and activity preview.

## Verification

Passed:

- `npm run typecheck`
- `npm test` (5 files, 15 tests)
- `npx expo config --type public`
- Isolated temp-copy web export with `npx expo export --platform web --output-dir dist --clear`
- Chromium mobile screenshots at 360x740 and 412x915
- `identify` screenshot dimension check
- `./bin/palari lint CUE-0027`
- `./bin/palari scope-check CUE-0027 --base main`
- `./bin/palari ci CUE-0027 --base main`

## Files Changed

- `src/theme/theme.ts`
- `src/components/ui.tsx`
- `src/screens/MainScreen.tsx`
- `docs/product/decisions.md`
- `reports/CUE-0027-technical-report.md`
- `reports/evidence/CUE-0027/visual-verification.md`
- `reports/evidence/CUE-0027/screenshots/mobile-360x740.png`
- `reports/evidence/CUE-0027/screenshots/mobile-412x915.png`

## CI Evidence

Palari CI evidence path:

- `reports/evidence/CUE-0027/`

## Risks / Follow-Ups

- The static export from nested Palari worktrees can bundle stale source; final
  screenshots were therefore captured from an isolated temp copy as in
  CUE-0015.
- CUE-0028 remains open for final visual QA and any small polish needed after
  reviewer inspection.
