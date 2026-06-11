---
id: CUE-0013
title: Security and data deletion model
status: needs-human
risk: R3
priority: P0
stream: security
claimed_by:
claimed_at:
claim_ref:
claim_heartbeat_at:
claim_expires_at:
allowed_paths:
  - src/security/**
  - src/state/**
  - src/__tests__/**
  - docs/production/security-data-deletion.md
  - docs/product/decisions.md
  - reports/**
  - handoffs/**
  - tickets/open/CUE-0013-*
forbidden_paths:
  - .env
  - .env.*
  - **/secrets/**
  - **/*secret*
  - **/*token*
  - infra/prod/**
  - prod/**
requires_human_confirmation: true
requires_review: true
verification:
  - npm run typecheck
  - npm test
  - ./bin/palari lint CUE-0013
target_branch: main
branch: ticket/CUE-0013
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0013
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-11
---

# CUE-0013 Security and data deletion model

## Goal

Define and implement the current local-only security/data deletion model, while
documenting the human decisions required before production accounts, backend
sync, or remote deletion promises ship.

## Scope

- Local deletion helper and local data inventory under `src/security/**`.
- State/storage clear helpers under `src/state/**`.
- Focused tests under `src/__tests__/**`.
- Security/data deletion production note.
- Decision log, technical report, handoff note, and ticket metadata.

## Acceptance

- A helper clears all current app-owned AsyncStorage keys.
- Tests prove current app data, mock sync state, and local mock account state are
  included in the deletion inventory.
- Documentation clearly distinguishes local deletion from unavailable remote
  backend/account deletion.
- Human privacy/security/legal blockers remain explicit and unresolved.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- ./bin/palari lint CUE-0013

## Ticket Completion Contract

### Non-Goals

- No production backend, remote deletion endpoint, real auth provider, hosted
  deletion URL, legal approval, or UI deletion flow.

### Definition Of Done

- Local deletion helper, tests, docs, decision entry, report, evidence, and
  handoff are complete; Palari lint/scope/ci and app checks pass; ticket remains
  gated on human security/privacy decisions.

### Evidence Required

- `reports/CUE-0013-technical-report.md`
- `reports/evidence/CUE-0013/`
- `handoffs/CUE-0013-handoff.md`
- `npm run typecheck`, `npm test`, Palari lint, scope-check, and CI output.

### Expansion Rules

- Stop and request human input if production backend, account deletion promises,
  legal/privacy approval, provider choice, data residency, support ownership,
  or public deletion URLs are required.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
