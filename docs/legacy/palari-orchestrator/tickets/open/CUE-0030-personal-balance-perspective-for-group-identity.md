---
id: CUE-0030
title: Personal balance perspective for group identity
status: claimed
risk: R2
priority: P0
stream: design
claimed_by: codex
claimed_at: 2026-06-15T23:38:52Z
claim_ref: refs/palari/claims/CUE-0030
claim_heartbeat_at: 2026-06-15T23:38:52Z
claim_expires_at: 2026-06-16T02:38:52Z
allowed_paths:
  - src/screens/**
  - src/auth/**
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0030-*
forbidden_paths:
  - .env
  - .env.*
  - **/secrets/**
  - **/*secret*
  - infra/prod/**
  - prod/**
requires_human_confirmation: false
requires_review: true
verification:
  - npm run typecheck
  - npm test
  - npx expo config --type public
  - ./bin/palari lint CUE-0030
target_branch: main
branch: ticket/CUE-0030
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0030
accepted_by:
accepted_at:
created: 2026-06-15
updated: 2026-06-15
---

# CUE-0030 Personal balance perspective for group identity

## Goal

When a user has chosen which person they are in the active group, the balance
screen should explain the group from that person's perspective first. The user
should immediately know whether they personally owe money, should receive money,
or are settled, before reading the global group settlement list.

## Scope

- First-viewport balance copy and layout in the active group screen.
- Local account/person perspective derived from existing local identity state.
- Small screen evidence, product decisions, and technical report.
- No changes to payment, backend, invite, or production account behavior.

## Acceptance

- Signed-in local profile with an active group person sees plain Spanish copy
  such as "Tú debes", "Te deben", or "Estás en paz" with the relevant MXN
  amount.
- Guest/no-selected-person users still see the global group receive/pay summary.
- Global "quién le debe a quién" content remains available below the personal
  summary.
- The first viewport remains readable at 360 px width with no clipped text or
  extra dashboard density.
- No copy implies real payments, bank transfers, production accounts, or remote
  sync.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0030

## Ticket Completion Contract

### Non-Goals

- No advanced split methods, backend sync, real auth provider, invites,
  notifications, payment rails, legal text, or Play Store work.
- No new financial calculation model beyond reading existing member balances
  and settlement suggestions.

### Definition Of Done

- A reviewer can select/open a local profile/person and understand their own
  group balance before reading the broader group settlement list.

### Evidence Required

- Technical report.
- Decision-log entry.
- Mobile screenshots at 360x740 and 412x915 where possible.
- Palari scope/lint/CI evidence.

### Expansion Rules

- Stop if a change would require production account decisions, privacy/legal
  decisions, payment wording, external services, or secrets.

### Final Review Gate

- Reviewer checks personal-perspective clarity, fallback guest behavior,
  Spanish copy, no-real-payment trust cues, screenshot evidence, and Palari
  gates before recommending accept, reopen, or needs-human.
