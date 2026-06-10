# Design Research: Production Feel

## Sources Reviewed

- Splitwise Google Play listing:
  https://play.google.com/store/apps/details?id=com.Splitwise.SplitwiseMobile
- Splitwise product site:
  https://www.splitwise.com/
- Material finance study, Rally:
  https://m2.material.io/design/material-studies/rally.html
- Material Design 3:
  https://m3.material.io/
- Mobbin finance mobile pattern gallery:
  https://mobbin.com/explore/mobile/app-categories/finance
- Dribbble finance app UI search:
  https://dribbble.com/search/finance-app-ui
- Dribbble split expense search:
  https://dribbble.com/search/split-expense

## Product Lessons

- Splitwise positions the problem as reducing stress and awkwardness around
  shared money. Cuentas Claras should keep that emotional frame: calm, direct,
  low-drama balances.
- Splitwise's public feature set emphasizes groups, expenses, offline entry,
  debt simplification, totals, activity, comments/history, and multiple split
  modes. Our MVP is intentionally narrower, but should make the core "who owes
  whom" path feel finished.
- Finance galleries repeatedly use card/list structures, strong amount
  hierarchy, bottom navigation, dashboard summaries, and clear action affordances.
  Cuentas Claras should keep dense but readable operational screens rather than
  a marketing-style hero.
- Material finance examples support bold numeric hierarchy and consistent
  category/status color. Our design should reserve color for money states and
  actions, not decoration.

## Visual Direction For Cuentas Claras

- Keep the current warm canvas and white surfaces; they feel approachable and
  less bank-like.
- Retain green as the trust/action color, blue as finance/neutral, coral as
  "debe pagar", and gold as product accent.
- Use a simple balance-scale mark for the app icon and splash, paired with the
  `Cuentas Claras` wordmark in store graphics.
- Use real product screens as store screenshots. Avoid abstract stock art.
- Make "Sin pagos reales" visible near any settlement flow until a legal/payment
  decision authorizes real rails.
- Increase production credibility through:
  - account state clarity,
  - sync status,
  - data deletion affordances,
  - privacy/terms availability,
  - release checklist discipline.

## Screen Feel Targets

- Group list: should answer "which group needs attention?" in under five
  seconds.
- Balance tab: should make the next settlement action obvious without implying a
  real transfer.
- Activity tab: should be the trust trail for why the balance changed.
- Account/settings: should explain local/mock account state and deletion clearly.
- Sync state: should say whether data is local-only, queued, or synced to a
  future backend adapter.

## Avoid

- One-note fintech gradients.
- Payment vocabulary that implies real money movement.
- Overly playful illustrations that reduce trust.
- Store screenshots that hide the actual app.
- Dark blurred lifestyle imagery.
