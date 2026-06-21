# WORK-APP-0064 Technical Report

## Summary

Redesigned the `Balance` tab as a settlement map. The first viewport now explains the open group amount, route count, main payer-to-receiver flow, local-only settlement action, and secondary routes before the detailed member ledger.

## Design Inputs

- `docs/product/open-design-design-brief.md`
- `/home/quetza/projects/open-design/design-systems/stripe/DESIGN.md`
- `/home/quetza/projects/open-design/design-systems/wise/DESIGN.md`
- `/home/quetza/projects/open-design/design-systems/revolut/DESIGN.md`
- `/home/quetza/projects/open-design/design-templates/mobile-app/references/checklist.md`

## Changes

- Converted Balance from stacked dashboard sections into a settlement map layout.
- Added a clearer open-balance hero with right-aligned decimal MXN amount.
- Promoted the main who-owes-whom route as the primary visual object.
- Replaced secondary full route cards with compact route chips.
- Preserved the member ledger below the map for detailed per-person balances.
- Kept `Sin pagos reales`, local settlement copy, and existing settlement logic.
- Recorded the product decision in `docs/product/decisions.md`.

## Verification

- `npm run typecheck` passed.
- `npm test` passed: 36 files, 144 tests.
- `npx expo config --type public` passed.
- `npm run export:web` passed.
- `./bin/company-os scope WORK-APP-0064` passed.

## Screenshot Evidence

- `reports/evidence/WORK-APP-0064/balance-map-360x740.png`
- `reports/evidence/WORK-APP-0064/balance-map-390x844.png`
- `reports/evidence/WORK-APP-0064/balance-map-412x915.png`

## Limits

- No payment processing, backend, secret, or paid-service work was introduced.
- Evidence is from Expo web export at Android viewport sizes; physical Android emulator/device verification remains future work.
