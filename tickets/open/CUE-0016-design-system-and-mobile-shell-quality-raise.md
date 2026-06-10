---
id: CUE-0016
title: Design system and mobile shell quality raise
status: claimed
risk: R2
priority: P0
stream: design
claimed_by: codex
claimed_at: 2026-06-10T20:47:10Z
claim_ref: refs/palari/claims/CUE-0016
claim_heartbeat_at: 2026-06-10T20:47:10Z
claim_expires_at: 2026-06-10T20:52:10Z
allowed_paths:
  - App.tsx
  - src/theme/**
  - src/components/**
  - src/screens/MainScreen.tsx
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0016-*
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
  - ./bin/palari lint CUE-0016
target_branch: main
branch: ticket/CUE-0016
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0016
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0016 Design system and mobile shell quality raise

## Goal

Raise the base Android shell and visual system so Cuentas Claras feels like a
premium, trustworthy Mexico/LATAM expense app instead of a generated Expo demo.
The first viewport should communicate brand, active group, money state, and next
action with calm hierarchy.

## Scope

- App shell structure, top summary/header, bottom navigation, spacing, color,
  type scale, shared UI primitives, press states, and screen-level responsive
  layout.
- Product/design documentation for the visual system and shell rules.
- UI evidence and design-review evidence.

## Acceptance

- The visible shell uses one coherent palette, predictable spacing, compact
  icons, polished Android touch targets, and readable MXN amount hierarchy.
- The first viewport feels founder-demo-ready on small Android widths, with no
  clipped text, toy-like icon blocks, random accent colors, or marketing hero
  styling.
- Navigation labels and account/profile language are Spanish-first and accurate
  for a local demo with no real payment rails.
- Mobile screenshots are captured at small and normal widths or an exact tooling
  blocker is documented.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0016

## Ticket Completion Contract

### Non-Goals

- No new expense-splitting logic, payment rails, backend/auth provider, Play
  upload, asset generation, or broad rewrite.
- Do not absorb detailed settlement-flow redesign; that belongs to CUE-0018.

### Definition Of Done

- A reviewer can open the app locally and immediately see a polished Android
  mobile shell with a consistent design system and trustworthy money hierarchy.

### Evidence Required

- Specialist report.
- Claude/opencode design-review prompt and output if available.
- Mobile screenshots or documented screenshot limitation.
- Palari scope/lint/CI evidence.

### Expansion Rules

- Stop if the work requires changing domain behavior, adding dependencies,
  integrating production services, or reconciling unmerged ticket branches.

### Final Review Gate

- Reviewer checks visual quality, Spanish copy, small-width layout, touch
  targets, and evidence before recommending accept, reopen, or needs-human.
