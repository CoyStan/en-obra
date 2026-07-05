# UI Library Adoption Architecture

Date: 2026-07-05
Status: active architecture decision
Related workplan: `docs/product/nativewind-reusables-premium-ui-workplan.md`

## Decision

Cuentas Claras will adopt a React Native equivalent of the
Tailwind/shadcn workflow:

- **NativeWind** for Tailwind-style styling in Expo and React Native Web.
- **React Native Reusables** as the primary shadcn-like source for copied,
  locally owned React Native components.
- **RN Primitives** selectively for accessible primitive behavior such as
  labels, sheets/dialogs, select/dropdown controls, checkboxes, and related
  interaction foundations.

The migration will use a strangler pattern. Existing `StyleSheet` surfaces stay
in place until a ticket touches them. New premium UI work should move into the
new tokenized component system after the proof tickets validate the setup.

## Why This Fits Cuentas Claras

The app is an Expo/React Native product, not a React/Vite web dashboard. Web
`shadcn/ui` and Radix UI are not the right runtime layer for the Android app.
The valuable part of the original recommendation is not the exact library name;
it is the working model:

- styling close to the component being edited,
- copied components that the repo owns,
- fewer invisible global CSS conventions,
- more predictable agent edits,
- accessible primitives for hard interactions,
- fast iteration without buying a template.

NativeWind plus React Native Reusables gives the closest version of that model
for Expo.

## Product Fit

The UI system must preserve the Cuentas Claras product direction:

- Android-first and thumb-friendly.
- Spanish-first copy.
- MXN-first money display.
- Green/blue/sand LATAM trust palette with restrained warm accents.
- Low cognitive load for ordinary users.
- Local-first demo behavior.
- Clear `Sin pagos reales` boundaries near settlement and save actions.

The system exists to make the app feel more premium and coherent. It must not
turn the product into a generic shadcn clone, a dashboard template, or a heavy
banking framework.

## Library Roles

### NativeWind

Role: styling engine for new/migrated React Native components.

Use it for:

- tokenized colors, spacing, radius, and typography utilities,
- responsive/density variants where they simplify Android width handling,
- local component styling that agents can understand beside markup,
- React Native Web parity for screenshot verification.

Rules:

- The Tailwind config must map to Cuentas Claras tokens.
- Do not create a separate visual language inside Tailwind.
- Avoid raw hex values in components.
- Keep one-off geometry rare and documented.

### React Native Reusables

Role: copy-owned component source and pattern reference.

Use it for:

- button,
- card/surface,
- input,
- sheet/dialog,
- select/dropdown-like controls where suitable,
- checkbox/switch-like interactions,
- list-row foundations.

Rules:

- Components copied into this repo become Cuentas Claras components, not vendor
  black boxes.
- Rename/adapt components into product language when useful.
- Remove default styling that looks generic or obviously template-like.
- Keep accessibility and keyboard/focus behavior intact.

### RN Primitives

Role: primitive behavior layer for accessibility and composition.

Use it when a component needs behavior that is easy to get subtly wrong:

- labels and form associations,
- dialog/sheet semantics,
- checkbox state,
- accessible select/list controls,
- portals/overlays where supported.

Rules:

- Use primitives surgically.
- Do not import a primitive if a simple React Native `Pressable`, `TextInput`,
  or `Modal` is clearer and already accessible enough for the ticket.

### gluestack-ui

Role: reference and fallback, not default architecture.

Consider gluestack only when:

- a specific primitive or pattern is meaningfully more complete than the
  Reusables/RN Primitives option,
- it can be copied/adapted without importing a broad vendor look,
- the ticket documents why it was chosen,
- checks prove bundle/export/test health.

Do not use gluestack to replace the entire design system unless a future proof
ticket shows NativeWind/Reusables cannot support a required flow.

### Tamagui

Role: deferred architecture alternative.

Tamagui is powerful, but it is a larger architectural commitment than this app
needs right now. Defer it unless:

- NativeWind/Reusables cannot satisfy native/web parity,
- performance or theming becomes blocked,
- the founder explicitly approves a larger architecture migration.

If Tamagui becomes necessary, create a separate architecture decision and proof
ticket before changing production screens.

## Migration Shape

### Phase 1: Proof

1. Install and wire NativeWind.
2. Bridge `src/theme/theme.ts` values into Tailwind tokens.
3. Add a small copied component set.
4. Prove one small surface can render using `className` and copied components.
5. Keep all app checks green.

### Phase 2: Component System

Build premium Cuentas Claras components:

- `Button` / `IconButton`,
- `Pill`,
- `Avatar`,
- `Amount`,
- `Surface` / `Card`,
- `ListRow`,
- `MoneyRail`,
- `Sheet`,
- `SelectTrigger`,
- `DropdownList`,
- `TextField`,
- `AmountField`.

### Phase 3: Surface Migration

Migrate surfaces only when a ticket can deliver a coherent product improvement:

- workspace shell and bottom navigation,
- Inicio money instrument,
- add-expense receipt composer,
- Balance settlement map,
- Activity audit trail,
- Perfil identity vault.

### Phase 4: Cleanup

Remove old `StyleSheet` entries only when the migrated code no longer uses
them. Do not perform broad cleanup unrelated to the active ticket.

## Token Contract

The new Tailwind/NativeWind theme should expose existing product tokens:

- `ink`,
- `mutedInk`,
- `canvas`,
- `surface`,
- `surfaceStrong`,
- `surfaceTinted`,
- `primary`,
- `primaryDark`,
- `accentBlue`,
- `terracotta`,
- `marigold`,
- `due`,
- `border`,
- `successWash`,
- `blueWash`,
- `dueWash`,
- `warmWash`,
- `shadow`.

Radius, spacing, and typography should also come from the existing theme rather
than inventing parallel values.

## Verification

Every adoption/migration ticket should run the relevant subset of:

```bash
npm run typecheck
npm test
npx expo config --type public
npm run export:web
./bin/company-os scope WORK-APP-XXXX
./bin/company-os validate
```

Visual tickets must capture Android-width screenshots at:

- `360x740`
- `390x844`
- `412x915`

## Boundaries

This architecture decision does not authorize:

- real payments,
- production backend,
- production auth,
- secrets or API keys,
- paid services,
- production deployment,
- Play Store submission,
- legal/privacy adoption,
- destructive git commands.

## Success Criteria

The adoption is successful when new UI tickets are faster, more consistent, and
less likely to drift than the current large `StyleSheet` approach, while the
app remains original, premium, Android-first, Spanish-first, and honest about
local-only/no-real-payments behavior.

