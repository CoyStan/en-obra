# Tricount Gap PRD And UX Simplification Brief

Date: 2026-07-06
Status: `WORK-APP-0088` draft for Company OS review

## Objective

Make Cuentas Claras credible as a consumer shared-expense app for Mexico/LATAM, not just a polished local demo. The next product phase should close the practical gaps against Tricount while preserving the app's own identity: Spanish-first, Android-first, MXN-first, local-demo safe, no real payments, and visually lighter than the current version.

## Primary User Promise

In one minute, a group should be able to:

1. Create or join a group.
2. Choose who they are in that group.
3. Add a shared expense.
4. Split it fairly.
5. See who owes whom.
6. Share a reminder or settlement message outside the app.

The app must feel like a shared social utility, not like one person managing everyone else's finances.

## Competitive Gap Summary

| Gap | Current Cuentas Claras Weakness | Target Capability |
| --- | --- | --- |
| Collaboration | Local demo mostly feels single-device. | Local/mock multi-user model with create/join group, active identity, member management, and replaceable sync seams. |
| Flexible splits | Equal split is the primary supported behavior. | Equal, exact amount, shares, include/exclude participants, integer-cent rounding. |
| Settlement sharing | Local mark-paid exists, but reminder/share behavior is thin. | WhatsApp-style share/reminder text and SPEI/CLABE helper mock without processing payments. |
| Receipt evidence | No user-facing receipt attachment placeholder. | Local/mock receipt attachment slot visible in expense and activity history. |
| Search/export | Activity is visible but not operationally searchable/exportable. | Search/filter and CSV/text export-ready group summary. |
| UX simplicity | Too many labels, panels, cards, and trust messages compete. | One primary answer per screen, progressive disclosure, lighter surfaces, lists over cards. |
| Android readiness | Web/mobile evidence is stronger than native evidence. | Native Android verification attempt and documented blockers/evidence. |

## Personas

### Ana, Trip Organizer

- Creates a Oaxaca trip group.
- Invites friends through WhatsApp.
- Adds expenses as they happen.
- Needs the app to show a simple settlement route at the end.

Success: Ana can share "Luis le debe a Ana MXN 487.60" without explaining the math.

### Luis, Participant

- Joins a group from an invite.
- Records a dinner he paid for.
- Wants to know only what he owes or receives.

Success: Luis opens the app and immediately sees his group, identity, balance, and next action.

### Maru, Household Member

- Uses a recurring household group.
- Needs exact split adjustments because not everyone shares every expense.

Success: Maru can include/exclude people and use exact amounts without a spreadsheet.

## Core User Journeys

### Journey 1 — Create A Group

1. User opens `Grupos`.
2. User taps `Crear grupo`.
3. User enters group name and optional context.
4. User chooses their identity or creates a local profile.
5. App opens the new group home.

Required UX:

- Keep the form short.
- Do not ask for production account details.
- Show `Demo local` or equivalent only as a small trust cue.

### Journey 2 — Join A Group

1. User taps `Unirme`.
2. User pastes or opens a mock invite code/link.
3. App previews group name and members from local/mock invite data.
4. User chooses their member identity or adds themselves.
5. App opens that group.

Required UX:

- This is a mock/local flow until backend sync is approved.
- Use replaceable invite metadata so production sync can replace it later.

### Journey 3 — Add Expense

1. User taps `Agregar gasto`.
2. User enters concept and amount first.
3. User chooses category from a compact dropdown.
4. User chooses payer from a list.
5. User chooses split mode: equal, exact, or shares.
6. User includes/excludes participants.
7. App shows preview: "A cada quien le toca..."
8. User saves.

Required UX:

- Most common equal split should be fastest.
- Advanced split fields appear only after choosing a non-equal mode.
- Money values are right-aligned and always show decimals.

### Journey 4 — Settle Locally

1. User opens group home or Balance.
2. App shows the simplest route: "Luis le debe a Ana MXN 487.60".
3. User taps `Compartir recordatorio` or `Marcar pagado`.
4. App generates Spanish reminder text or records a local agreement.

Required UX:

