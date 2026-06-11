# Cuentas Claras Design System Note

## Principles

- Calm financial clarity: balances and next actions are always obvious.
- Android-first utility: dense enough for repeated use, never a marketing page.
- Spanish-first warmth: direct copy, familiar contexts, and no bank-like jargon
  when the app is only tracking shared expenses.
- Trust through evidence: activity trail, settlement state, and MXN labels are
  visible near money actions.

## Visual Direction

- Direction: Style 1 trustworthy fintech minimal as the base, warmed by Style 2
  Mexico/LATAM accents, and structured through Style 3 Android-native Material
  patterns.
- Background: cool near-white neutral canvas with white cards and hairline
  borders.
- Primary: agave/teal for brand, navigation, receive states, and primary
  actions.
- Secondary interaction: restrained Android blue for selected controls and
  small affordances.
- Warmth: terracotta and marigold appear only in small context accents, chips,
  icons, or debt-related scan points. They should never turn the app into a
  beige/brown or folk-art theme.
- Debt/error: restrained red only for negative balances and validation errors.
- Demo/legal disclaimers: neutral gray chips, not highlight colors.
- Avoid decorative accent rotation. Color should clarify state, trust, or
  localized context.

Suggested palette:

- Ink: `#102A2F`
- Muted ink: `#62717C`
- Canvas: `#F4F7F6`
- Surface: `#FFFFFF`
- Surface strong: `#F8FAF9`
- Surface tinted: `#EAF7F3`
- Primary agave: `#0F766E`
- Primary deep: `#0B4F4A`
- Android blue accent: `#1D5FD6`
- Warm terracotta: `#C9552D`
- Warm marigold: `#E4A11B`
- Due red: `#C83A3A`
- Border: `#DCE6E3`

## Typography

- Use system fonts for Android reliability.
- Screen titles: 24 px, bold only where needed.
- Section headings: 16-18 px, semibold.
- Body: 14-16 px.
- Metadata: 12-13 px with sufficient contrast.
- Prefer 400-600 weights for normal copy; reserve 700 for screen titles,
  section headings, and emphasized amounts.
- No negative letter spacing.
- Do not scale font size directly with viewport width.

## Layout

- Bottom navigation on mobile with three main tabs.
- Fixed-height touch controls, minimum 44 px.
- Keep icon buttons and avatar affordances compact; most icons should be 16-20
  px with 32-40 px containers.
- Cards only for repeated items or framed tools; avoid cards inside cards.
- Dashboard sections use full-width surfaces and tight hierarchy rather than
  decorative hero sections.
- First viewport should expose active group identity, receive/pay balance,
  quick actions, and settlement suggestion before activity begins.
- Primary action should be reachable in the first viewport.
- Use Material-style segmented controls, chips, and action rails for group-level
  controls instead of large explanatory panels.
- Use stable dimensions for balance chips, tab buttons, and amount rows to avoid
  layout jumps.

## Components

- Active group module: group name, description, member count, member chips, MXN
  local chip, and compact utility actions.
- Balance summary card: two-column "Te deben" / "Debes" scan, tabular amounts,
  MXN labels, and positive/negative text labels.
- Quick action rail: primary `Agregar gasto`, secondary `Integrante`, and local
  settlement affordance with nearby `Sin pagos reales`.
- Group cards: show aggregate stats plus the top debtor/creditor preview when a
  group has an open balance.
- Member balance rows: avatar swatch, name, net amount, status label.
- Settlement row: from -> to, amount, "Marcar como pagado" action, prominent
  "Sin pagos reales" chip, and a confirmation dialog before local state changes.
- Activity row: icon, title, subtitle, amount, timestamp.
- Forms: compact labels, helper/error text, native-friendly inputs, clear save
  and cancel actions. Expense/member forms should use bottom sheets instead of
  pushing balances and settlements down the main scroll.
- Perfil state: show demo/local/sync status as short chips, not long paragraphs.
- Member avatars use agave, slate, blue, and restrained warm accents to support
  recognition without turning the screen into a multicolor dashboard.

## Copy Rules

- Use "gasto", "grupo", "integrante", "balance", "arreglo", "pagado".
- Use "Sin pagos reales" near settlement actions.
- Use "Perfil" for local identity; avoid "Cuenta" when no real account provider
  exists.
- Prefer "Integrante" over generic "Miembro" in creation actions.
- Use proper Spanish accents in visible copy.
- Avoid long onboarding text in the app UI.
- Empty states should be short and action-oriented.

## Accessibility

- Contrast: AA target for text on surfaces.
- Touch: 44 px minimum.
- Focus: press states must be visible.
- State: color plus text labels for due/receive/even states.
- Amounts: include currency text, not only symbols.
- Amounts should use tabular numerals for easier scanning.
