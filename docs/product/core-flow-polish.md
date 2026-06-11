# Core Flow Polish

## Scope

CUE-0017 keeps the existing local-first MVP behavior and improves the first
usable path:

- create a group,
- add an integrante,
- add an MXN expense,
- keep forms open when validation fails,
- show validation copy in Spanish inside member and expense sheets,
- preserve "Sin pagos reales" and local-only positioning.

## Behavior

Group, member, and expense actions now return a success boolean. The UI only
clears and closes a form after the local action validates. Invalid submissions
leave the form open, set the existing app error state, and show that error near
the relevant sheet controls.

## Validation Covered

- Blank group names are rejected.
- Blank member names are rejected.
- Blank expense concepts are rejected.
- Invalid or zero MXN amounts are rejected.
- Expenses cannot be saved before the group has members.
- Expenses require a payer from the active group.

## Non-Goals

- No unequal splits.
- No receipt attachments.
- No real invitations.
- No backend sync.
- No real payments or payment-language changes.
