# Cuenta Obra UI Component System

Date: 2026-07-05  
Updated: 2026-07-18  
Status: active guide (Cuenta Obra)
Related docs:

- `docs/product/cuenta-obra-ui-reconstruction-plan.md` (preferred path)
- `docs/product/cuenta-obra-ui-path.md`
- `docs/product/ui-library-adoption.md` (historical NativeWind adoption notes)
- `docs/product/nativewind-reusables-premium-ui-workplan.md` (historical)
- `docs/product/design-system.md`
- `docs/product/visual-direction.md`
- Palari Labs brand reference: https://palari.io/ (marketing site; not Expo runtime)

## Purpose

This guide defines how agents should build UI for **Cuenta Obra**. The visual
authority is the preferred kit in `dashboard/src/components/ui` (shadcn
base-nova). Expo owns NativeWind adaptations under `src/components/reusables/`.
When legacy StyleSheet or older reusables conflict with the preferred kit,
reconstruct the surface into the kit language (`DECISION-UI-0001`).

## Source Of Truth

Use this order of authority:

1. Product behavior + launch/checklist constraints in app code and Cuenta Obra docs.
2. `DECISION-PRODUCT-0002`, `DECISION-UI-0001`, and `docs/product/decisions.md`.
3. `docs/product/cuenta-obra-ui-reconstruction-plan.md`.
4. Preferred kit reference: `dashboard/src/components/ui` + `dashboard/src/index.css`.
5. Shared tokens in `src/theme/tokens.json` / `src/tracker/theme.ts` (bridged to kit).
6. NativeWind utilities in `tailwind.config.js`.
7. Owned Expo components in `src/components/reusables/` and
   `src/components/tracker/`.

If these disagree, fix the disagreement in a scoped ticket instead of inventing
a one-off style. Do not treat historical expense-split `MainScreen` StyleSheet
as visual authority.

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

## Palari Labs ↔ Cuenta Obra Token Bridge

Cuenta Obra is a Palari Labs product. Marketing ([palari.io](https://palari.io/))
and the Vemos app ([palari-vemos](https://github.com/CoyStan/palari-vemos)) set
lab *feel*; the preferred kit + `tokens.json` set *how* the app is painted.
Personalize through this bridge — not by editing primitives for one screen.

### Product vs lab identity

| Layer | Authority | Default for Cuenta Obra |
| --- | --- | --- |
| Element structure (Button/Card/Badge/Sheet variants, density) | Preferred kit (`dashboard/src/components/ui`) | Unchanged |
| App chrome colors / radii / shadows | `src/theme/tokens.json` (+ `dashboard/src/index.css`, `global.css`) | **Vemos dialect** (warm canvas + teal `#147A78`) |
| Lab marketing voice (Fraunces hero, floating dots, Pixar avatars, indigo) | palari.io | Marketing only — **not** app chrome |

Product primary follows Vemos teal on warm paper. Do **not** apply palari.io
indigo (`#2E2A7B`) as field chrome. Soft coral is warmth only; status washes
stay semantic (clay / sun / blue / success / danger).

### Allowed mappings (tokens only)

Map brand references into existing kit slots. Do not invent new primitive props
or visual-only variants (`coralButton`, `navyCard`).

| Kit / token slot | Cuenta Obra (current) | Source |
| --- | --- | --- |
| `background` / canvas | `#FAF8F5` warm off-white | Vemos `canvas` |
| `foreground` / ink | `#2A2C31` | Vemos `ink` |
| `primary` | `#147A78` teal | Vemos `primary` |
| `primaryDark` | `#0F6261` | Vemos `primaryPressed` |
| `secondary` | `#E7F5F4` | Vemos `softTeal` |
| `accent` | `#FFF0EC` | Vemos `softCoral` |
| `muted` / `mutedForeground` | `#F3EFEA` / `#6B7280` | warm mute + Vemos muted |
| `destructive` / due | `#B42318` | Vemos `danger` |
| `terracotta` / coral | `#F28C78` | Vemos coral (warmth, not owed) |
| `clay` / sun / statusBlue / success | semantic status | status only |
| `radius` | `0.875rem` (~14px control) | Vemos control; cards ~20px |
| `shadow` | teal-tinted soft/lift | Vemos `shadowSoft` / `shadowLift` |

`forest*` keys remain **aliases** of the teal primary family so tracker code
does not need a second palette.

### Reuse without editing elements

Safe without touching `src/components/reusables/*` internals:

1. Change token values in `tokens.json` and mirror into `dashboard/src/index.css`
   + NativeWind (`tailwind.config.js` / `global.css`).
2. Pick existing variants (`default` / `outline` / `secondary` / `ghost` /
   `destructive` on Button; Badge variants likewise).
3. Compose screens from Card + Button + Badge + Sheet + Field + Progress.
4. Use semantic status icons/colors from `src/tracker/presentation.ts`
   (`statusMeta`, `deliveryMeta`, `paymentMeta`) — do not hardcode hex in rows.

Needs a ticket + decision (not a silent edit):

- Switching product chrome away from Vemos dialect.
- Adding new kit slots or variants.
- Marketing-only patterns: Fraunces headlines, floating color orbs, character
  avatars as chrome, full-bleed gradient CTAs, indigo marketing primary.

### Agent rule

1. Want a different look → edit tokens (or open a ticket for a *semantic* token).
2. Want a different control look → use an existing variant.
3. Still stuck → ticket + decision; do not patch a primitive for one screen.
4. Do not copy palari.io indigo marketing chrome or Vemos product screens into
   Cuenta Obra; borrow Vemos *feeling* via tokens only unless the founder
   expands scope.

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

