# Cuenta Obra Visual Direction

Updated: 2026-07-21  
Status: active (Vemos dialect)

Related: `docs/superpowers/plans/2026-07-21-vemos-feeling-transition.md`,
`docs/product/ui-component-system.md`, [palari-vemos](https://github.com/CoyStan/palari-vemos).

## Chosen Direction

Cuenta Obra keeps its **work / materials** product. The visual dialect is
**Vemos**: warm, calm Palari Labs field UI — not a cold admin dashboard and not
the rejected indigo marketing chrome.

Borrow feeling, not product:

- Warm off-white canvas, teal action, soft coral warmth
- Soft teal-tinted shadows on primary surfaces; borders for inputs/secondary
- Generous whitespace; one lifted focus card per view
- Pill primary CTAs; Quicksand-class type

Do not borrow Vemos calendar/friends flows, English lifestyle copy, or emoji icons.

## Product Feeling

- Calm and specific for one- or two-person service work in Mexico/LATAM
- Spanish-first; no CRM jargon
- Thumb-friendly; one clear next action
- Materials and client preview stay trustworthy and share-safe

## Palette (Vemos)

| Role | Hex | Token |
| --- | --- | --- |
| Canvas | `#FAF8F5` | `background` / `canvas` |
| Surface | `#FFFFFF` | `card` / `surface` |
| Ink | `#2A2C31` | `foreground` / `ink` |
| Muted | `#6B7280` | `mutedForeground` |
| Border (warm) | `#EBE5DF` | `border` |
| Primary teal | `#147A78` | `primary` |
| Primary pressed | `#0F6261` | `primaryDark` |
| Soft teal | `#E7F5F4` | `secondary` / `forestWash` |
| Coral warmth | `#F28C78` | `terracotta` / accent family |
| Soft coral | `#FFF0EC` | `accent` / `warmWash` |
| Success | `#15803D` | `success` |
| Danger | `#B42318` | `destructive` / `due` |

Rules:

- Teal for primary actions, nav emphasis, trustworthy confirmation
- Coral only for warmth and sparse accents — never as the only status cue or as owed/error
- Status washes (late / today / waiting / paid) stay semantic and labeled
- Shadows carry card lift; do not rely on harsh hairline rings for primary content

## Layout Grammar

- Root canvas is warm off-white
- Cards ~20px radius; controls ~14px; primary CTAs prefer pills
- Prefer soft shadow over hard border on content cards
- Do not nest cards inside cards
- One `shadowLift` focus region per view (e.g. attention table on Hoy)
- Keep Cuenta Obra IA: Hoy global · Proveedores shared · Trabajo activo + client preview

## Anti-Goals

- Cool hospital slate / emerald-as-default chrome
- Indigo marketing paint (`#2E2A7B`) as product primary
- Dense bento dashboards, floating metric pills, fake activity
- Copying Vemos When/Friends screens into Cuenta Obra
- Folklore kitsch or full beige/brown themes

## Close-Resemblance Checklist

- First glance: warm canvas + teal, not cool slate green
- Still a materials/work tool, not a social calendar
- Active trabajo + client name remain obvious
- Tables stay usable; warmth is chrome, not feature removal
- Founder can say: “This feels like Vemos, but it’s Cuenta Obra.”
