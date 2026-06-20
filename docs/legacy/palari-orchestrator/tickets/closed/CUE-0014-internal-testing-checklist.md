---
id: CUE-0014
title: Internal testing checklist
status: accepted
risk: R2
priority: P0
stream: release
claimed_by: codex
claimed_at: 2026-06-10T19:44:00Z
claim_ref: refs/palari/claims/CUE-0014
claim_heartbeat_at: 2026-06-11T22:01:38Z
claim_expires_at: 2026-06-11T22:06:38Z
allowed_paths:
  - docs/production/internal-testing-checklist.md
  - docs/product/decisions.md
  - reports/**
  - tickets/open/CUE-0014-*
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
  - test -f docs/production/internal-testing-checklist.md
  - ./bin/palari lint CUE-0014
target_branch: main
branch: ticket/CUE-0014
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0014
accepted_by: founder
accepted_at: 2026-06-11T22:01:39Z
created: 2026-06-10
updated: 2026-06-11
---

# CUE-0014 Internal testing checklist

## Goal

Create a Google Play internal-testing checklist that separates local repository
readiness from human-owned Play Console, signing, legal/privacy, tester, and
upload authority.

## Scope

- Internal testing checklist documentation.
- Decision log entry for local readiness versus upload authority.
- Technical report, reviewer note, evidence, and ticket metadata.

## Acceptance

- `docs/production/internal-testing-checklist.md` exists.
- Checklist covers local verification, assets, Play prerequisites, build path,
  smoke testing, tester feedback, demo-only boundaries, exit criteria, and
  upload blockers.
- Checklist reflects current CUE-0012/CUE-0013 human gates.
- Path and risk rules are respected.

## Verification

- test -f docs/production/internal-testing-checklist.md
- ./bin/palari lint CUE-0014

## Ticket Completion Contract

### Non-Goals

- No Play Console upload, tester invite, signing key, EAS login, legal approval,
  privacy URL hosting, Data Safety submission, or production deployment.

### Definition Of Done

- Checklist, decision entry, technical report, reviewer note, and CI evidence
  are present; Palari lint/scope/ci pass; upload blockers remain explicit.

### Evidence Required

- `docs/production/internal-testing-checklist.md`
- `reports/CUE-0014-technical-report.md`
- `reports/CUE-0014-reviewer-note.md`
- `reports/evidence/CUE-0014/`
- Palari lint, scope-check, and CI output.

### Expansion Rules

- Stop and request human input if Play Console upload, signing credentials,
  privacy URL, Data Safety answers, tester distribution, or production rollout
  are required.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
