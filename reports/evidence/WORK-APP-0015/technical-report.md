# WORK-APP-0015 Technical Report

## Work Item

Responsive density for finance components.

## Scope

Founder feedback asked whether the app could adapt element sizing instead of
hard-fixing one font size across every phone. This pass introduces responsive
density for high-risk finance UI without making the entire app fluid.

## Changes

- Added compact, regular, and roomy density modes based on viewport width.
- Added measured container width for the hero balance panel.
- Replaced fixed hero amount sizing with a calculated font size based on the
  available amount area and formatted money length.
- Applied compact/roomy variants to:
  - page content spacing,
  - app title,
  - hero card spacing,
  - hero balance panel spacing,
  - bottom navigation labels,
  - add-expense select triggers.
- Kept ordinary body text stable to avoid a jittery or inconsistent app feel.
- Recorded the responsive-density decision in `docs/product/decisions.md`.

## Verification

- `npm run typecheck`: passed.
- `npm test`: passed, 8 files and 25 tests.
- `npm run export:web`: passed.
- `./bin/company-os validate`: passed.
- `./bin/company-os scope WORK-APP-0015 ...`: passed.
- Chromium screenshots captured:
  - `reports/evidence/WORK-APP-0015/screenshots/balance-360x740.png`
  - `reports/evidence/WORK-APP-0015/screenshots/balance-390x844.png`
  - `reports/evidence/WORK-APP-0015/screenshots/balance-412x915.png`

## Not Done

- No native Android emulator/device QA in this pass.
- No real payments, production backend, secrets, paid services, or release
  changes.
- The pass does not make every single text element fluid; it focuses on finance
  components that are likely to overflow or feel oversized.
