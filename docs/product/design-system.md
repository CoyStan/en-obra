# Cuentas Claras Design System Note

## Principles

- Calm financial clarity: balances and next actions are always obvious.
- Android-first utility: dense enough for repeated use, never a marketing page.
- Spanish-first warmth: direct copy, familiar contexts, and no bank-like jargon
  when the app is only tracking shared expenses.
- Trust through evidence: activity trail, settlement state, and MXN labels are
  visible near money actions.

## Visual Direction

- Background: warm off-white surfaces for readability.
- Primary: deep green for trustworthy actions and positive balances.
- Secondary: clear blue for navigation and neutral finance labels.
- Accent: coral for payment due states and gold for highlights.
- Avoid single-hue screens. Use color sparingly around information hierarchy.

Suggested palette:

- Ink: `#17211F`
- Muted ink: `#60716C`
- Canvas: `#F7F3EA`
- Surface: `#FFFFFF`
- Primary green: `#0F7B63`
- Primary dark: `#075443`
- Finance blue: `#2F5D8C`
- Due coral: `#D95F43`
- Gold: `#C58B2C`
- Border: `#DED8CB`

## Typography

- Use system fonts for Android reliability.
- Screen titles: 26-30 px, semibold/bold.
- Section headings: 16-18 px, semibold.
- Body: 14-16 px.
- Metadata: 12-13 px with sufficient contrast.
- No negative letter spacing.
- Do not scale font size directly with viewport width.

## Layout

- Bottom navigation on mobile with three main tabs.
- Fixed-height touch controls, minimum 44 px.
- Cards only for repeated items or framed tools; avoid cards inside cards.
- Dashboard sections use full-width surfaces and tight hierarchy rather than
  decorative hero sections.
- Primary action should be reachable in the first viewport.
- Use stable dimensions for balance chips, tab buttons, and amount rows to avoid
  layout jumps.

## Components

- Balance summary band: group name, total spent, open amount, and trust note.
- Member balance rows: avatar swatch, name, net amount, status label.
- Settlement row: from -> to, amount, "Marcar pagado" action, demo-only note.
- Activity row: icon, title, subtitle, amount, timestamp.
- Forms: compact labels, helper/error text, native-friendly inputs, clear save
  and cancel actions.

## Copy Rules

- Use "gasto", "grupo", "integrante", "balance", "arreglo", "pagado".
- Use "Sin pagos reales" near settlement actions.
- Avoid long onboarding text in the app UI.
- Empty states should be short and action-oriented.

## Accessibility

- Contrast: AA target for text on surfaces.
- Touch: 44 px minimum.
- Focus: press states must be visible.
- State: color plus text labels for due/receive/even states.
- Amounts: include currency text, not only symbols.
