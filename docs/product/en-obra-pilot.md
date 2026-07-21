# En Obra pilot contract

**Product:** En Obra — Android-first, Spanish-first tracker for very small service
providers in Mexico/LATAM.

**Pilot scope:** local-only, free, no cloud account, no billing, no client links.

## What the pilot is

- A provider records jobs, materials, suppliers, and statuses on-device.
- The app previews a client-safe progress update the provider can copy or send
  via WhatsApp manually.
- Demo data is available for exploration without creating an account.
- The internal Vite dashboard is a design/demo surface, not the canonical app.

## What the pilot is not

- Not a payment app, bank, or expense splitter (legacy Cuentas Claras is archived).
- Not a cloud-synced multi-device product yet.
- Not a published Play Store production release.
- Not a substitute for legal review of privacy/terms before public launch.

## Mexico-first defaults

- Spanish UI copy and MXN-friendly money formatting where shown.
- Phone numbers normalized toward E.164 for WhatsApp handoff.
- Dates stored as date-only ISO strings where applicable.

## Core loops (must work locally)

1. Create or pick a job (project).
2. Add suppliers and materials.
3. Move material status through ordered → received → used (explicit selection).
4. Preview client-safe progress and open WhatsApp with prefilled text.
5. Persist changes on-device and survive app restart.

## Storage keys

| Key | Purpose |
| --- | --- |
| `en-obra-tracker-v2` | Active user workspace envelope (schema v2) |
| `en-obra-tracker-recovery` | Raw payload preserved before migration/repair |
| `en-obra-tracker-demo-v2` | Isolated demo dataset |
| `cuenta-obra-tracker-v1` | Legacy v1 read-only migration source |

Implementation: `src/persistence/keys.ts`, `src/persistence/enObraRepository.ts`.

## Android identity (pilot)

- Display name: **En Obra**
- Slug / scheme: `en-obra` / `enobra`
- Package ID (unchanged for pilot builds): `com.cuentasclaras.app`

## Verification commands

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run verify
npm run pilot:android:check
npm run production:android:check   # expected to exit 1 until production blockers clear
```

Expo dev:

```bash
npm start                 # canonical Expo dev server
npm run dev:android
npm run dev:expo-web
npm run dev:dashboard     # internal dashboard on 0.0.0.0:8081
```

Build profiles (EAS, when credentials exist):

```bash
npm run build:android:apk   # pilot-apk
npm run build:android:aab   # play-aab internal testing
```

EAS CLI is pinned via `eas.json` (`cli.version`) and build scripts use
`npx eas-cli@16.28.0` (local `eas-cli` devDependency is avoided because
`expo-doctor` treats it as a project misconfiguration).

## Human blockers before production

- Splash/icon source SVGs and PNGs updated to En Obra; verify adaptive masks on device.
- Publish privacy policy and support URLs.
- Confirm Play Console publisher and package strategy with the founder.
- Implement backend, billing, and client links per the launch contract.
