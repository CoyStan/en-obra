# Cuentas Claras UI Component System

Date: 2026-07-05
Status: active guide
Related docs:

- `docs/product/ui-library-adoption.md`
- `docs/product/nativewind-reusables-premium-ui-workplan.md`
- `docs/product/design-system.md`
- `docs/product/visual-direction.md`

## Purpose

This guide defines how future agents should build UI in Cuentas Claras after
the NativeWind/Reusables adoption begins. The goal is not to chase a library
aesthetic. The goal is to make the app more premium, coherent, Android-first,
and easier for agents to modify without style drift.

## Source Of Truth

Use this order of authority:

1. Product behavior and local-first constraints in the app code.
2. Product/design decisions in `docs/product/decisions.md`.
3. Visual direction in `docs/product/design-system.md` and
   `docs/product/visual-direction.md`.
4. Shared tokens in `src/theme/tokens.json`.
5. NativeWind utilities exposed by `tailwind.config.js`.
6. Component implementations in `src/components/reusables/`.

If these disagree, fix the disagreement in a scoped ticket instead of inventing
a one-off style.

## Current Component Paths

### Existing Legacy Components

Path: `src/components/ui.tsx`

Use for existing screens that have not been migrated yet. Do not churn stable
legacy surfaces just to replace imports.

### New Reusables-Style Components

Path: `src/components/reusables/`

Current proof components:

- `Button`
- `Card`
- `Input`
- `cn`

Future production components should live here unless they are tied to a single
screen and not reusable.

### NativeWind Proof Components

Path: `src/components/nativewind/`

This path is for setup/proof components only. Do not build product UI here.
Proof components should remain hidden and can be removed during cleanup once
the migrated production surfaces prove NativeWind is exercised.

## Naming Rules

Use product names when a component is domain-specific:

- `AmountField`
- `MoneyRail`
- `SettlementRoute`
- `PersonRow`
- `GroupRow`
- `ActivityAuditRow`
- `ReceiptComposer`
- `LocalTrustChip`

Use generic names only for cross-product primitives:

- `Button`
- `Card`
- `Input`
- `Sheet`
- `Select`
- `ListRow`
- `Pill`
- `Avatar`

Avoid names that describe implementation instead of purpose, such as
`GreenCard`, `BigBox`, `FancyPanel`, or `Container2`.

## Token Rules

Use `src/theme/tokens.json` as the shared token source.

Use NativeWind classes from `tailwind.config.js` in new/migrated components:

- color: `bg-primary`, `text-primary-dark`, `border-border`,
  `bg-success-wash`, `text-due`
- radius: `rounded-ccSm`, `rounded-ccMd`, `rounded-ccLg`
- spacing: `p-ccMd`, `gap-ccSm`, `px-ccMd`
- type: `text-ccBody`, `text-ccSmall`, `text-ccMicro`

Do not add raw hex colors to components. If a new color is truly needed, add it
to `src/theme/tokens.json`, map it in `tailwind.config.js`, and record the
decision.

Avoid arbitrary pixel classes unless they represent genuine geometry that does
not belong in the token scale, such as a 1 px divider, a circular avatar size,
or a fixed icon affordance. Prefer tokens first.

## Variant Rules

Variants should be semantic:

- `primary`
- `secondary`
- `ghost`
- `danger`
- `success`
- `due`
- `neutral`

Avoid visual-only variants such as `green`, `blue`, `big`, or `rounded`.

Each variant must have:

- readable text contrast,
- a pressed/disabled state where interactive,
- 44 px minimum touch height for controls,
- text labels in addition to color for money state.

## Migration Rules

Use a strangler migration:

1. Choose one ticket and one coherent surface.
2. Keep old `StyleSheet` code in place unless it is no longer referenced.
3. Build or extend the smallest useful reusable primitive.
4. Use the primitive in the target surface.
5. Capture Android-width screenshots.
6. Remove only the styles made unused by the same ticket.

Do not run a large "convert every StyleSheet to Tailwind" rewrite. That creates
review risk and usually makes the product worse before it gets better.

## Screen Migration Order

Preferred order:

1. Small proof/empty/loading/error surface.
2. Workspace shell and bottom navigation.
3. Inicio money instrument.
4. Add-expense receipt composer.
5. Balance settlement map.
6. Activity audit trail.
7. Perfil identity vault.
8. Cleanup and evidence packet.

## Primitive Source Rules

### NativeWind

Use for styling new components. Keep class lists readable. If a component's
class list becomes hard to scan, extract a local variant map.

### React Native Reusables

Use as a pattern source. Copy/adapt components into `src/components/reusables/`
instead of treating them as untouchable vendor code.

### RN Primitives

Use when behavior matters:

- sheet/dialog semantics,
- select/dropdown behavior,
- checkbox state,
- labels and form association,
- portal/overlay behavior.

Do not install RN Primitives for simple display rows or buttons unless a
specific behavior requires it.

### gluestack-ui

Use only as a fallback pattern source when a component is clearly better than
the Reusables/RN Primitives path. Document the reason in the ticket report.

### Tamagui

Do not introduce Tamagui in a normal UI ticket. It requires a separate
architecture proof and founder approval because it changes the app architecture
more deeply.

## Accessibility Rules

Every migrated interactive component needs:

- `accessibilityRole` where appropriate,
- `accessibilityState` for disabled/selected/checked/expanded state,
- minimum 44 px touch target,
- readable text contrast,
- visible state beyond color alone,
- Spanish labels that match the action.

Money components must include currency text such as `MXN`, not only `$`.

## Verification Requirements

Every UI migration ticket must run:

```bash
npm run typecheck
npm test
npx expo config --type public
npm run export:web
./bin/company-os scope WORK-APP-XXXX
./bin/company-os validate
```

Visual tickets must also capture screenshots at:

- `360x740`
- `390x844`
- `412x915`

Use a static export preview unless the ticket specifically needs Expo dev
server behavior:

```bash
python3 -m http.server 49738 --bind 127.0.0.1 --directory dist
```

## Anti-Drift Checklist

Before finishing a UI ticket, confirm:

- No generic dashboard/template look was introduced.
- No new raw color palette was invented.
- `Sin pagos reales` remains near settlement/save/payment-like actions.
- Active user and selected group context remain clear.
- MXN is visible near money.
- Text is not smaller than the app's established readable scale.
- New components use tokens or documented geometry.
- Old styles were removed only when proven unused.
- Screenshots show no overlap or clipped text at Android widths.

## Boundaries

This component system does not authorize:

- real payments,
- production backend,
- production auth,
- secrets,
- paid APIs,
- deployment,
- Play Store submission,
- legal/privacy adoption,
- destructive git commands.

