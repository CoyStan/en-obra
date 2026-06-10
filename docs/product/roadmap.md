# Cuentas Claras MVP Roadmap

## Phase 0: Governance And Planning

- Adopt Palari into the app repo.
- Create planning docs and decision log.
- Create scoped implementation tickets.

Ticket: `CUE-0001`

## Phase 1: App Scaffold

- Install Expo/React Native TypeScript dependencies.
- Add app config, TypeScript config, scripts, and base source folders.
- Establish theme primitives and app shell entry.
- Verify local typecheck and Expo startup/build path.

Ticket: `CUE-0002`

## Phase 2: Domain And Local State

- Implement money parsing/formatting, equal splits, balance calculations, and
  simplified settlements.
- Add demo data for Mexico/LATAM.
- Add AsyncStorage-backed local state with reset-to-demo.
- Add focused unit tests.

Ticket: `CUE-0003`

## Phase 3: Android-First MVP Screens

- Build group list, group detail, member form, expense form, settlement list, and
  activity timeline.
- Wire all core MVP flows to local state.
- Add Spanish copy and demo-only payment language.

Ticket: `CUE-0004`

## Phase 4: Polish, Accessibility, And Verification

- Refine spacing, typography, color hierarchy, empty/error/loading states, and
  touch targets.
- Capture browser/mobile viewport evidence where tooling allows.
- Run final Palari checks and document known limitations.

Ticket: `CUE-0005`

## Follow-Up Tickets After MVP

- Optional receipt attachments stored locally.
- Optional export/share summary.
- Optional unequal split modes.
- Optional invite/collaboration model, only after a privacy and infrastructure
  decision.
- Optional real payment integration, only after legal/payment risk review.
