# Cuentas Claras

Cuentas Claras is an Android-first, Spanish-first expense sharing app for
Mexico/LATAM. It is built with Expo, React Native, and TypeScript.

The app is local-first for the current MVP: demo users, groups, shared expenses,
balances, and settlement language are local/mock behavior. There are no real
payments, no production backend secrets, and no paid service dependencies in the
repo.

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
