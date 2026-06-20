# Cuentas Claras Premium Android Goal

Use this document as the next large Codex goal for Cuentas Claras. Continue
through the Palari ticket structure. Do not bypass Palari review, scope checks,
technical reports, or evidence. Do not self-accept tickets unless the founder
explicitly authorizes it for the current ticket.

## Reference Images

The target visual direction is based on three generated Android concepts saved
in this folder:

- `concept-10.png`: primary north star. Use its structure, premium fintech
  polish, clean hierarchy, green/blue/sand palette, and clear balance module.
- `concept-02.png`: warmth reference. Borrow its friendly sand background,
  approachable language, lighter spacing, and softer consumer feel.
- `concept-04.png`: simplicity reference. Borrow its low-clutter list-first
  layout, reduced card weight, minimal separators, and easy scan pattern.

The desired result is not a literal copy of one image. Build the app so it feels
like `concept-10` with the warmth of `concept-02` and the simplicity of
`concept-04`.

## Product Vision

Cuentas Claras should feel like a premium, trustworthy, Android-first consumer
finance app for Mexico and LATAM. It should be Spanish-first, calm, direct, and
obvious. A new user should understand in a few seconds:

- who they are using the app as,
- what group they are viewing,
- whether they owe money or should receive money,
- who owes whom,
- what action they should take next,
- that amounts are in MXN,
- that this is local/demo behavior with no real payments.

The product must not feel like a prototype, a dense dashboard, a generic
template, or a tool where one person manages everyone else's money. It must feel
multi-user: each person has an identity, joins groups, records their own
expenses, sees their own balances, and can mark local/demo settlement records
without implying money moved inside the app.

## Audience

Design for everyday users in Mexico/LATAM who may not be financially or
technically confident. Use plain Spanish, large readable text, obvious actions,
and calm error states. The app should avoid jargon and avoid making users
interpret accounting concepts.

Preferred language examples:

- `Tú eres Ana`
- `Tu balance`
- `Te deben MXN 1,250`
- `Debes MXN 310`
- `Diego te debe MXN 430`
- `Paga fuera de la app`
- `Sin pagos reales`
- `Registro local`
- `Agregar gasto`
- `Quién participa`
- `Dividido en partes iguales`

Avoid:

- vague finance jargon,
- English labels,
- bank-transfer language,
- payment processor wording,
- scary legal copy in primary flows,
- long helper paragraphs.

## Visual Direction

The app should feel Stripe-grade in clarity and polish, but not Stripe-branded.
Use a Mexican green / blue trust palette with a warm sand canvas. Purple may be
used only as a small accent, never as the dominant brand color.

### Palette Intent

- Primary trust/action: bandera green or refined emerald.
- Finance/status: deep teal and clear blue.
- Canvas: warm white or very light sand.
- Surface: white with very subtle mint or blue tint when needed.
- Debt/attention: restrained coral or terracotta.
- Accent: small lavender/purple only for tags or focus states.
- Text: near-black/navy for primary copy, muted blue-gray for secondary copy.

Avoid a one-note palette. Do not make the app all green, all blue, all sand, or
all purple. Avoid heavy gradients, decorative blobs, glass effects that reduce
readability, dark banking themes, and generic crypto/fintech styling.

### Layout Principles

- Android-first. Favor Material-style app bars, bottom navigation, sheets,
  segmented controls, chips, and clear touch targets.
- First screen must be useful, not a marketing page.
- Start with identity, group, personal balance, and next action.
- Use fewer heavy cards. Prefer clean sections, list rows, subtle dividers, and
  one strong balance module.
- Preserve content while lowering visual weight.
- Use whitespace to separate ideas, not decorative containers.
- Keep the main amount large and calm.
- Keep primary actions obvious and close to the context.
- Never hide the no-real-payments boundary near settlement actions.
- Do not use visible tutorial text to explain the UI unless the state truly
  needs guidance.

### First Viewport Requirements

On common Android sizes around 360x740, 390x844, and 412x915, the first viewport
should show:

- `Cuentas Claras` or equivalent app identity,
- active local user,
- selected group,
- personal balance,
- one clear next action,
- one who-owes-whom cue or settlement cue,
- MXN cue,
- `Sin pagos reales` or equivalent local/demo trust cue.

If the first viewport feels crowded, reduce visual decoration and copy weight.
Do not remove core information unless it is moved to a clearly adjacent tab or
sheet.

## Core Product Requirements

The polished app should support and clearly present:

- create groups,
- join/select groups as a specific user,
- add members,
- choose local account identity,
- add shared expenses,
- choose payer,
- choose participants,
- split expenses equally by default,
- use MXN as the default visible currency,
- show personal balance,
- show who owes whom,
- mark local/demo settlement records as paid,
- show group activity/history,
- reset local demo data,
- handle empty/loading/error states professionally,
- work offline/local-first for the demo.

Do not implement real payments. Do not imply that pressing a button sends money.
Do not add production backend secrets, payment rails, push services, or paid
external services without explicit founder approval.

## Multi-User Model

