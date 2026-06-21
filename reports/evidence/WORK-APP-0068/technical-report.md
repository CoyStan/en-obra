# WORK-APP-0068 Technical Report

## Summary

Redesigned the `Perfil` tab into an Open Design-inspired identity vault for the
selected group. The screen now leads with a local profile object, selected group
context, explicit demo/local trust cues, a compact active persona surface, and
list-style member identity selection.

## Product Decisions

- Kept `Perfil` scoped to the selected group so the active identity matches the
  same group context used by `Inicio`, `Actividad`, and `Balance`.
- Replaced large repeated persona chips with list rows to reduce visual weight
  and make member selection easier to scan on Android widths.
- Kept `Sin pagos reales`, local-only storage, and no-sync cues visible in the
  first viewport.
- Recorded the decision in `docs/product/decisions.md`.

## Open Design Inputs

- Stripe: precise trust hierarchy, compact financial rails, disciplined
  elevation and border use.
- Wise: local money clarity, warm green action language, physical identity
  object feeling.
- Revolut: generous touch targets and simple, high-contrast consumer finance
  rows.
- Mobile app template: profile archetype with one primary identity object and
  tab-native structure.

## Verification Evidence

- `profile-vault-final-360x740.png`
- `profile-vault-final-390x844.png`
- `profile-vault-final-412x915.png`
- Matching `.txt` captures for each screenshot.

## Not Done

- No real payments.
- No production backend or sync service.
- No secrets, paid APIs, or deployment.
- Physical Android emulator/device QA remains pending; this ticket used web
  export at Android viewport sizes.
