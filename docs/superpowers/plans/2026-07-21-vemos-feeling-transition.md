# Cuenta Obra → Vemos Feeling Transition Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Cuenta Obra’s UI from the current cool emerald/slate “admin dashboard” feel to the warm, calm Palari **Vemos** feeling — without copying Vemos product flows or abandoning the preferred kit.

**Architecture:** Keep `dashboard/src/components/ui` (shadcn base-nova) as structure. Change personality through tokens, typography, radius, elevation, spacing, and a few composition rules (one focused card, softer chrome). Sync Expo tracker tokens afterward so web + mobile share one language.

**Tech Stack:** Vite dashboard (React + Tailwind v4 + shadcn), Expo tracker (NativeWind), shared `src/theme/tokens.json`, reference repo [CoyStan/palari-vemos](https://github.com/CoyStan/palari-vemos) (`src/foundation.ts`, `design-system/vemos/MASTER.md`).

## Global Constraints

- Kit structure wins (`DECISION-UI-0001`): restyle via CSS variables / tokens; do not fork every primitive.
- Product stays Cuenta Obra (trabajos, materiales, proveedores, vista cliente) — do **not** import Vemos screens (When/Friends calendar).
- Spanish-first copy; calm field-worker tone (no CRM jargon).
- This is an intentional founder preference for **Vemos warmth**, distinct from the earlier rejected Palari **indigo** marketing paint (`decisions.md` emerald revert). Vemos primary is teal `#147A78`, not indigo.
- Dashboard first (`http://100.113.33.46:8081/`); Expo tracker follows tokens in a later task.
- Preserve working IA: Hoy global · Proveedores shared · Trabajo activo + client preview nested · materials → `projectId`.
- Respect reduce-motion; keep tap targets ≥ 44px on mobile surfaces.
- Do not expand the multi-theme switcher into 10 competing personalities during this transition — either retire it to “Vemos + one dark” or map themes to Vemos-adjacent variants only.

## What “Vemos feeling” means (borrow)

| Dial | Current Cuenta Obra | Vemos target |
| --- | --- | --- |
| Canvas | Cool slate `#F8FAFC` | Warm off-white `#FAF8F5` |
| Primary | Emerald `#059669` | Teal `#147A78` |
| Warmth accent | Amber wash / marigold | Soft coral `#F28C78` (sparse) |
| Borders | Hard hairlines everywhere | Soft teal-tinted shadows on primary surfaces; borders for inputs/secondary |
| Radius | ~10px controls | Control 14 · card 20 · sheet 24 · pill CTAs |
| Type | Geist / system cold | Warm geometric (Quicksand or close web equivalent) |
| Density | Dashboard tables + many cards | Generous whitespace; **one** lifted focus card per view |
| Motion | Mostly static | Calm 150–300ms press/scale; sheet-like dialogs |
| Chrome | Sidebar admin shell | Same shell, warmer paint + softer elevation |

## What we do **not** borrow

- Calendar / friends / invite sheets as product.
- English greeting copy (“Good morning”).
- Bottom nav with only 2 lifestyle tabs (Cuenta Obra keeps job IA).
- Dense emoji iconography.
- Replacing TanStack materials table with card-only lists on desktop (table stays; soften chrome around it).

## File map

| File | Role |
| --- | --- |
| `src/theme/tokens.json` | Shared color/radius/shadow source of truth |
| `dashboard/src/index.css` | Kit CSS variables (`:root`) |
| `global.css` + Expo theme bridge | Mobile parity |
| `dashboard/src/dashboard/themes.ts` | Theme switcher → Vemos-aligned set or slim down |
| `dashboard/src/App.tsx` | Composition: spacing, focus card, header voice |
| `dashboard/src/dashboard/materials-data-table.tsx` | Soften table chrome, pill actions |
| `docs/product/visual-direction.md` + `ui-component-system.md` | Document new authority |
| `docs/product/decisions.md` | Record decision superseding cool emerald default |

---

### Task 1: Lock the visual contract (docs + decision)

**Files:**
- Modify: `docs/product/decisions.md`
- Modify: `docs/product/visual-direction.md`
- Modify: `docs/product/ui-component-system.md` (Palari/Vemos bridge section)

- [ ] Add decision: **Cuenta Obra adopts Vemos visual dialect** — tokens from Vemos `foundation.ts`, kit structure unchanged; supersedes cool emerald as default chrome (note distinction from rejected indigo paint).
- [ ] Rewrite visual-direction palette + layout grammar to warm canvas / teal / coral / soft shadow / Quicksand-class type.
- [ ] Update token bridge table: map Vemos → kit vars (`--background`←canvas, `--primary`←teal, `--accent`←coral soft, `--radius`←14/20, shadow tokens).
- [ ] Commit: `docs: adopt Vemos visual dialect for Cuenta Obra`

### Task 2: Paint tokens (shared + dashboard CSS)

**Files:**
- Modify: `src/theme/tokens.json`
- Modify: `dashboard/src/index.css`
- Modify: `global.css` (if still authoritative for Expo)

- [ ] Set colors to Vemos values:

```text
canvas/background  #FAF8F5
surface/card       #FFFFFF
ink/foreground     #2A2C31
muted              #6B7280
border             #EBE5DF
primary            #147A78
primaryPressed     #0F6261
primarySoft        #E7F5F4
coral              #F28C78
coralSoft          #FFF0EC
success            #15803D
danger             #B42318
```

- [ ] Raise radius: controls ~14px, cards ~20px (`--radius: 0.875rem` or explicit card radius).
- [ ] Add shadow tokens (teal-tinted): soft `0 4px 16px rgba(20,122,120,0.08)`, lift `0 8px 24px rgba(20,122,120,0.12)`.
- [ ] Wire `--sidebar-*` to warm canvas + soft teal accents (not cool slate).
- [ ] Hard refresh dashboard; verify Hoy / materials / client preview still readable (contrast).
- [ ] Commit: `style: paint Cuenta Obra tokens with Vemos palette`

### Task 3: Typography + theme switcher discipline

**Files:**
- Modify: `dashboard/src/index.css` / `dashboard/index.html` (font import)
- Modify: `dashboard/src/dashboard/themes.ts`
- Modify: `dashboard/src/dashboard/theme-switcher.tsx`

- [ ] Load Quicksand (or licensed equivalent) for `--font-sans` / headings; keep tabular numerals for money if needed via `font-variant-numeric`.
- [ ] Collapse theme list: default **Vemos**, optional **Vemos dark**, remove cold emerald/zinc parade **or** remap each theme to warm-family variants only.
- [ ] Default stored theme → `vemos`.
- [ ] Commit: `style: Quicksand + Vemos-first theme switcher`

### Task 4: Soften kit surfaces (shadow over border)

**Files:**
- Modify: `dashboard/src/components/ui/card.tsx` (prefer soft shadow, lighter ring)
- Modify: `dashboard/src/components/ui/button.tsx` (pill primary where product CTAs; keep size variants)
- Modify: `dashboard/src/components/ui/badge.tsx` / `sidebar.tsx` as needed for warm accent states
- Modify: `dashboard/src/App.tsx` (header, Hoy cards, client preview)

- [ ] Cards: white surface + soft teal shadow; reduce hard `ring-1` dominance on primary content cards.
- [ ] Primary buttons: fuller radius (pill or near-pill) for main CTAs (`Material`, `Crear trabajo`).
- [ ] Hoy: keep 4 summary stats but visually quiet; one **lift** card for “Para atender” table region only.
- [ ] Client preview: calm, share-safe — coral only for warmth chips, never as status danger.
- [ ] Sidebar: warm canvas; active trabajo remains obvious (name + client).
- [ ] Commit: `style: soft shadows and pill CTAs for Vemos feel`

### Task 5: Materials table chrome (keep power, lose cold)

**Files:**
- Modify: `dashboard/src/dashboard/materials-data-table.tsx`

- [ ] Soften sticky header (muted wash, not harsh gray slab).
- [ ] Status badges: teal / soft coral / muted — color + label (a11y).
- [ ] Row actions / Columnas / WhatsApp tip: friendlier spacing; tip bar uses soft teal wash.
- [ ] Do **not** remove sorting/pagination/column visibility.
- [ ] Commit: `style: warm materials table chrome`

### Task 6: Motion (light touch)

**Files:**
- Modify: select interactive surfaces in `App.tsx` / buttons
- Optional small helper: `dashboard/src/dashboard/motion.ts`

- [ ] Press feedback ~0.97 scale / 150–200ms on primary icon buttons (respect `prefers-reduced-motion`).
- [ ] Sheet open/close already from kit — verify timing feels calm, not snappy-admin.
- [ ] No decorative gradient motion or floating metric pills.
- [ ] Commit: `style: calm micro-motion for primary controls`

### Task 7: Expo tracker token parity

**Files:**
- Modify: `src/theme/tokens.json` consumers (`src/tracker/theme.ts`, NativeWind config, `global.css`)
- Spot-check: `src/screens/TrackerScreen.tsx`, tracker components

- [ ] Ensure mobile canvas/primary/coral/radius match dashboard.
- [ ] No full Vemos screen rewrite in this task.
- [ ] Commit: `style: sync Expo tracker tokens to Vemos dialect`

### Task 8: Verify + decision cleanup

- [ ] Manual pass on `:8081`: Hoy scroll, project switch, Columnas menu, Así lo ve el cliente, Proveedores global, Mejorar plan footer (no overlap).
- [ ] Contrast check: text on soft teal / coral washes.
- [ ] Update `docs/product/cuenta-obra-ui-path.md` pointer if needed.
- [ ] Commit: `docs: note Vemos dialect verification`

---

## Suggested rollout order

1. Docs/decision (align humans)  
2. Tokens + CSS (biggest perceived change in one PR)  
3. Type + theme switcher  
4. Card/button/App composition  
5. Materials table  
6. Motion  
7. Expo parity  

Each step should leave the app usable; prefer one PR per task or group 2–4 if small.

## Success criteria

- First glance: warm canvas + teal, not cool hospital green/slate.
- Still obviously a **work materials** tool, not a social calendar.
- Active trabajo + client relationship remain clear in the sidebar.
- Tables remain usable; feeling comes from chrome, not feature removal.
- Founder can say: “This feels like Vemos, but it’s Cuenta Obra.”

## Out of scope (later)

- Rewriting IA to bottom-tab lifestyle navigation.
- Replacing dashboard with Expo web as primary.
- Full dark-mode craft beyond a single Vemos dark variant.
- Reintroducing 10 unrelated theme skins.
