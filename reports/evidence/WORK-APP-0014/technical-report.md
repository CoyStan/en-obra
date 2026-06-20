# WORK-APP-0014 Technical Report

## Work Item

Refine hero balance amount layout.

## Scope

Founder feedback called out that the first-viewport balance amount was too big,
ugly, lacked decimals, and should use the available right-side space.

## Changes

- Restored two decimal places in the hero balance amount.
- Split the currency label (`MXN`) from the numeric amount to prevent narrow
  Android truncation.
- Right-aligned the numeric amount inside the balance panel.
- Reduced the card height, icon size, label size, and amount size.
- Kept the personal balance state on the left.
- Recorded the design decision in `docs/product/decisions.md`.

## Verification

- `npm run typecheck`: passed.
- `npm test`: passed, 8 files and 25 tests.
- `npm run export:web`: passed.
- `./bin/company-os validate`: passed.
- `./bin/company-os scope WORK-APP-0014 ...`: passed.
- Chromium screenshots captured:
  - `reports/evidence/WORK-APP-0014/screenshots/balance-360x740.png`
  - `reports/evidence/WORK-APP-0014/screenshots/balance-390x844.png`

## Not Done

- No native Android emulator/device QA.
- No payment, backend, secret, or production release changes.
