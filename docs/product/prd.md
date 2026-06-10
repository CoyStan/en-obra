# Cuentas Claras PRD

## Objective

Ship a polished local Android-first MVP that demonstrates a credible
Spanish-first Splitwise-style product for Mexico/LATAM, governed by Palari.

## Primary User Stories

- Como organizadora de un viaje, quiero crear un grupo para separar los gastos
  del fin de semana.
- Como miembro del grupo, quiero agregar a las personas que participan para que
  todos aparezcan en la cuenta.
- Como quien pago, quiero registrar un gasto con monto, concepto, fecha y quien
  pago.
- Como grupo, queremos dividir el gasto en partes iguales por ahora.
- Como usuario, quiero ver rapidamente quien debe recibir y quien debe pagar.
- Como usuario, quiero marcar un arreglo como pagado sin mover dinero real.
- Como usuario, quiero revisar la actividad para entender de donde salio el
  balance.

## Functional Requirements

- Groups:
  - Display a list of local groups with name, context label, member count, total
    spent, open balance, and last activity.
  - Create a group with a name and optional description.
  - Select a group and see a full group dashboard.
- Members:
  - Add a member by display name.
  - Show each member's net balance in the selected group.
  - Preserve demo members and user-added members locally.
- Expenses:
  - Add an expense with title, amount in MXN, payer, date, and optional note.
  - Split expenses equally among current group members.
  - Validate positive amounts and required fields.
  - Add an activity item when the expense is created.
- Balances:
  - Calculate per-member net balance as paid minus owed share plus settlements.
  - Generate simplified settlement suggestions from debtors to creditors.
  - Show "debe pagar", "debe recibir", and "en paz" states.
- Settlements:
  - Mark a suggested settlement as paid.
  - Settlement action records local activity only.
  - Settlement activity adjusts balances as if the debtor paid the creditor.
- Activity:
  - Show expenses and settlements in reverse chronological order.
  - Use Spanish labels and MXN amounts.
- Local-First:
  - Seed demo data on first launch.
  - Persist all local edits using on-device storage.
  - Provide reset-to-demo behavior for verification and demos.

## UX Requirements

- Android-first layout with generous touch targets and bottom navigation.
- First viewport shows live app data, not marketing copy.
- Obvious next actions: add expense, add member, create group, mark paid.
- Financial trust cues: consistent currency, demo-only payment labeling, visible
  activity trail, clear paid/open state.
- Empty states:
  - No groups: invite user to create first group or load demo data.
  - No expenses: prompt for first shared expense.
  - No settlements: say the group is even.
- Loading/error states should be concise and recoverable.
- Accessibility:
  - Text contrast targets WCAG AA where practical.
  - Pressable controls at least 44 px high.
  - State should not depend on color alone.

## Data Model

- `Group`: id, name, description, createdAt, updatedAt, memberIds.
- `Member`: id, name, avatarColor, joinedAt.
- `Expense`: id, groupId, title, amountCents, currency, payerId, participantIds,
  note, createdAt.
- `Settlement`: id, groupId, fromMemberId, toMemberId, amountCents, createdAt,
  status.
- `Activity`: derived from expenses and settlements for local display.

## Acceptance Criteria

- A user can complete the core flow without network access:
  create group -> add members -> add expense -> view who owes whom -> mark paid
  -> see updated balances and history.
- Demo data includes realistic Mexico/LATAM scenarios and names.
- All financial amounts use MXN and cents internally.
- No UI suggests a real payment will be executed.
- Local persistence survives refresh/reload in the supported local runtime.

## Out Of Scope

- Authentication, cloud sync, shared live groups, push notifications, payment
  rails, receipt scanning, exports, and production deployment.
