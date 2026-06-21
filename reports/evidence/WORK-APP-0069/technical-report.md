# WORK-APP-0069 Technical Report

## Summary

Redesigned the add-expense modal into a compact receipt composer. The sheet now
opens with group, active identity, and `Sin pagos reales` context chips, then
guides the user through receipt, money route, and split preview surfaces.

## Product Decisions

- Removed the vertical step rail in favor of compact progress pills.
- Kept category, amount, payer, and participants as dropdown/list controls.
- Added a visual money-route connector between payer and participants.
- Preserved exact MXN decimals in the amount input and split preview.
- Kept save copy explicit that the action is local and does not move money.

## Open Design Inputs

- Stripe: precise financial object hierarchy and controlled surfaces.
- Wise: warm green fintech action language and clear money-state objects.
- Revolut: compact consumer-finance rows, large touch targets, and simple
  high-confidence controls.
- Open Design mobile template: one-job mobile screen discipline and visible
  state before committing an action.

## Verification Evidence

- `expense-composer-final-360x740.png`
- `expense-composer-final-390x844.png`
- `expense-composer-final-412x915.png`
- `expense-composer-split-360x740.png`
- `expense-composer-split-390x844.png`
- `expense-composer-split-412x915.png`
- Matching `.txt` captures for each screenshot.

## Checks

- `npm run typecheck`
- `npm test`
- `npx expo config --type public`
- `npm run export:web`
- `./bin/company-os scope WORK-APP-0069`
- `./bin/company-os validate`

## Not Done

- No real payments.
- No production backend, sync service, secrets, paid APIs, or deployment.
- Physical Android emulator/device QA remains pending; this ticket used web
  export at Android viewport sizes.
