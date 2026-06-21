# WORK-APP-0063 Technical Report

## Summary

Redesigned the selected-group `Inicio` screen into an Open Design-led money-room instrument. The first viewport now centers on group context, active identity, personal balance, who owes whom, MXN amounts, external/local settlement language, people in the group, and the next action.

## Design Inputs

- `docs/product/open-design-design-brief.md`
- `/home/quetza/projects/open-design/design-systems/stripe/DESIGN.md`
- `/home/quetza/projects/open-design/design-systems/wise/DESIGN.md`
- `/home/quetza/projects/open-design/design-systems/revolut/DESIGN.md`
- `/home/quetza/projects/open-design/design-systems/expo/DESIGN.md`
- `/home/quetza/projects/open-design/design-templates/mobile-app/references/checklist.md`

## Changes

- Replaced the stacked Inicio hero/route/member cards with one integrated money instrument.
- Added a compact active-group switcher with visible `Sin pagos reales`.
- Kept active user identity visible and selectable in the money instrument.
- Moved balance amount to a quieter right-aligned numeric rail with decimals.
- Added an embedded who-owes-whom route and amount inside the instrument.
- Added open-vs-spent progress to make the group state more visual.
- Replaced heavier member cards with a compact people strip.
- Preserved the primary next action and secondary expense/activity actions.
- Recorded the product decision in `docs/product/decisions.md`.

## Verification

- `npm run typecheck` passed.
- `npm test` passed: 36 files, 144 tests.
- `npx expo config --type public` passed.
- `npm run export:web` passed.
- `./bin/company-os scope WORK-APP-0063` passed.

## Screenshot Evidence

- `reports/evidence/WORK-APP-0063/inicio-selected-open-design-360x740.png`
- `reports/evidence/WORK-APP-0063/inicio-selected-open-design-390x844.png`
- `reports/evidence/WORK-APP-0063/inicio-selected-open-design-412x915.png`

## Limits

- No app data model, production backend, payment, secret, or paid-service work was introduced.
- Evidence is from the Expo web export at Android viewport sizes; physical Android emulator/device verification remains future work.
