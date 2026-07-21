# Cuenta Obra UI Reconstruction Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement follow-on tickets
> (`WORK-APP-0113` … `WORK-APP-0118`) task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rebuild Cuenta Obra’s Expo/tracker UI so it matches the preferred
shadcn/dashboard element kit (`dashboard/src/components/ui`, base-nova), not the
legacy expense-split StyleSheet / older reusables language.

**Architecture:** Prefer kit is the visual and API shape authority. Own Expo
equivalents live under `src/components/reusables/` (and tracker-specific
composites under `src/components/tracker/`). Tokens bridge from preferred kit
CSS variables into NativeWind. Tracker screens are rewritten to consume those
owned primitives. Legacy `MainScreen` / expense UI is historical and is not the
visual authority.

**Tech Stack:** Expo React Native + NativeWind, owned reusables, preferred kit
reference in `dashboard/` (Vite + shadcn base-nova). No web-only shadcn runtime
inside the Expo app.

**Company OS:** `WORK-APP-0112` (this plan) · Authority: `DECISION-UI-0001` ·
Goal: `GOAL-CUENTA-OBRA`

## Global Constraints

- Product is Cuenta Obra (provider work/material tracker), Spanish-first, Android-first.
- Preferred kit wins on conflict (`DECISION-UI-0001`): reconstruct old surfaces into kit language.
- Do not import `dashboard/` React/DOM components into Expo.
- Touch targets ≥ 44px; status changes via explicit sheet, never silent cycle.
- No costs/supplier internals in client-safe preview.
- No real payments, secrets, production backend, or expense-split feature work.
- Verify per ticket: `npm run typecheck`, `npm test`, `npx expo config --type public`,
  `npm run export:web`, `./bin/company-os scope WORK-APP-XXXX`, `./bin/company-os validate`.
- Screenshots at 360×740, 390×844, 412×915 for surface tickets.

---

## 1. Preferred kit inventory

Source: `dashboard/src/components/ui/` (shadcn base-nova) + tokens in
`dashboard/src/index.css`.

### Core primitives (must adapt for Expo)

| Preferred kit | Role | Expo owned target |
| --- | --- | --- |
| `button.tsx` | Primary/outline/secondary/ghost/destructive actions | `src/components/reusables/button.tsx` (rewrite variants to match kit) |
| `card.tsx` | Surface with header/title/description/content/footer | `src/components/reusables/card.tsx` (+ CardHeader/Title/Description/Content/Footer) |
| `input.tsx` | Text field | `src/components/reusables/input.tsx` |
| `label.tsx` | Field label | `src/components/reusables/label.tsx` (new) |
| `field.tsx` | Field grouping / validation layout | `src/components/reusables/field.tsx` (new) |
| `badge.tsx` | Status / meta chips | `src/components/reusables/badge.tsx` (replace ad-hoc pills) |
| `sheet.tsx` | Modal bottom/side sheet | `src/components/reusables/sheet.tsx` (RN Modal + kit look) |
| `select.tsx` | List selection | `src/components/reusables/select.tsx` (extend) |
| `tabs.tsx` | Section navigation | `src/components/reusables/tabs.tsx` (new; tracker tab bar) |
| `separator.tsx` | Dividers | `src/components/reusables/separator.tsx` (new) |
| `progress.tsx` | Progress rail | `src/components/reusables/progress.tsx` (new; replace ProgressTrack) |
| `checkbox.tsx` | Optional toggles | `src/components/reusables/checkbox.tsx` (new if needed) |
| `skeleton.tsx` | Loading placeholders | `src/components/reusables/skeleton.tsx` (new if needed) |
| `avatar.tsx` | Person/supplier glyph | `src/components/reusables/avatar.tsx` (align) |
| `calendar.tsx` + popover | Date picking reference | Keep Expo `DatePickerField`; restyle to kit Input/Button chrome |
| `sonner.tsx` | Toasts | `src/components/reusables/feedback.tsx` (align) |

### Kit pieces deferred / not primary for Cuenta Obra v1

