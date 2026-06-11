---
id: CUE-0012
title: Privacy and terms draft
status: claimed
risk: R3
priority: P0
stream: policy
claimed_by: codex
claimed_at: 2026-06-10T19:36:38Z
claim_ref: refs/palari/claims/CUE-0012
claim_heartbeat_at: 2026-06-11T05:26:04Z
claim_expires_at: 2026-06-11T07:26:04Z
allowed_paths:
  - docs/legal/**
  - docs/production/privacy-terms-readiness.md
  - docs/product/decisions.md
  - reports/**
  - tickets/open/CUE-0012-*
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
  - test -f docs/legal/privacy-policy-draft.md
  - test -f docs/legal/terms-draft.md
  - ./bin/palari lint CUE-0012
target_branch: main
branch: ticket/CUE-0012
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0012
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-11
---

# CUE-0012 Privacy and terms draft

## Goal

Prepare Spanish-first privacy and terms drafts for Android internal testing,
plus a readiness note that identifies the human legal, Play Console, and data
deletion decisions still required before publication.

## Scope

- Draft legal copy under `docs/legal/**`.
- Privacy, terms, and Play Data Safety readiness documentation.
- Decision log entry for draft-only legal posture.
- Technical report and ticket metadata only.

## Acceptance

- `docs/legal/privacy-policy-draft.md` exists and clearly describes current
  local-only data handling.
- `docs/legal/terms-draft.md` exists and clearly states that settlements are not
  real payments.
- `docs/production/privacy-terms-readiness.md` records Play/Data Safety,
  deletion, and human approval needs.
- Human legal/compliance approval remains explicit and unresolved.
- Path and risk rules are respected.

## Verification

- test -f docs/legal/privacy-policy-draft.md
- test -f docs/legal/terms-draft.md
- ./bin/palari lint CUE-0012

## Ticket Completion Contract

### Non-Goals

- No final legal approval.
- No privacy URL hosting.
- No Play Console submission.
- No backend, real auth, analytics, ads, payment, or deletion implementation.

### Definition Of Done

- Draft documents, readiness note, decision entry, and technical report are in
  place; Palari lint/scope/ci pass; ticket is ready for non-self review while
  preserving the human legal gate.

### Evidence Required

- `reports/CUE-0012-technical-report.md`
- `reports/evidence/CUE-0012/`
- Palari lint, scope-check, and CI output.

### Expansion Rules

- Stop and request human input if publication, legal approval, support contact,
  data safety answers, deletion URL, monetization, production backend, or real
  payments are required.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
