# WORK-APP-0011 Technical Report

## Summary

Added a lightweight visual comprehension layer so the app no longer relies
mostly on text to explain balances and settlements.

## Files Changed

- `src/screens/MainScreen.tsx`
  - Added a `MoneyFlowFigure` that visually shows payer, amount, and receiver.
  - Added a subtle animated cash object using React Native `Animated`.
  - Added reduced-motion support via `AccessibilityInfo`.
  - Added a static centered cash object when reduced motion is enabled.
  - Added a calm "todo en paz" visual state.
  - Added activity row marker dots to make activity rows easier to scan.
- `docs/product/decisions.md`
  - Recorded the decision to use motion only when it explains money flow.

## Accessibility And Safety

- The money-flow figure has an accessibility label that explains payer,
  receiver, amount, and `Registro local, sin pagos reales`.
- The animation uses `AccessibilityInfo.isReduceMotionEnabled()` and stops the
  loop when reduced motion is enabled.
- The animated object uses only opacity and transform with `useNativeDriver`.
- No real payment behavior, backend service, secret, paid API, push service, or
  Play Store submission work was introduced.

## Verification

- `npm run typecheck` passed.
- `npm test` passed: 8 files, 25 tests.
- `npx expo config --type public` passed.
- `npm run export:web` passed.
- `./bin/company-os validate` passed.
- `./bin/company-os scope WORK-APP-0011` passed.
- Playwright CLI screenshot capture passed:
  - `reports/evidence/WORK-APP-0011/screenshots/balance-360x740.png`
  - `reports/evidence/WORK-APP-0011/screenshots/balance-390x844.png`
  - `reports/evidence/WORK-APP-0011/screenshots/balance-412x915.png`

## Notes

- GLM 5.2 final code-only review returned `accept-ready`.
- Native Android emulator/device QA remains a follow-up.
