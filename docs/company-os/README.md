# Company OS Workflow

Cuentas Claras now uses Palari Company OS instead of the old Palari
Orchestrator ticket/worktree workflow.

Use the repo-local wrapper:

```bash
./bin/company-os validate
./bin/company-os queue
./bin/company-os detail WORK-APP-0001
./bin/company-os state
```

The workspace source of truth is:

```text
company-os/workspace.json
```

Local Company OS history is written under:

```text
company-os/.palari/history.jsonl
```

That history is local operating metadata and is ignored by git.

## Migration Boundaries

The old CUE tickets, reports, gates, roles, skills, and adapters are preserved
under:

```text
docs/legacy/palari-orchestrator/
```

Do not start new work in the old `tickets/` workflow. Create or update Company
OS work items instead.
