# WORK-APP-0027 Technical Report

## Summary

Strengthened the group-first navigation model so `Grupos` behaves like the group switcher and `Actividad`, `Balance`, and `Perfil` read as workspace views scoped to the selected group.

## Changes

- Updated bottom navigation semantics:
  - The first tab uses the switch-oriented `account-switch` icon.
  - The first tab label changes to `Elegir` when no group is selected and `Cambiar` when a group is active.
  - Scoped tab accessibility labels include the selected group when available.
- Added a compact workspace context bar above scoped tabs:
  - Shows `Grupo activo`.
  - Shows the selected group name and current scoped section, such as `Viaje a Oaxaca · Actividad`.
  - Provides an explicit `Cambiar` action that returns to the group picker.
- Guarded scoped tab routing:
  - Tapping `Actividad`, `Balance`, or `Perfil` without a selected group routes the user to `Grupos`.

## Product Rationale

The app model is now clearer: users choose a group first, then inspect activity, balances, and profile/person settings within that group. Changing the group changes the context for the other tabs.

## Verification

- `npm run typecheck` passed.
- `npm test` passed: 17 files, 63 tests.
- `npx expo config --type public` passed.
- `./bin/company-os validate` passed.

## Out Of Scope

- No real payments.
- No production backend or secrets.
- No group invite/auth implementation.
- No native emulator QA in this ticket.
