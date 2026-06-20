---
id: CUE-0011
title: App icon splash and store assets
status: accepted
risk: R2
priority: P1
stream: design
claimed_by: codex
claimed_at: 2026-06-10T18:32:41Z
claim_ref: refs/palari/claims/CUE-0011
claim_heartbeat_at: 2026-06-11T22:01:45Z
claim_expires_at: 2026-06-11T22:06:45Z
allowed_paths:
  - assets/**
  - app.json
  - docs/production/store-assets.md
  - docs/product/decisions.md
  - reports/**
  - tickets/open/CUE-0011-*
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
  - test -f assets/icon.png
  - test -f assets/splash.png
  - test -f assets/store/feature-graphic.png
  - npx expo config --type public
  - ./bin/palari lint CUE-0011
target_branch: main
branch: ticket/CUE-0011
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0011
accepted_by: founder
accepted_at: 2026-06-11T22:01:45Z
created: 2026-06-10
updated: 2026-06-11
---

# CUE-0011 App icon splash and store assets

## Goal

State the result this ticket should produce.

## Scope

List what may change.

## Acceptance

- The scoped result exists.
- Path and risk rules are respected.

## Verification

- test -f assets/icon.png
- test -f assets/splash.png
- test -f assets/store/feature-graphic.png
- npx expo config --type public
- ./bin/palari lint CUE-0011

## Ticket Completion Contract

### Non-Goals

- Nearby work this ticket must not absorb.

### Definition Of Done

- Concrete done condition.

### Evidence Required

- Report, command, review, screenshot, or manual check to inspect.

### Expansion Rules

- Stop if scope, risk, or authority changes.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
