# Cuentas Claras Architecture Note

## Stack Decision

Use Expo React Native with TypeScript.

Reasons:

- Fast local Android-first iteration without requiring native Android project
  scaffolding on day one.
- Expo can run on Android devices through Expo Go and on web for screenshot
  verification when an emulator is unavailable.
- TypeScript gives enough safety for money calculations and local state.
- The repo can stay simple: one app entry, local domain modules, and Palari
  governance files.

## Runtime Shape

- `App.tsx` owns the shell and wires providers.
- `src/domain/**` contains money, balance, and settlement algorithms.
- `src/data/**` contains demo data and storage adapters.
- `src/state/**` contains local app state and actions.
- `src/components/**` contains reusable Android-first UI primitives.
- `src/screens/**` contains group list, group detail, expense/member forms, and
  activity views.
- `src/theme/**` contains colors, spacing, typography, shadows, and layout
  constants.

## Local Persistence

Use `@react-native-async-storage/async-storage` for app data. Persist a single
versioned document:

```ts
type PersistedState = {
  version: 1;
  groups: Group[];
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  selectedGroupId: string;
};
```

If storage fails, keep the app usable in memory and show a short recoverable
error state. No secrets or production credentials are required.

## Money Rules

- Store amounts as integer cents.
- Default and only MVP currency is `MXN`.
- Parse user input into cents and reject non-positive values.
- Format display values with `Intl.NumberFormat("es-MX", { currency: "MXN" })`.
- Split equally by cents, distributing remainder cents deterministically by
  participant order.

## Balance Rules

For each group:

1. Start every member at zero.
2. For each expense, add the full amount to the payer.
3. Subtract each participant's equal share.
4. For each paid settlement, add amount to the debtor and subtract amount from
   the creditor.
5. Generate simplified suggestions by matching debtors and creditors until both
   sides are near zero.

Positive balance means "debe recibir"; negative means "debe pagar".

## Navigation

Use an internal state-based mobile shell rather than adding a navigation
framework for the MVP. The app needs three bottom tabs:

- Grupos
- Balance
- Actividad

Primary actions open in-screen panels or modal-style sections with explicit
cancel/save actions. This keeps the dependency surface small while preserving a
mobile app feel.

## Verification

- TypeScript check for app code.
- Unit tests for money splitting and settlement simplification.
- Expo web build/start smoke test.
- Browser screenshots at multiple mobile widths when local browser tooling is
  available.
- Palari scope check and CI evidence for every ticket.

## Risks

- Android emulator is not guaranteed locally because Java/Android tooling may be
  absent. Mitigation: verify through Expo web/mobile viewport and provide Android
  run commands.
- AsyncStorage behavior differs slightly on web. Mitigation: keep storage behind
  a tiny adapter and test pure domain logic separately.
