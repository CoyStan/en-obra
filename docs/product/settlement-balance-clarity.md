# Settlement And Balance Clarity

## Scope

CUE-0018 improves the balance and settlement explanation layer without changing
the underlying equal-split math.

## Changes

- Balance rows now include a text explanation: paid amount, owed share, and any
  paid settlement adjustment.
- Expense activity now states who paid and how many integrantes shared the
  expense.
- Settlement activity now says it was marked paid locally and repeats "Sin pagos
  reales".
- Settlement cards clarify that the payer records an external payment to the
  recipient.

## Product Rules

- Never imply SPEI, card, wallet, or in-app money movement.
- Express paid/open/even states with text plus visual state.
- Keep MXN amounts tabular and readable.
- Treat paid settlements as local records only.
