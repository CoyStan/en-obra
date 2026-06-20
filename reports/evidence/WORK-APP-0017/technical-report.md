# WORK-APP-0017 Technical Report

## Summary

Clarified the app navigation model so `Grupos` is the parent context and the
other tabs operate inside the currently selected group.

## Changes

- Changed the initial tab from `Balance` to `Grupos`.
- Reordered the bottom navigation to:
  - `Grupos`
  - `Actividad`
  - `Balance`
  - `Perfil`
- Selecting a group now opens `Actividad` for that group.
- Hid the large group hero while the user is on the group switcher, so the first
  screen is clearly for choosing or switching groups.
- Added `Elegir grupo` actions to group-scoped empty states.
- Added a `Grupo activo` panel at the top of `Perfil` so profile/person
  settings are visibly scoped to the selected group.
- Recorded the navigation decision in `docs/product/decisions.md`.

## Files Changed

- `src/screens/MainScreen.tsx`
- `docs/product/decisions.md`
- `reports/evidence/WORK-APP-0017/technical-report.md`
- `reports/evidence/WORK-APP-0017/screenshots/`
- `company-os/workspace.json`

## Verification

- `npm run typecheck` passed.
- `npm test` passed.
- `npm run export:web` passed.
- `npx expo config --type public` passed.
- `./bin/company-os validate` passed.
- `./bin/company-os scope WORK-APP-0017` passed.
- Chromium/CDP screenshots captured at 390x844:
  - `reports/evidence/WORK-APP-0017/screenshots/groups-landing-390x844.png`
  - `reports/evidence/WORK-APP-0017/screenshots/activity-after-group-select-390x844.png`
  - `reports/evidence/WORK-APP-0017/screenshots/balance-tab-390x844.png`
  - `reports/evidence/WORK-APP-0017/screenshots/profile-tab-390x844.png`

## Visual QA Notes

- The first screen now reads as a group switcher.
- Selecting `Viaje a Oaxaca` opens the group-scoped activity screen with the
  selected group hero visible.
- The same selected group context remains visible when moving to `Balance` and
  `Perfil`.
- `Perfil` now exposes the selected group and active member context before
  general local account controls.

## Limitations

- Verification used Expo web export at Android viewport size, not a native
  Android emulator.
- This pass did not implement backend accounts, real group invites, real
  payments, or production sync.
