# WORK-APP-0082 Technical Report

## Summary

Migrated the Inicio balance/route money instrument to a reusable
NativeWind/Reusables component while preserving the existing local-first money
logic, animated route figure, identity picker behavior, and next actions.

## Changes

- Added `HomeMoneyInstrument` as the tokenized reusable component for the Inicio
  money module.
- Moved active identity, personal balance, MXN amount, who-owes-whom route,
  `Sin pagos reales`, and spent/open progress into the reusable component.
- Updated `MainScreen.tsx` to pass existing calculated state and route content
  into `HomeMoneyInstrument`.
- Preserved the current animated `MoneyFlowFigure`, settlement flow, add-expense
  action, and local/demo behavior.

## Evidence

- Runtime proof: `reports/evidence/WORK-APP-0082/runtime-proof.json`
- Screenshots:
  - `reports/evidence/WORK-APP-0082/inicio-money-instrument-360x740.png`
  - `reports/evidence/WORK-APP-0082/inicio-money-instrument-390x844.png`
  - `reports/evidence/WORK-APP-0082/inicio-money-instrument-412x915.png`

Runtime proof confirmed at 360x740, 390x844, and 412x915:

- The app rendered.
- The Inicio money instrument rendered.
- Active user was visible.
- Selected group was visible.
- Personal balance was visible.
- MXN was visible.
- Who-owes-whom route cue was visible.
- Next action was visible.
- `Sin pagos reales` was visible.

## Verification

Passed:

- `npm run typecheck`
- `npm test`
- `npx expo config --type public`
- `npm run export:web`
- `./bin/company-os scope WORK-APP-0082`
- `./bin/company-os validate`

## Boundaries

- No money calculation behavior changed.
- No real payments, production backend, auth, secrets, paid services,
  deployment, Play Store submission, or legal/payment decisions added.
- Legacy StyleSheet entries for the old instrument are intentionally left for
  the later cleanup ticket.
