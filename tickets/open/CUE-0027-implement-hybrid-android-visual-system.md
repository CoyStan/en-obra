---
id: CUE-0027
title: Implement hybrid Android visual system
status: claimed
risk: R2
priority: P0
stream: design
claimed_by: codex
claimed_at: 2026-06-11T06:38:26Z
claim_ref: refs/palari/claims/CUE-0027
claim_heartbeat_at: 2026-06-11T06:38:26Z
claim_expires_at: 2026-06-11T08:38:26Z
allowed_paths:
  - src/theme/**
  - src/components/**
  - src/screens/MainScreen.tsx
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0027-*
forbidden_paths:
  - .env
  - .env.*
  - **/secrets/**
  - **/*secret*
  - **/*token*
  - infra/prod/**
  - prod/**
requires_human_confirmation: false
requires_review: true
verification:
  - npm run typecheck
  - npm test
  - npx expo config --type public
  - ./bin/palari lint CUE-0027
target_branch: main
branch: ticket/CUE-0027
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0027
accepted_by:
accepted_at:
created: 2026-06-11
updated: 2026-06-11
---

# CUE-0027 Implement hybrid Android visual system

## Goal

Implement the CUE-0026 hybrid direction in the actual app UI: Style 1
balance-first fintech trust, restrained Style 2 Mexico/LATAM warmth, and Style
3 Android-native structure.

## Scope

- Theme tokens, shared UI primitives, and `MainScreen` composition/styles.
- Product docs and decision log updates directly tied to the implementation.
- Mobile screenshot evidence and technical report.
- CUE-0027 ticket metadata.

## Acceptance

- First viewport shows active group identity, member count/chips, receive/pay
  balance module, quick actions, settlement suggestion, and start of activity
  on common Android mobile widths.
- Palette uses agave/teal as primary, small warm accents, and Android-native
  interaction cues without becoming one-note blue or beige/brown.
- Bottom navigation, chips, action rail, amount hierarchy, and settlement card
  align with `docs/product/visual-direction.md`.
- "Sin pagos reales" and local data trust cues remain visible near settlement
  actions.
- Mobile screenshots at 360 px and 412 px wide are captured or an exact tooling
  blocker is documented.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0027

## Ticket Completion Contract

### Non-Goals

- No new dependencies.
- No real payments, payment-provider wording, production backend, production
  auth, analytics, or Play upload.
- No domain model rewrite or advanced split behavior.
- No human/legal/privacy acceptance.

### Definition Of Done

- A reviewer can compare the running app to CUE-0026 reference evidence and see
  close resemblance in hierarchy, palette, Android structure, and trust cues.

### Evidence Required

- `reports/CUE-0027-technical-report.md`
- `reports/evidence/CUE-0027/visual-verification.md`
- `reports/evidence/CUE-0027/screenshots/mobile-360x740.png`
- `reports/evidence/CUE-0027/screenshots/mobile-412x915.png`
- Typecheck, tests, Expo config, Palari lint/scope/CI output.

### Expansion Rules

- Stop if achieving the visual direction requires production services, secrets,
  payments, external image feeds, new dependencies, or changes outside the
  allowed paths.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
