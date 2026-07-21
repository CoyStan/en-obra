# Company OS Workflow

Cuenta Obra uses Palari Company OS for product and engineering governance.

Use the repo-local wrapper:

```bash
./bin/company-os validate
./bin/company-os queue
./bin/company-os detail WORK-APP-0112
./bin/company-os state
```

The workspace source of truth is:

```text
company-os/workspace.json
```

Active goal: `GOAL-CUENTA-OBRA`.

Historical Cuentas Claras expense-split work is closed under
`GOAL-PREMIUM-MVP`. Do not open new expense-split feature tickets.

Local Company OS history is written under:

```text
company-os/.palari/history.jsonl
```

That history is local operating metadata and is ignored by git.

## Product And UI Authority

- Product direction: `DECISION-PRODUCT-0002` → Cuenta Obra
- UI element authority: `DECISION-UI-0001` → preferred kit in
  `dashboard/src/components/ui` (shadcn base-nova). Reconstruct Expo/tracker
  surfaces into those elements when incompatible; do not force new UI into
  legacy StyleSheet patterns.
- Better UI path queue: `WORK-APP-0112` … `WORK-APP-0118`

## Migration Boundaries

The old CUE tickets, reports, gates, roles, skills, and adapters are preserved
under:

```text
docs/legacy/palari-orchestrator/
```

Do not start new work in the old `tickets/` workflow. Create or update Company
OS work items instead.
