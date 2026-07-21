# En Obra

**En Obra** (formerly Cuenta Obra) is an Android-first, Spanish-first tracker for
very small service businesses in Mexico/LATAM. A provider records the materials
for a job, keeps a simple supplier log, and previews the safe update the
provider can send the client about what has been ordered and received.

The current MVP is local-first. It includes demo project data, quick work/client
and supplier setup, material status tracking, supplier contact handoff to
WhatsApp, and a client-safe progress preview. It never processes payments or
shows internal costs. A real client link needs the authenticated backend listed
in the launch contract. There are no production backend secrets or paid service
dependencies in the repo.

## App Development

```bash
npm install
npm run typecheck
npm test
npx expo config --type public
npx expo start
```

## Company OS

This repo uses Palari Company OS for product and engineering governance.

```bash
./bin/company-os validate
./bin/company-os queue
./bin/company-os detail WORK-APP-0001
./bin/company-os state
```

The workspace lives at:

```text
company-os/workspace.json
```

Legacy Palari Orchestrator tickets and evidence were archived under:

```text
docs/legacy/palari-orchestrator/
```

Do not use the old CUE ticket/worktree workflow for new work.
