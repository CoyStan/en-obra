---
id: CUE-0025
title: Travel multi currency and collaboration readiness
status: open
risk: R3
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
  - docs/production/**
  - reports/**
  - tickets/open/CUE-0025-*
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
  - npx expo config --type public
  - ./bin/palari lint CUE-0025
target_branch: main
branch: ticket/CUE-0025
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0025
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0025 Travel multi currency and collaboration readiness

## Goal

Prepare a human-reviewed plan for travel, multi-currency, shared groups, and
backend collaboration features that competitors support.

## Scope

- Product/production docs and safe architecture planning.
- Optional local UI flags only if they do not imply real backend readiness.

## Acceptance

- Currency conversion, sync, invites, multi-device collaboration, and account
  deletion implications are documented before implementation.
- Human confirmation is obtained before implementation that affects privacy,
  financial data handling, or production infrastructure.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0025

## Ticket Completion Contract

### Non-Goals

- No live backend, no currency-rate API, no account provider, no payment rails,
  no secrets, and no Play upload.

### Definition Of Done

- A backend-ready product plan exists with blockers and decisions.

### Evidence Required

- Technical report, human confirmation if implementation proceeds, and Palari
  evidence.

### Expansion Rules

- Stop for provider, region, privacy, legal, rate-source, or credential
  decisions.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