The app must stop feeling like a single finance manager controls the group.
Every major flow should reinforce that the user is acting as themselves.

Required model behavior:

- A local user identity exists before recording expenses or settlements.
- The active user can switch identity in demo/local mode.
- Expense creation says who is paying and who participates.
- Balance language is personal: `te deben`, `debes`, `en paz`.
- Settlement actions are personal and local.
- Guest/no-identity states guide the user to choose or create an identity before
  taking money-affecting actions.

The UX should make it easy to understand:

- "This is my account."
- "This is my group."
- "This is my balance."
- "This is what I can do next."

## Data And SQL-Ready Model

Keep the current local-first demo behavior, but evolve the data model so it is
ready for a later SQLite or backend sync layer. The app should be able to move
from local in-memory/storage data to SQL-backed persistence without rewriting
the product model.

Target entities:

- `users`
  - `id`
  - `display_name`
  - `phone_or_email` optional/local placeholder only
  - `avatar_color`
  - `created_at`
  - `updated_at`
  - `deleted_at` optional

- `groups`
  - `id`
  - `name`
  - `currency_code`
  - `created_by_user_id`
  - `created_at`
  - `updated_at`
  - `archived_at` optional

- `group_members`
  - `id`
  - `group_id`
  - `user_id`
  - `display_name_snapshot`
  - `role`
  - `joined_at`
  - `left_at` optional

- `expenses`
  - `id`
  - `group_id`
  - `title`
  - `amount_cents`
  - `currency_code`
  - `paid_by_member_id`
  - `created_by_user_id`
  - `category_id` optional
  - `note` optional
  - `expense_date`
  - `created_at`
  - `updated_at`
  - `deleted_at` optional

- `expense_participants`
  - `id`
  - `expense_id`
  - `member_id`
  - `share_method`
  - `share_cents`
  - `created_at`

- `settlements`
  - `id`
  - `group_id`
  - `from_member_id`
  - `to_member_id`
  - `amount_cents`
  - `currency_code`
  - `status`
  - `recorded_by_user_id`
  - `recorded_at`
  - `note` optional

- `activity_events`
  - `id`
  - `group_id`
  - `actor_user_id`
  - `event_type`
  - `entity_type`
  - `entity_id`
  - `summary`
  - `created_at`

- `sync_outbox`
  - `id`
  - `operation`
  - `entity_type`
  - `entity_id`
  - `payload_json`
  - `status`
  - `attempt_count`
  - `created_at`
  - `last_attempt_at`

Rules:

- Store money as integer cents.
- Keep currency visible as `MXN`.
- Use append-friendly activity and settlement records.
- Avoid lossy derived-only state for balances.
- Keep balance calculations deterministic and tested.
- Prepare for future SQLite, but do not require production backend now.

## Demo Data

Demo data should feel realistic for Mexico/LATAM and should help users
understand the app immediately.

Include examples such as:

- `Viaje a Oaxaca`
- `Casa Roma Norte`
- `Renta compartida`
- `Comida familiar`
- `Oficina`
- people such as Ana, Diego, Sofía, Luis, Maru, Carlos, Nora, Raúl
- expenses such as tacos, súper, gasolina, Airbnb, renta, café, transporte,
  cena, limpieza

Demo data should include:

- at least two groups,
- at least four users/members in one group,
- multiple expenses with different payers,
- a paid local settlement record,
- one group that is almost settled or fully settled,
- enough activity to show the audit trail,
- no private real personal data.

## UX Flows To Polish

### First Run

- User sees a light, premium screen with app name, local/demo state, and a clear
  path to choose a demo identity.
- Avoid an empty app that looks broken.
- Make `Usar demo` or equivalent obvious but not cheesy.

### Group Overview

- Show group name, active user, personal balance, and next action.
- Avoid dense metric grids.
- Use the most important settlement suggestion first.
- Keep secondary details scrollable but well organized.

### Add Expense

- Use a bottom sheet or full-height Android-friendly sheet.
- Start with concept/title, amount, payer, and participants.
- Default to equal split.
- Show `MXN`.
- Use clear validation in Spanish.
- Keep Save/Add button reachable with keyboard open.

### Settlement

- Use personal copy.
- Require local identity.
- Confirm before marking paid.
- State clearly: no real payment occurs.
- Activity should record settlement as a local record.

### Activity

- Make activity a trust trail.
- Show who did what, amount, date, and whether it was an expense or local
  settlement.
- Keep rows readable and not overdecorated.

### Account And Settings

- Explain local/demo account state.
- Show data reset/delete affordance.
- Keep privacy/security copy calm and brief.
- Do not overpromise production sync.

## Accessibility And Low Cognitive Load

Requirements:

- Minimum practical touch target around 44-48 px.
- Clear contrast for text, amounts, buttons, and state colors.
- Avoid tiny financial disclaimers.
- Avoid relying on color alone for debt/receive state.
- Large amounts should not wrap awkwardly.
- Labels must fit on 360 px Android width.
- Empty states must include a next action.
- Error states must say what happened and what to try next.
- Loading states should feel intentional, not blank.