| Preferred kit | Why deferred |
| --- | --- |
| `sidebar.tsx`, `breadcrumb.tsx` | Desktop admin chrome; DesktopWorkspace may borrow density later, not first |
| `chart.tsx`, `table.tsx` | Not in provider field flows |
| `dropdown-menu.tsx`, `drawer.tsx`, `toggle*.tsx`, `tooltip.tsx` | Use Sheet/Select first; add only if a flow needs them |

### Token variables to bridge (`WORK-APP-0113`)

From preferred kit `:root` / `@theme inline`:

- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`
- `--border`, `--input`, `--ring`
- `--radius` (+ sm/md/lg derived)

Map into `src/theme/tokens.json` + `src/tracker/theme.ts` + `tailwind.config.js`
so NativeWind classes like `bg-background`, `text-foreground`, `bg-primary`,
`border-border`, `rounded-lg` match the kit. Cuenta Obra may keep a small
semantic layer (`forest` status washes) **as aliases** of kit tokens, not a
second palette. For Palari Labs ↔ product personalization rules (tokens/variants
only), see **Palari Labs ↔ Cuenta Obra Token Bridge** in
`docs/product/ui-component-system.md`.

---

## 2. Expo adaptation rules

1. **Copy shape, not DOM.** Read preferred kit source for variants, spacing,
   radius, and naming (`data-slot` concepts → RN `testID` / clear props).
   Implement with `Pressable`/`View`/`Text` + NativeWind `className`.
2. **Own the code.** Prefer kit stays a reference under `dashboard/`. Expo
   components are editable product code under `src/components/reusables/`.
3. **Variant parity first.** Button variants: `default | outline | secondary |
   ghost | destructive`. Sizes: map kit `default/sm/lg` to Android-comfortable
   heights (minimum 44px touch; visual height may be slightly taller than web).
4. **Sheets over custom Modals.** New composers use `Sheet` primitive chrome
   (handle, scrim, header, footer actions) matching kit Sheet, even if powered
   by RN `Modal`.
5. **Badge for status.** Material status uses `Badge` variants / semantic
   washes — not one-off StyleSheet pills — unless a ticket documents why.
6. **No legacy authority.** Do not extend `src/components/ui.tsx` or
   `MainScreen.tsx` StyleSheet for Cuenta Obra. Do not force preferred kit
   visuals to match old tracker StyleSheet colors “for compatibility.”
7. **Tracker composites stay domain-named.** e.g. `MaterialStatusComposer`
   remains a product component; internally it must compose reusables Sheet +
   Button + Badge + Field + DatePickerField.
8. **Web dashboard optional.** `dashboard/` may later host a desktop operator
   view; Expo reconstruction does not block on wiring it. DesktopWorkspace in
   Expo still follows the same primitives.

---

## 3. Current → target surface map

| Current surface | Files today | Preferred elements | Ticket |
| --- | --- | --- | --- |
| Tokens / theme | `src/tracker/theme.ts`, `src/theme/tokens.json`, `tailwind.config.js` | kit CSS variables | `0113` |
| Primitives | `src/components/reusables/*` (expense-era) | rewrite to kit API/variants | `0114` |
| Home / next move | `TrackerScreen` hero + next action card | Card, Button, Badge, Progress | `0115` |
| Materials list + status | `MaterialRow`, `StatusPill`, `MaterialStatusComposer`, `DatePickerField` | Badge, Sheet, Button, Field, Progress | `0116` |
| Project/supplier setup + desktop | `ProjectComposer`, `SupplierComposer`, `ProjectSwitcher`, `DesktopWorkspace` | Sheet, Field, Input, Button, Tabs, Card | `0117` |
| Client-safe preview | client view branch in `TrackerScreen` | Card, Badge, Progress (no private fields) | `0118` |

### Explicit non-goals for this path

- Migrating or polishing historical `MainScreen` expense-split UI
- Importing Radix/Base UI DOM primitives into Expo
- Full dark mode (unless a later ticket)
- Production auth/backend

---

## 4. Reconstruction order (tickets)

### Task A — `WORK-APP-0113` Tokens

**Files:** `src/theme/tokens.json`, `src/tracker/theme.ts`, `tailwind.config.js`,
`global.css`, `docs/product/decisions.md`, evidence under
`reports/evidence/WORK-APP-0113/`

- [ ] Extract preferred kit light-theme values into tokens (hex/oklch → app format)
- [ ] Expose NativeWind color/radius names aligned with kit (`background`,
      `foreground`, `primary`, `muted`, `border`, …)
- [ ] Point `trackerColors` at the shared tokens (aliases only for status washes)
- [ ] Run typecheck/tests/export/scope/validate; capture token diff in evidence

### Task B — `WORK-APP-0114` Primitives

**Files:** `src/components/reusables/**`, evidence `WORK-APP-0114`

- [ ] Rewrite Button variants/sizes to preferred kit names (keep Android touch)
- [ ] Expand Card to Header/Title/Description/Content/Footer
- [ ] Add/align Badge, Label, Field, Sheet, Tabs, Separator, Progress
- [ ] Align Input/Select/Avatar/Feedback visually with kit
- [ ] Export from `src/components/reusables/index.ts`
- [ ] Smoke: render primitives from a tiny proof or existing tracker import path
- [ ] Checks + evidence

### Task C — `WORK-APP-0115` Home / next-move

**Files:** `TrackerScreen.tsx`, reusables, tracker presentation/theme

- [ ] Replace StyleSheet hero/next-action with Card + Button + Badge + Progress
- [ ] Preserve “one next physical move” behavior and Spanish copy
- [ ] Screenshots 360/390/412; checks

### Task D — `WORK-APP-0116` Materials + status composer

**Files:** `MaterialStatusComposer.tsx`, `DatePickerField.tsx`, materials UI in
`TrackerScreen.tsx`

- [ ] Material rows use Card/list row + Badge status
- [ ] Status composer uses Sheet + radio/Badge choices + Field + DatePicker
- [ ] Keep: no silent status cycle; received defaults date today; cancel safe
- [ ] Screenshots + checks

### Task E — `WORK-APP-0117` Setup + desktop

**Files:** `ProjectComposer.tsx`, `SupplierComposer.tsx`, `ProjectSwitcher.tsx`,
`DesktopWorkspace.tsx`

- [ ] Composers on Sheet + Field + Input + Button
- [ ] Switcher/tabs on Tabs/Select patterns from kit
- [ ] DesktopWorkspace density using Card/Separator; still owned Expo code
- [ ] Screenshots + checks

### Task F — `WORK-APP-0118` Client-safe preview

**Files:** client view in `TrackerScreen.tsx` (+ shared rows)

- [ ] Rebuild preview with Card/Badge/Progress only
- [ ] Verify no costs, supplier contact, or internal notes leak
- [ ] Screenshots + checks

---

## 5. Authority order (Cuenta Obra)

When sources disagree, resolve in this order:

1. Product behavior + launch/checklist constraints
2. `DECISION-PRODUCT-0002` / `DECISION-UI-0001` + `docs/product/decisions.md`
3. This reconstruction plan + `docs/product/cuenta-obra-ui-path.md`
4. Preferred kit source under `dashboard/src/components/ui` and
   `dashboard/src/index.css`
5. Owned Expo implementations in `src/components/reusables/`
6. Historical NativeWind expense docs (`ui-library-adoption.md`, etc.) — guidance
   only where they do not conflict with (2)–(4)

---

## 6. Verification template (every follow-on ticket)

```bash
git status --short --branch
./bin/company-os validate
./bin/company-os scope WORK-APP-XXXX
npm run typecheck
npm test
npx expo config --type public
npm run export:web
```

Capture technical report + screenshots under `reports/evidence/WORK-APP-XXXX/`.

---

## 7. Acceptance for WORK-APP-0112

This ticket is docs-only and is done when:

- Preferred kit inventory is listed
- Expo adaptation rules are explicit
- Tracker surface reconstruction order is mapped to `0113`–`0118`
- Preferred-elements-win rule is stated and linked to `DECISION-UI-0001`
- Company OS evidence/receipt recorded and validate passes
