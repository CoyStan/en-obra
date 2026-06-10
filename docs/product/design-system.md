# Cuentas Claras Design System Note

## Principles

- Calm financial clarity: balances and next actions are always obvious.
- Android-first utility: dense enough for repeated use, never a marketing page.
- Spanish-first warmth: direct copy, familiar contexts, and no bank-like jargon
  when the app is only tracking shared expenses.
- Trust through evidence: activity trail, settlement state, and MXN labels are
  visible near money actions.

## Visual Direction

- Background: cool neutral canvas with white cards and hairline borders.
- Primary: Telegram-like blue for navigation, selected states, and primary
  actions.
- Debt/error: restrained red only for negative balances and validation errors.
- Demo/legal disclaimers: neutral gray chips, not highlight colors.
- Avoid decorative accent rotation. Color should clarify state, not decorate.

Suggested palette:

- Ink: `#1F2933`
- Muted ink: `#5A6775`
- Canvas: `#F2F4F7`
- Surface: `#FFFFFF`
- Surface strong: `#F6F8FA`
- Surface tinted: `#EAF6FC`
- Primary blue: `#229ED9`
- Primary dark: `#168AC0`
- Due red: `#D94B4B`
- Border: `#DEE3EA`

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
- Primary action should be reachable in the first viewport.
- Use stable dimensions for balance chips, tab buttons, and amount rows to avoid
  layout jumps.

## Components

- Balance summary band: group name, total spent, open amount, and trust note.
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
- Member avatars use a compact blue/slate palette to support recognition
  without turning the screen into a multicolor dashboard.

## Copy Rules

- Use "gasto", "grupo", "integrante", "balance", "arreglo", "pagado".
- Use "Sin pagos reales" near settlement actions.
- Use "Perfil" for local identity; avoid "Cuenta" when no real account provider
  exists.
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
