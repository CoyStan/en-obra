# WORK-APP-0012 Technical Report

## Work Item

Object-led Splitwise interaction pass.

## Scope

Recycle the useful interaction patterns from `/tmp/agon-agent-style-review`
without copying the toy visual skin. The app should gain more visible objects,
people, categories, and route clarity while preserving the premium local-first
financial trust model.

## Changes

- Added restrained group identity objects based on group context.
- Added stacked avatars to the hero and group cards.
- Added category metadata, category chips, category objects, and category-aware
  activity rows.
- Reworked the add-expense sheet into an amount-first flow with category,
  concept, payer, participants, equal split preview, and no-real-payments cue.
- Updated settlement cards to show payer and receiver avatars with a visible
  route and a less cramped amount layout.
- Grouped the full activity history by date.
- Tagged demo expenses with realistic categories.
- Added a regression test that preserves expense category metadata in activity.
- Recorded the product/design decision in `docs/product/decisions.md`.

## Verification

- `npm run typecheck`: passed.
- `npm test`: passed, 8 files and 25 tests.
- `npx expo config --type public`: passed.
- `npm run export:web`: passed.
- `./bin/company-os validate`: passed.
- `./bin/company-os scope WORK-APP-0012 ...`: passed.
- Chromium screenshots captured:
  - `reports/evidence/WORK-APP-0012/screenshots/balance-360x740.png`
  - `reports/evidence/WORK-APP-0012/screenshots/balance-390x844.png`
  - `reports/evidence/WORK-APP-0012/screenshots/balance-412x915.png`

## Not Done

- No real payments.
- No production backend or secrets.
- No navigation rewrite.
- No native Android emulator/device QA in this pass.
- No legal, privacy, monetization, or release acceptance.

## Review Notes

The pass is safer as an interaction/object-language improvement than as a full
theme replacement. The toy app's best ideas improved comprehension, but the
Cuentas Claras palette, SQL-ready data shape, integer cents, and local-only copy
remain the authority.
