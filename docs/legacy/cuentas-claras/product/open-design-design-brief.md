# Open Design Design Brief

Use this brief when asking Open Design to critique or prototype Cuentas Claras.

## Product

Cuentas Claras is an Android-first shared-expense app for Mexico/LATAM. It should feel premium, light, trustworthy, and easy for non-technical users. The product is Spanish-first, uses MXN by default, supports local demo users/groups/expenses/settlements, and must clearly say `Sin pagos reales`.

## Current Product Elements

- Active local user identity.
- Group selector and selected group workspace.
- Inicio command center.
- Activity ledger.
- Balance and settlement views.
- Add-expense composer.
- Members, payers, participants, equal split preview.
- Local-first demo data.
- Account/profile and local data controls.
- Android mobile web verification at 360, 390, and 412 px widths.

## Design Objective

Create a premium Android mobile finance product direction inspired by Stripe-grade clarity, but original for LATAM:

- Lighter than the current app.
- Clearer than a dense dashboard.
- More visual than text-only UI.
- Softer and warmer than a bank app.
- More native than a phone-sized website.
- Built around obvious next actions.
- Understandable at a low cognitive load.

## Preferred Influences

- Stripe: typographic precision, trust, quiet premium hierarchy.
- Wise/Revolut: consumer-finance clarity and useful money movement objects.
- Expo/mobile-app templates: app-native structure, not web layout.
- Existing Cuentas Claras direction: green/blue/sand, local settlement language, MXN, no-real-payments trust cue.

## Non-Negotiables

- Android-first.
- Spanish-first.
- MXN currency.
- Integer cents in data model.
- Local-first demo behavior.
- Multi-user mental model: users join groups and record transactions.
- No real payments.
- No production backend secrets.
- No paid APIs.
- No generic landing page.
- No dense dashboard wall.
- No tiny text.
- No random decorative gradients.

## Requested Output From Open Design

Ask for:

- Three alternative Android mobile directions.
- One recommended direction.
- Screen-by-screen layout strategy for Inicio, Grupos, Add Expense, Balance, Activity, Profile.
- Token recommendations: color, type, radius, spacing, elevation, motion.
- Component recommendations: selectors, bottom sheets, bottom nav, balance objects, settlement objects, activity timeline.
- A list of React Native implementation tickets.