Plain-language rules:

- Prefer one short line over two clever lines.
- Use verbs: `Agregar`, `Elegir`, `Confirmar`, `Cancelar`.
- Put the money result before explanation.
- Put helper copy near the action it explains.

## Android Quality Bar

The app should be tested and tuned as an Android-first app, not merely a web
preview.

Expected work:

- Verify Expo config.
- Verify Android package metadata and assets.
- Verify icon and splash quality.
- Run Android build readiness checks where local tooling allows.
- Test on multiple viewport sizes:
  - 360x740
  - 390x844
  - 412x915
  - at least one taller Android size if possible
- Capture screenshots after meaningful visual tickets.
- Check keyboard behavior on add-expense and identity forms.
- Check bottom sheets and modals for overflow.
- Check that bottom navigation remains usable.
- Check that text does not overlap, truncate badly, or become unreadable.

If a real Android emulator or release build cannot run locally, document the
blocker and still run available Expo/web/static verification.

## Testing Expectations

Each implementation ticket should run the most relevant checks for its scope.
For broad UI/data work, expected checks include:

- `npm run typecheck`
- `npm test`
- `npx expo config --type public`
- Palari `report-lint`
- Palari `lint`
- Palari `scope-check`
- Palari `ci`
- screenshot evidence for visual changes

Add or update tests when changing:

- money parsing/formatting,
- split math,
- settlement simplification,
- identity gating,
- local account behavior,
- sync adapters,
- storage/data deletion,
- validation rules.

## Play Store Readiness Direction

The app should become close to Play Store internal testing readiness, but do not
perform production deployment without founder action.

Prepare:

- Android app icon,
- adaptive icon,
- splash,
- store screenshots,
- feature graphic direction,
- internal testing checklist,
- privacy policy draft,
- terms draft,
- data safety notes,
- deletion model,
- release build notes,
- known limitations.

Human/founder gates remain required for:

- Google Play account,
- signing credentials,
- production EAS credentials,
- published privacy/terms URL,
- legal/compliance approval,
- real backend or payment decisions.

## Security And Privacy Boundaries

Until production decisions are approved:

- No real payment rails.
- No production secrets.
- No paid APIs.
- No real backend writes.
- No sensitive personal data in demo fixtures.
- Local data deletion must be clear and testable.
- Any future sync adapter must keep replaceable interfaces.

## Palari Execution Requirements

Continue one ticket at a time. For each ticket:

1. Use Palari status/audit as authority.
2. Create or choose a scoped ticket.
3. Claim the ticket.
4. Work only in allowed paths.
5. Write or update product decisions when making founder/product choices.
6. Implement the narrowest meaningful improvement toward this goal.
7. Run relevant verification.
8. Capture screenshot evidence for visual work.
9. Write a technical report.
10. Route or write fresh-context reviewer notes when required.
11. Run Palari gates.
12. Move the ticket to review.
13. Do not self-accept unless explicitly authorized.

Prioritize tickets that most improve:

- first-screen clarity,
- visual lightness,
- personal/multi-user model,
- add-expense comprehension,
- settlement trust,
- Android release confidence,
- data model readiness.

## Suggested Ticket Sequence

1. Premium shell simplification:
   Reduce heavy surfaces, align the main screen to concept 10/2/4, and improve
   first-viewport scan.

2. SQL-ready local model plan:
   Document and/or introduce a local persistence model that can later map to
   SQLite without changing product behavior.

3. Multi-user group membership pass:
   Make active identity, group membership, and permissions clearer throughout
   the app.

4. Add expense sheet refinement:
   Make payer, participants, amount, MXN, and equal split obvious with less
   visual weight.

5. Settlement trust refinement:
   Make personal settlement language and no-real-payment boundaries clearer and
   lighter.

6. Activity trust trail refinement:
   Make activity rows easier to scan and more audit-like without feeling dense.

7. Android viewport QA:
   Verify 360/390/412 px screens, keyboard states, bottom nav, and screenshots.

8. Play Store internal testing readiness:
   Review icon, splash, store assets, privacy/terms, data safety, and build
   readiness gaps.

9. Competitor feature map completion:
   Finish the Splitwise/Tricount/Settle Up/Splid/etc. feature inventory and
   rank now/next/later/backend-only.

10. Final founder review package:
    Create a single review report with screenshots, passed checks, known
    limitations, demo-only boundaries, and next release blockers.

## Definition Of Success

The redesign is successful when a founder can open the app on Android and say:

- it looks premium and trustworthy,
- it feels lighter and less cluttered,
- it is obvious who the current user is,
- it is obvious which group is active,
- it is obvious whether the user owes or is owed,
- it is obvious who owes whom,
- it is obvious how to add an expense,
- it is obvious that settlements are local records and not real payments,
- the app feels ready for serious internal testing rather than a prototype.

Do not mark the larger redesign goal complete until current evidence proves
those outcomes across the app, tests pass, Palari tickets are in review or
accepted according to the project protocol, and no obvious unblocked polish or
release-readiness tickets remain.
