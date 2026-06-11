---
id: CUE-0023
title: Expense search filters and attachments
status: open
risk: R2
priority: P1
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
  - tickets/open/CUE-0023-*
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
  - ./bin/palari lint CUE-0023
target_branch: main
branch: ticket/CUE-0023
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0023
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0023 Expense search filters and attachments

## Goal

Improve expense history review through search/filtering and plan attachment
support without requiring paid OCR or uploads.

## Scope

- Local search and filters for activity/expenses.
- Attachment metadata model and UI placeholder for future local receipt photos.
- Documentation of native/media permission decisions.

## Acceptance

- Users can find old expenses by text/category/member/date where practical.
- Attachment support is clearly local/planned unless native media support is
  actually implemented.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0023

## Ticket Completion Contract

### Non-Goals

- No cloud upload, OCR, paid scanning service, or backend storage.

### Definition Of Done

- The activity/history surface becomes useful for checking old bills.

### Evidence Required

- Technical report, tests if behavior changes, screenshots, and Palari evidence.

### Expansion Rules

- Stop if scope, risk, or authority changes.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
