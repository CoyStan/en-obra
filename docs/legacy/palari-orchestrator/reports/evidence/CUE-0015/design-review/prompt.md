# CUE-0015 Design Review Prompt

Claude Opus 4.8 was requested for this review, but it is not available in the
local opencode provider list. You are the strongest configured fallback model.

Task: Produce a professional Android-first mobile UI critique and redesign plan
for Cuentas Claras, a Spanish-first Splitwise-style local Expo/React Native app
for Mexico/LATAM.

Mode: critique and design architecture only. Do not edit files. Do not commit.
Do not run destructive commands. Read the current product docs and source files,
then return implementation guidance that another engineer can apply under
Palari.

Read at minimum:

- `docs/product/brief.md`
- `docs/product/prd.md`
- `docs/product/design-system.md`
- `docs/product/design-research.md`
- `docs/product/play-readiness.md` if present
- `docs/production/play-readiness.md`
- `docs/production/android-release-readiness.md`
- `App.tsx`
- `src/screens/MainScreen.tsx`
- `src/components/ui.tsx`
- `src/theme/theme.ts`
- `src/data/demoData.ts`

Current release goal:

- The app should feel like a polished Android consumer finance product, not a
  generated prototype.
- Improve group dashboard, balance screen, expense flow, settlement flow, and
  activity history.
- Keep Spanish copy natural for Mexico/LATAM.
- Keep "Sin pagos reales" obvious near settlement actions.
- Keep local-first behavior and realistic demo data.
- Do not add real payments, production backend, paid APIs, or secrets.
- Prioritize Android-first layout, trust cues, clear who pays/who receives,
  balance clarity, obvious primary actions, empty/error/loading states,
  accessible contrast, 44px touch targets, and reduced clutter.

Return:

1. Top UI/product problems ranked by severity.
2. A redesign plan for visual hierarchy, spacing, typography, color, cards,
   tabs/navigation, forms, empty/error/loading states, and balance clarity.
3. Specific screen-by-screen recommendations for groups, balance, activity, and
   account/demo-local areas.
4. Spanish copy improvements for Mexico/LATAM.
5. Implementation guidance for React Native files and components, including
   what to avoid.
6. Verification suggestions for screenshots or mobile viewport checks.
