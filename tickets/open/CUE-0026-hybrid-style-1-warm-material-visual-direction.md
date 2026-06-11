---
id: CUE-0026
title: Hybrid Style 1 Warm Material visual direction
status: claimed
risk: R2
priority: P0
stream: design
claimed_by: codex
claimed_at: 2026-06-11T06:31:28Z
claim_ref: refs/palari/claims/CUE-0026
claim_heartbeat_at: 2026-06-11T06:31:28Z
claim_expires_at: 2026-06-11T08:31:28Z
allowed_paths:
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0026-*
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
  - ./bin/palari lint CUE-0026
target_branch: main
branch: ticket/CUE-0026
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0026
accepted_by:
accepted_at:
created: 2026-06-11
updated: 2026-06-11
---

# CUE-0026 Hybrid Style 1 Warm Material visual direction

## Goal

Define the product-approved visual direction for Cuentas Claras after founder
review of generated style concepts: Style 1 trustworthy fintech minimal as the
base, warmed by Style 2 Mexico/LATAM cues, and structured with Style 3
Android-native Material patterns.

## Scope

- Product design-system documentation and decision log.
- Repo-local visual-reference evidence for the selected generated concepts.
- Implementation acceptance checklist for follow-up UI tickets.
- CUE-0026 reports and ticket metadata.

## Acceptance

- `docs/product/design-system.md` states the hybrid direction, palette,
  layout grammar, component rules, and anti-goals.
- `docs/product/visual-direction.md` defines the exact "close resemblance"
  checklist for future implementation and review.
- `docs/product/decisions.md` records the founder/product decision.
- Reference concept images for Style 1, Style 2, and Style 3 are copied to
  `reports/evidence/CUE-0026/` for stable review evidence.
- A CUE-0026 technical report records verification and follow-up tickets.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0026

## Ticket Completion Contract

### Non-Goals

- No app source changes in this ticket.
- No new dependencies, production services, payments, backend integration,
  legal claims, analytics, or store deployment.
- No self-acceptance of the visual direction or implementation.

### Definition Of Done

- A reviewer can open the docs and evidence and know exactly how the app should
  look and behave visually before the next implementation ticket starts.

### Evidence Required

- `docs/product/design-system.md`
- `docs/product/visual-direction.md`
- `docs/product/decisions.md`
- `reports/CUE-0026-technical-report.md`
- `reports/evidence/CUE-0026/style-1-fintech-minimal.png`
- `reports/evidence/CUE-0026/style-2-warm-mexican-modern.png`
- `reports/evidence/CUE-0026/style-3-material-you-native.png`
- Palari scope/lint/CI evidence.

### Expansion Rules

- Stop if the implementation requires changing app source in this ticket,
  adding production integrations, or making legal/payment/privacy commitments.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
