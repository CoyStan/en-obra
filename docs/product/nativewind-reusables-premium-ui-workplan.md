# NativeWind + React Native Reusables Premium UI Workplan

Date: 2026-07-05
Status: active plan
Repository: `/home/quetza/projects/cuentas-claras`
Company OS work item range: `WORK-APP-0070` through `WORK-APP-0087`
Companion autonomous-agent goal: `docs/product/codex-autonomy-goal-nativewind-reusables.md`

## Purpose

Move Cuentas Claras from a handcrafted React Native `StyleSheet` UI toward an
agent-legible, premium, Android-first component system inspired by the
Tailwind/shadcn workflow, adapted correctly for Expo/React Native.

This plan does not rewrite the app in a big bang. It introduces a new UI
foundation, proves it on one surface, then migrates the premium product screens
one bounded ticket at a time. Existing screens continue to work until each is
touched.

## Decision

Adopt:

- **NativeWind** as the Tailwind-style styling layer for Expo/React Native.
- **React Native Reusables** as the shadcn-like copy-owned component source.
- **RN Primitives** selectively for accessible primitives behind sheet/dialog,
  label, select/dropdown, checkbox, and related interaction building blocks.

Evaluate but do not broadly adopt by default:

- **gluestack-ui**: useful as a component/pattern reference or fallback for
  complex primitives, but do not let it replace the product's visual language.
- **Tamagui**: powerful, but too architecture-changing for the current goal
  unless NativeWind/Reusables fails a proof ticket.

Do not adopt:

- Web-only `shadcn/ui`, Radix UI, MUI, Ant Design, admin dashboards, or paid UI
  templates as primary app architecture.

## Why This Is The Right Adaptation

The original advice says "React + Vite + Tailwind v4 + shadcn/ui." Cuentas
Claras is not that stack. It is Expo, React Native, React Native Web, and
TypeScript. The equivalent move is NativeWind plus copy-owned React Native
components. That preserves the main benefit: agents can see, edit, and reason
about component structure and styling together, instead of drifting across a
large custom stylesheet.

## Current Baseline

- Expo/React Native app with TypeScript.
- Custom theme in `src/theme/theme.ts`.
- Custom primitives in `src/components/ui.tsx`.
- Main app surface concentrated in `src/screens/MainScreen.tsx`.
- Premium visual direction already improved through Open Design tickets.
- Company OS active via `./bin/company-os`.

## Design Rules For The Migration

1. New UI work uses tokens/classes, not raw color literals.
2. New copied components live in owned source paths and can be modified freely.
3. Migrate by strangler pattern: new components first, old `StyleSheet` retired
   opportunistically as each surface is touched.
4. Keep Android-first touch targets, typography, and viewport screenshots.
5. No real payments, production backend, secrets, paid APIs, deployment, or legal
   decisions.
6. Do not regress current local-first demo behavior.

## Phase A — Foundation And Proof (`WORK-APP-0070` … `WORK-APP-0075`)

| Item | Deliverable | Completion Test |
| --- | --- | --- |
| `WORK-APP-0070` | UI library decision record and adoption architecture note | Docs explain NativeWind/Reusables/RN Primitives decision, gluestack/Tamagui fallback criteria, and no-big-bang migration rule |
| `WORK-APP-0071` | NativeWind installed and wired for Expo web/native | `npm run typecheck`, `npm test`, `npx expo config --type public`, `npm run export:web` pass; a tiny proof component renders with `className` |
| `WORK-APP-0072` | Tailwind token bridge from `src/theme/theme.ts` | Tailwind config exposes Cuentas Claras color, radius, spacing, and type tokens; no duplicate palette invented |
| `WORK-APP-0073` | React Native Reusables/RN Primitives spike | Copy-owned primitives added for button/card/input/sheet or equivalent; proof screen uses them; checks pass |
| `WORK-APP-0074` | UI component ownership guide | `docs/product/ui-component-system.md` defines component paths, naming, token rules, and migration rules for future agents |
| `WORK-APP-0075` | First production proof migration | One small visible surface, preferably an empty/loading/error or settings subsection, migrates to the new component style with screenshots |

## Phase B — Core Component System (`WORK-APP-0076` … `WORK-APP-0080`)

| Item | Deliverable | Completion Test |
| --- | --- | --- |
| `WORK-APP-0076` | Premium Button, IconButton, Pill, Avatar, Amount components | Existing behavior preserved; components support Android touch targets and tokenized variants |
| `WORK-APP-0077` | Premium Card/Surface/ListRow system | Reusable money-card, person-row, group-row, and audit-row patterns reduce repeated local styling |
| `WORK-APP-0078` | Premium Sheet/Dropdown/Select primitives | Add-expense category, payer, participants, active member selector use accessible list/sheet primitives with smooth motion |
| `WORK-APP-0079` | Form/input system | Amount, text, note, decimal, validation, helper/error states standardized |
| `WORK-APP-0080` | Motion and feedback layer | Press, open/close, dropdown, save, settlement, toast/status feedback standardized without clutter |

## Phase C — Surface Migration (`WORK-APP-0081` … `WORK-APP-0085`)

| Item | Deliverable | Completion Test |
| --- | --- | --- |
| `WORK-APP-0081` | Workspace shell and bottom navigation migration | Group-first navigation feels coherent, lighter, and Android-native across 360/390/412 widths |
| `WORK-APP-0082` | Inicio money instrument migration | First viewport clearly shows active user, group, balance, route, next action, MXN, and `Sin pagos reales` using new components |
| `WORK-APP-0083` | Add-expense composer migration | Receipt composer uses new sheet/select/input/money components; category/payer/participants remain dropdown/list selectors |
| `WORK-APP-0084` | Balance settlement map migration | Settlement map and member ledger use new visual system, decimals, right-side money rails, and cleaner spacing |
| `WORK-APP-0085` | Activity and Perfil migration | Audit trail and identity vault use the new component system; local trust cues remain obvious |

## Phase D — Verification, Cleanup, And Handoff (`WORK-APP-0086` … `WORK-APP-0087`)

| Item | Deliverable | Completion Test |
| --- | --- | --- |
| `WORK-APP-0086` | Legacy style cleanup and bundle check | Unused styles removed only where migrated; bundle/export remains healthy; no behavior regressions |
| `WORK-APP-0087` | Final premium UI evidence packet | Screenshots at 360x740, 390x844, 412x915 for all major flows; Company OS records accept-ready; remaining founder-only decisions listed |

## Verification Commands

Run per ticket as relevant:

```bash
git status --short --branch
./bin/company-os validate
./bin/company-os queue
npm run typecheck
npm test
npx expo config --type public
npm run export:web
./bin/company-os scope WORK-APP-XXXX
```

For visual tickets, also run a static preview from `dist` and capture screenshots:

```bash
python3 -m http.server 49738 --bind 127.0.0.1 --directory dist
```

Required screenshot widths:

- `360x740`
- `390x844`
- `412x915`

## Acceptance Standard For The Plan

The plan is complete only when:

- `WORK-APP-0070` through `WORK-APP-0087` all have completed attempts, passing
  evidence, receipts, and accept-ready reviews.
- `./bin/company-os validate` passes.
- `npm run typecheck`, `npm test`, `npx expo config --type public`, and
  `npm run export:web` pass.
- Major screens are migrated or intentionally documented as deferred.
- Screenshots prove the app looks premium and readable at the required Android
  widths.
- The repo is clean.
- Only founder/human acceptance, Play Store credentials, legal/privacy adoption,
  production backend/auth/payment decisions, deployment, tags, and releases
  remain.

