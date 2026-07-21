# Cuentas Claras Product Brief

## Product

Cuentas Claras is an Android-first, Spanish-first expense-sharing app for
Mexico and LATAM. It helps friends, roommates, families, and travel groups see
who paid, who owes, and which settlements are already handled.

## Audience

- Friends splitting restaurants, groceries, weekend trips, rides, and Airbnb
  stays.
- Roommates tracking rent-adjacent household expenses without building a
  formal accounting system.
- Families and small informal groups who want a calm, trustworthy balance view
  in MXN.

## Promise

"Todos saben que cuentas siguen abiertas, sin perseguir mensajes ni hacer
cuentas a mano."

The app should feel reliable, warm, and financially careful. It should not feel
like a crypto wallet, bank, payment processor, or generic prototype.

## MVP

- Create local groups.
- Add members to a group.
- Add shared expenses paid by one member.
- Split each expense equally across active members.
- Show group balance, per-member balance, and simplified "quien le debe a quien"
  settlement suggestions.
- Mark settlement suggestions as paid, recording a local settlement activity.
- Show group history for expenses and settlements.
- Load realistic demo data for Mexico/LATAM.
- Work offline and persist locally on device.

## Non-Goals

- No real payments, transfers, SPEI, cards, open banking, receipts OCR, or tax
  reporting.
- No accounts, cloud sync, collaboration, identity verification, or invite
  links.
- No multi-currency exchange calculations in the MVP.
- No production deployment or paid external services.

## Product Tone

Spanish copy should be direct, calm, and action-oriented:

- "Agregar gasto" instead of "Create expense".
- "Marcar pagado" for demo settlement state.
- "Sin pagos reales" wherever a settlement action could be mistaken for money
  movement.
- "MXN" shown consistently so the default currency is unambiguous.

## Quality Bar

The first screen should be the app itself, not a landing page. A user should
immediately see groups, balances, next actions, and recent activity. Empty and
error states should explain what the user can do next without long
instructional copy.
