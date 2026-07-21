# En Obra

**En Obra** is an Android-first, Spanish-first tracker for very small service
businesses in Mexico/LATAM. A provider records materials for a job, keeps a
simple supplier log, and previews the safe update they can send a client about
what has been ordered and received.

The current **pilot** is local-first and free: data stays on-device, there is no
cloud account, and WhatsApp is the handoff path for client updates. The internal
Vite dashboard is a design/demo surface — **Expo is the canonical app**.

Canonical pilot contract: [docs/product/en-obra-pilot.md](docs/product/en-obra-pilot.md)

## Setup

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run verify
```

## Development

```bash
npm start                 # Expo dev server (canonical)
npm run dev:android       # Expo on Android
npm run dev:expo-web      # Expo web
npm run dev:dashboard     # internal dashboard at 0.0.0.0:8081
```

## Release checks

```bash
npm run pilot:android:check        # local pilot readiness (should pass)
npm run production:android:check   # lists production blockers (expected exit 1)
```

## Company OS

```bash
./bin/company-os validate
./bin/company-os queue
./bin/company-os detail WORK-APP-0001
./bin/company-os state
```

Workspace: `company-os/workspace.json`

Legacy Cuentas Claras expense-split docs: `docs/legacy/cuentas-claras/`
