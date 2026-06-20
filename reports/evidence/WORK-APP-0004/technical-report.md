# WORK-APP-0004 Technical Report

## Summary

Implemented a premium, multi-user add-expense sheet. The flow now shows active identity, local/demo trust cue, payer selection, participant selection, equal MXN split preview, and a guarded save action that preserves participant IDs in the local SQL-ready model.

## Scope Completed

- Added explicit `Quién participa` controls to the add-expense sheet.
- Added per-participant equal-split preview using integer cents and MXN formatting.
- Added active identity and group context inside the sheet.
- Added `Sin pagos reales` trust cue near the money-entry flow.
- Ensured selecting a payer automatically includes that person as a participant.
- Prevented the payer from being removed from the split accidentally.
- Kept the sheet in a `ScrollView` with `keyboardShouldPersistTaps="handled"`.
- Recorded the product decision in `docs/product/decisions.md`.

## Verification

- `npm run typecheck` passed.
- `npm test` passed: 6 test files, 19 tests.
- `npx expo config --type public` passed.
- `npm run export:web` passed.
- `./bin/company-os validate` passed.
- `./bin/company-os scope WORK-APP-0004 ...` passed.
- Captured static Android-width home screenshots after the change:
  - `reports/evidence/WORK-APP-0004/screenshots/home-360x740.png`
  - `reports/evidence/WORK-APP-0004/screenshots/home-390x844.png`
  - `reports/evidence/WORK-APP-0004/screenshots/home-412x915.png`
- GLM 5.2 code-only design review initially requested changes, then final review returned `accept-ready`.

## Evidence Notes

- GLM review artifacts:
  - `reports/evidence/WORK-APP-0004/glm52-code-design-review.md`
  - `reports/evidence/WORK-APP-0004/glm52-followup-review.md`
  - `reports/evidence/WORK-APP-0004/glm52-final-review.md`
- The transient Playwright CLI could capture static screenshots, but package resolution for an interactive test runner failed without adding Playwright as a repo dependency. No dependency was added for this work item.

## Limits

- No real payments were added.
- No production backend, secrets, push, paid APIs, or Play Store submission were added.
- Android emulator/device testing was not run in this environment.
- Human visual/product approval remains required under Company OS.
