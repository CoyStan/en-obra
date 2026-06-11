---
id: CUE-0028
title: Visual QA and final hybrid polish
status: in-review
risk: R2
priority: P0
stream: design
claimed_by: codex
claimed_at: 2026-06-11T06:54:45Z
claim_ref: refs/palari/claims/CUE-0028
claim_heartbeat_at: 2026-06-11T06:54:45Z
claim_expires_at: 2026-06-11T08:54:45Z
allowed_paths:
  - src/theme/**
  - src/components/**
  - src/screens/MainScreen.tsx
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0028-*
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
  - ./bin/palari lint CUE-0028
target_branch: main
branch: ticket/CUE-0028
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0028
accepted_by:
accepted_at:
created: 2026-06-11
updated: 2026-06-11
---

# CUE-0028 Visual QA and final hybrid polish

## Goal

Review the implemented UI against the CUE-0026 close-resemblance checklist and
apply a final scoped polish pass if any visible gaps remain.

## Scope

- Focused visual/accessibility polish in theme tokens, shared primitives, and
  `MainScreen`.
- Screenshot comparison notes and final visual QA report.
- Product docs and CUE-0028 ticket metadata.

## Acceptance

- Screenshots demonstrate the app closely resembles the selected Style 1 +
  Style 2 warmth + Style 3 Android structure direction.
- No clipped text, overlapping UI, unreadable amount hierarchy, hidden
  settlement disclaimer, or first-viewport clutter remains at 360 px and 412 px
  mobile widths.
- The final QA note explicitly checks each item in
  `docs/product/visual-direction.md`.
- Only focused polish changes are made; large feature work is deferred.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0028

## Ticket Completion Contract

### Non-Goals

- No new product features beyond visual polish.
- No payments, backend, secrets, legal acceptance, Play upload, or new
  dependencies.
- No self-acceptance.

### Definition Of Done

- The app is founder-reviewable as the chosen hybrid style direction, with
  evidence and review notes ready for human acceptance.

### Evidence Required

- `reports/CUE-0028-technical-report.md`
- `reports/evidence/CUE-0028/visual-qa.md`
- `reports/evidence/CUE-0028/screenshots/mobile-360x740.png`
- `reports/evidence/CUE-0028/screenshots/mobile-412x915.png`
- Typecheck, tests, Expo config, Palari lint/scope/CI output.

### Expansion Rules

- Stop if review reveals a need for out-of-scope product features, external
  services, payment/legal/privacy decisions, or broad data model changes.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
