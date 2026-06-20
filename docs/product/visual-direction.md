# Cuentas Claras Visual Direction

## Chosen Direction

Founder preference: combine the strongest product pick from generated concepts:

- Style 1 base: trustworthy fintech minimal.
- Style 2 warmth: Mexico/LATAM cues through agave, terracotta, and marigold
  accents.
- Style 3 structure: Android-native Material-style hierarchy, bottom
  navigation, segmented controls, chips, and one obvious primary action.

The app should feel like a real consumer finance utility for Mexico/LATAM, not
a generic dashboard and not a decorative travel app.

## Product Feeling

- Calm, precise, and money-safe.
- Spanish-first and locally familiar without folklore or kitsch.
- Android-native: thumb-friendly, predictable, and compact.
- Balance-first: users immediately know who owes, who receives, and what to do.
- Local/demo honest: "Sin pagos reales" and "Datos en este dispositivo" stay
  near settlement actions.

## Palette

Use a cool slate-white fintech base with warm accents in small doses.

- Ink: `#0E1B22`
- Muted ink: `#5A6B75`
- Canvas: `#F4F6F8`
- Surface: `#FFFFFF`
- Surface strong: `#F0F3F6`
- Surface tinted: `#E8EFF1`
- Primary agave: `#0E7C66`
- Primary deep: `#0A5A4A`
- Android indigo accent: `#2A4FD4`
- Warm terracotta: `#B85A3D`
- Warm marigold: `#D98E21`
- Due rose: `#B23A48`
- Border: `#DCE3E8`

Rules:

- Use agave/teal for primary navigation, receive states, and trustworthy
  confirmation.
- Use Android indigo only for selected interactive emphasis or small
  affordances, never as the whole brand.
- Use terracotta for debt and local context accents only when it improves
  scanning.
- Use marigold for tiny secondary icons/chips, not large panels.
- Keep warning/debt color distinct from decorative warmth.

## First Viewport

The first Android viewport must show:

- App name and compact utility actions.
- Active group name, description, and member count.
- A large but contained balance module with "Te deben" and "Debes" or
  equivalent positive/negative scan labels.
- Quick actions for adding an expense, adding/inviting an integrante, and
  local settlement.
- A settlement suggestion or "todo en paz" state.
- Activity preview begins before the fold on common 390x844 or 412x915 screens.

Avoid a marketing headline. The app experience itself is the first screen.

## Layout Grammar

- Root canvas is cool neutral, almost white.
- Cards use 8 px radius, 1 px hairline borders, and restrained shadow only when
  needed for native depth.
- Do not nest cards inside cards. Use divider rows inside a single section when
  grouping related data.
- Use compact section headers with icon + text when it clarifies scanning.
- Keep primary actions in a horizontal action rail or Material-style FAB
  pattern; avoid scattering large buttons.
- Bottom navigation remains persistent and Android-native.
- Use segmented controls for views inside the selected group when space allows.
- Use chips for members, split mode, local/offline status, and selected filters.

## Component Targets

### Active Group Module

- Group title and member count are prominent.
- Show short description or context.
- Member avatars/chips sit near group identity.
- MXN/local status is a small chip, not a banner.

### Balance Module

- Two-column scan: receive vs pay.
- Amounts use tabular numerals and MXN labels.
- Positive/negative states use color plus text labels.
- Include a short local trust note near settlement areas, not long explanation.

### Quick Action Rail

- `Agregar gasto` is primary.
- `Integrante` and `Liquidar localmente` are secondary.
- Settlement actions must say or sit beside `Sin pagos reales`.

### Settlement Card

- Plain Spanish: `Luis le debe a Ana`.
- Amount is visually dominant.
- Route direction is obvious through arrow icon and copy.
- `Marcar como pagado` opens the existing local confirmation flow.

### Activity Preview

- Rows show icon, concept, payer, equal split cue, date, and amount.
- Recent activity should feel like an audit trail, not a social feed.

## Anti-Goals

- No photo-heavy design that depends on remote images.
- No beige/brown full-theme palette.
- No large hero headline.
- No bank/payment implication.
- No hidden "Sin pagos reales" disclaimer.
- No large decorative pattern blocks.
- No one-note blue dashboard.

## Close-Resemblance Checklist

A future visual implementation is close to the selected direction when:

- The first screen visually resembles the Style 1 balance-first hierarchy.
- Warm Style 2 accents are visible but secondary.
- Android-native Style 3 patterns are clear in navigation, chips, controls, and
  action placement.
- A small mobile viewport shows active group, balance, actions, and settlement
  before activity begins.
- The page reads as finance/trust first, local/Mexico warmth second, demo
  honesty always.
- Text remains readable at 360 px and 412 px wide screenshots.
- No generated-reference concept has to be copied literally; the real app must
  remain data-driven and usable.
