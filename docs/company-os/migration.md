# Palari Company OS Migration

Date: 2026-06-20

## Summary

Cuentas Claras is migrating from the old Palari Orchestrator ticket/worktree
workflow to Palari Company OS. The app source, product docs, release docs,
legal drafts, assets, and tests remain in place. Old Orchestrator material is
preserved as a legacy archive so previous reports, screenshots, and evidence
remain available without keeping the old ticket system active.

## Source Used

The requested GitHub repository was `https://github.com/CoyStan/palari-company-os`.
Anonymous HTTPS access was not available in this environment, so the migration
used the local checkout at `/home/quetza/palari-company-os`.

Local Company OS source revision used:

```text
22df9b8193db988ed2c85a22a43c6ddd0355133c
```

That checkout was ahead of its configured origin by six commits at migration
time. This is recorded as an ambiguity rather than hidden: future maintainers
should confirm whether those six commits are intended to be the authoritative
latest Company OS state before publishing this migration outside the local repo.

## What Changed

The old tracked Palari Orchestrator interface was archived under:

```text
docs/legacy/palari-orchestrator/
```

The new Company OS runtime and workspace were installed under:

```text
tools/palari-company-os/
company-os/workspace.json
bin/company-os
```

New forward workflow:

```bash
./bin/company-os validate
./bin/company-os queue
./bin/company-os detail WORK-MIGRATION-0001
./bin/company-os scope WORK-MIGRATION-0001 --changed company-os/workspace.json
```

## Legacy Archive Map

| Old path | New path |
| --- | --- |
| `tickets/` | `docs/legacy/palari-orchestrator/tickets/` |
| `reports/` | `docs/legacy/palari-orchestrator/reports/` |
| `adapters/` | `docs/legacy/palari-orchestrator/system/adapters/` |
| `contracts/` | `docs/legacy/palari-orchestrator/system/contracts/` |
| `gate/` | `docs/legacy/palari-orchestrator/system/gate/` |
| `handoffs/` | `docs/legacy/palari-orchestrator/system/handoffs/` |
| `layouts/` | `docs/legacy/palari-orchestrator/system/layouts/` |
| `lib/` | `docs/legacy/palari-orchestrator/system/lib/` |
| `roles/` | `docs/legacy/palari-orchestrator/system/roles/` |
| `skills/` | `docs/legacy/palari-orchestrator/system/skills/` |
| `templates/` | `docs/legacy/palari-orchestrator/system/templates/` |
| `schemas/` | `docs/legacy/palari-orchestrator/schemas/` |
| `examples/` | `docs/legacy/palari-orchestrator/examples/` |
| `bin/palari` | `docs/legacy/palari-orchestrator/bin/palari` |
| `scripts/palari` | `docs/legacy/palari-orchestrator/scripts/palari` |
| `palari.config.yaml` | `docs/legacy/palari-orchestrator/palari.config.yaml` |
| `.github/palari-required-checks.ruleset.json` | `docs/legacy/palari-orchestrator/github/palari-required-checks.ruleset.json` |
| `.github/workflows/palari.yml` | `docs/legacy/palari-orchestrator/github/workflows/palari.yml` |
| `AGENTS.md` | `docs/legacy/palari-orchestrator/AGENTS.md` |

The untracked generated `gate/forgegate/__pycache__/` directory was not
preserved because it was Python cache output, not source or governance history.

## Local Worktrees

The old local `.palari/worktrees/` tree was deliberately left untouched. It was
about 4.2 GB at inspection time and contains many old ticket worktrees, including
CUE branches. Deleting or pruning those worktrees would be a separate cleanup
decision because it can affect local branch inspection and recovery.

## Pre-Migration Dirty State

Before the migration, main already had unrelated dirty app/product files:

```text
docs/product/decisions.md
src/auth/localAccountAdapter.ts
src/auth/types.ts
src/auth/useAccount.ts
src/screens/MainScreen.tsx
```

Those paths are intentionally not part of the migration scope. The migration
commit should not claim them as Company OS changes.

## Product Docs Preserved As Sources

The Company OS workspace maps existing product and release context as selected
sources instead of moving it:

```text
docs/product/brief.md
docs/product/prd.md
docs/product/architecture.md
docs/product/design-system.md
docs/product/visual-direction.md
docs/product/roadmap.md
docs/product/decisions.md
docs/production/
docs/legal/
```

## Forward Operating Model

Company OS replaces small CUE tickets with larger work items and explicit
sources, Palaris, evidence, reviews, and human decisions. The initial workspace
contains:

- `WORK-MIGRATION-0001`: this migration.
- `WORK-APP-0001`: premium Android visual redesign.
- `WORK-APP-0002`: local-first user/group account model.
- `WORK-APP-0003`: Android internal testing readiness.

No product feature work was performed during the migration.