- Settlement must never imply the app moved money.
- `Sin pagos reales` appears near settlement confirmation and share/reminder actions.
- SPEI/CLABE helper fields are local notes only.

### Journey 5 — Find History

1. User opens Activity/Expenses.
2. User searches "Uber", "Ana", "comida", or "487".
3. User filters by member/category/date.
4. User opens expense details, receipt placeholder, or audit trail.

Required UX:

- Search should feel like a utility, not an admin dashboard.
- Empty results must suggest clearing filters or adding a new expense.

## Information Architecture

Target model:

```text
Grupos
  -> Selected Group
       Inicio
       Gastos
       Balance
       Actividad
       Perfil
```

Rules:

- `Grupos` is the parent context.
- Selecting a group scopes every other tab.
- `Inicio` answers the current user's money state and next action.
- `Gastos` handles add/edit/search/export of expenses.
- `Balance` answers who owes whom.
- `Actividad` is an audit trail.
- `Perfil` manages local identity and group persona.

## Screen-Level Requirements

### Grupos

- Show compact group rows, not heavy cards.
- Each row shows group name, member count, open MXN amount, and a tiny route preview.
- Primary actions: `Crear grupo`, `Unirme`.

### Inicio

- Show active user, group, personal balance, and one next action in the first viewport.
- Avoid multiple competing summary cards.
- Keep `Agregar gasto` as the primary action.

### Gastos

- Add/edit expense should be list-driven and fast.
- Categories, payer, and participants use dropdown/list/sheet patterns.
- Split mode is visible, but advanced controls are progressive.

### Balance

- Lead with "quién le debe a quién".
- Right-align money.
- Use one primary settlement/share action.
- Member detail is secondary.

### Actividad

- Show audit rows with actor, action, concept, amount, and date.
- Support search/filter once the data path is ready.

### Perfil

- Show local identity and group persona.
- Let the user switch their active member in the selected group.
- Keep data controls local and explicit.

## Data Model Requirements

Local/pre-production model should support:

- `users`
- `groups`
- `group_members`
- `group_invites`
- `expenses`
- `expense_participants`
- `settlements`
- `activity_events`
- `receipt_attachments`
- `sync_outbox`

Money:

- Store integer cents.
- Default currency is MXN.
- Display decimals.
- Do not add live exchange rates or paid APIs.

## Low-Cognitive-Load UX Rules

- Every screen has one primary action.
- Replace paragraphs with short labels and useful structure.
- Prefer lists over large cards.
- Use dropdowns/sheets for choices.
- Right-align amounts in rows.
- Show exact amount and currency near every money action.
- Put trust boundaries only near sensitive actions.
- Do not explain the data model in visible UI.
- Use Spanish verbs users already understand: `Crear`, `Agregar`, `Dividir`, `Compartir`, `Marcar pagado`.

## Acceptance Risks

- A purely local collaboration model can still feel fake if invite/join copy overpromises sync.
- Flexible splits can add clutter if advanced controls are always visible.
- WhatsApp/SPEI helpers can sound like payments if copy is not careful.
- Dark mode can become a color rewrite if token usage is not disciplined.

## Non-Goals For This Phase

- Real auth.
- Real backend sync.
- Real payments.
- Push notifications.
- Production invite links.
- OCR.
- Cloud receipt storage.
- Legal/privacy final publication.
- Play Store submission.

## Work Item Mapping

- `WORK-APP-0089` to `WORK-APP-0091`: local collaboration and group/member model.
- `WORK-APP-0092` to `WORK-APP-0095`: flexible split engine and expense editing.
- `WORK-APP-0096` to `WORK-APP-0099`: settlement route, reminder, and SPEI/CLABE mocks.
- `WORK-APP-0100` to `WORK-APP-0103`: receipts, categories, search, export.
- `WORK-APP-0104` to `WORK-APP-0108`: IA and visual simplification.
- `WORK-APP-0109` to `WORK-APP-0110`: Android/internal testing readiness.

## Completion Evidence

Each downstream work item should produce:

- Company OS lifecycle records.
- Technical report.
- Tests or deterministic proof.
- Screenshots for visual items.
- Clear demo-only boundaries.
- No self-acceptance.
