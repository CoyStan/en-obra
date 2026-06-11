---
id: CUE-0024
title: Reminders recurring expenses and nudges
status: open
risk: R2
priority: P2
stream: app
claimed_by:
claimed_at:
claim_ref:
claim_heartbeat_at:
claim_expires_at:
allowed_paths:
  - src/**
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0024-*
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
  - ./bin/palari lint CUE-0024
target_branch: main
branch: ticket/CUE-0024
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0024
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0024 Reminders recurring expenses and nudges

## Goal

Add local reminders/recurring-expense planning inspired by competitor retention
features without push-notification infrastructure.

## Scope

- Recurring expense templates.
- Local in-app due/nudge states.
- Documentation of notification and scheduling decisions.

## Acceptance

- Users can understand repeating household/trip expenses and local nudges.
- No feature implies push notifications unless the native capability exists.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0024

## Ticket Completion Contract

### Non-Goals

- No push notification service, SMS/WhatsApp automation, payment reminders, or
  backend scheduler.

### Definition Of Done

- Repeating/nudge behavior is useful locally and clearly non-automated.

### Evidence Required

- Technical report, tests if behavior changes, screenshots, and Palari evidence.

### Expansion Rules

- Stop if scope, risk, or authority changes.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
