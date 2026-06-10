---
id: CUE-0021
title: Competitor feature map and local expense wins
status: claimed
risk: R2
priority: P0
stream: product
claimed_by: codex
claimed_at: 2026-06-10T21:05:49Z
claim_ref: refs/palari/claims/CUE-0021
claim_heartbeat_at: 2026-06-10T21:05:49Z
claim_expires_at: 2026-06-10T21:10:49Z
allowed_paths:
  - src/**
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0021-*
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
  - ./bin/palari lint CUE-0021
target_branch: main
branch: ticket/CUE-0021
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0021
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0021 Competitor feature map and local expense wins

## Goal

Map the feature set of five competitor apps, rank what Cuentas Claras should
borrow first, and implement the highest-impact local-only wins that improve
expense capture and demo credibility without backend, payments, or secrets.

## Scope

- Competitor feature map and prioritization docs.
- Local expense categories, "paid for" participant selection, category insights,
  and shareable group-summary text.
- Domain/state/UI/tests needed for those local-only features.
- Evidence and screenshots.

## Acceptance

- Five competitor apps are listed with cited feature sources.
- A feature map ranks what to include now, next, later, and backend-only.
- Expense creation lets the user choose category and participants included in
  the split.
- Group UI shows useful category insight and a summary users could share in
  WhatsApp manually.
- All behavior remains MXN/local-only and does not imply real payments.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0021

## Ticket Completion Contract

### Non-Goals

- No real backend sync, invites, payments, multi-currency conversion, receipt
  scanning, notifications, or native share-sheet dependency.
- Do not implement advanced unequal amount/percentage split math here; that is
  CUE-0022.

### Definition Of Done

- A founder can demo a more competitive local flow: add a categorized expense,
  choose who participated, see category insight, and read a clean shareable
  summary.

### Evidence Required

- Competitor feature map doc with links.
- Technical report and test evidence.
- Mobile screenshot/render evidence where possible.
- Palari scope/lint/CI evidence.

### Expansion Rules

- Stop if a selected feature requires external services, secrets, legal/payment
  decisions, push notifications, or app-store credentials.

### Final Review Gate

- Reviewer checks competitor mapping, product prioritization, local-only
  behavior, tests, and screenshots before recommending accept, reopen, or
  needs-human.
