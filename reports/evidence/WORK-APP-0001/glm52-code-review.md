### 1. Prioritized Implementation Plan

1.  **App Bar & Active User Header:** Replace the current text-only app bar with a compact, identity-first header. Move the active user avatar/name to the top-left, making it tappable to switch identity or open the profile.
2.  **Unified "My Balance" Hero Module:** Replace the heavy `activeGroupCard` and `balancePanel` with a single, calm hero section. Lead with the active user's personal balance (`Te deben` / `Debes`), followed by the group context and a single primary action.
3.  **Flatten Quick Actions:** Remove the bordered card containers from the `quickActionRail`. Use a transparent background with subtle dividers or just icon + label typography to reduce visual weight.
4.  **List-First Settlements:** Convert the bordered `settlementCard` into a clean list row with a subtle bottom divider, moving the "Sin pagos reales" cue to a persistent, lightweight chip at the bottom of the viewport or section.
5.  **Token & Spacing Refinement:** Increase canvas whitespace, soften borders, and refine the green/blue/sand palette to feel more premium and less dense.

### 2. First Viewport Layout & Content Decisions (360x740)

The first viewport must establish identity, balance, and trust without feeling crowded.

*   **Top Bar (Identity):** `[Avatar] Tú eres Ana` (left) | `[Bell] [Dots]` (right). This immediately answers "who am I".
*   **Hero Balance Module (The Focus):**
    *   Eyebrow: `Viaje a Oaxaca · MXN`
    *   Main Amount: `Te deben MXN 1,250` (Large, calm, emerald color).
    *   Subtext: `Diego te debe MXN 430` (The primary who-owes-whom cue).
    *   Action: A single, full-width `Agregar gasto` button (Primary green).
*   **Quick Actions (Lightweight):** A row of 3 text+icon actions without borders: `Integrante` | `Liquidar` | `Ver todo`.
*   **Settlements (List-First):** Start the "Quién le debe a quién" section here. Use clean rows: `[Icon] Luis le debe a Ana · MXN 310 [Marcar]`.
*   **Trust Cue (Persistent):** A tiny, fixed bottom chip or a subtle footer line: `Registro local · Sin pagos reales`.

### 3. Style/Token Changes to Reduce Visual Weight

*   **Colors:**
    *   Canvas: `#FAFAF7` (Warmer, lighter sand).
    *   Surface: `#FFFFFF` (Pure white for cards if used, but prefer transparent sections).
    *   Borders: Reduce opacity. Change `border: "#DCE6E3"` to `border: "#E8ECE9"` or use `borderColor: colors.ink + '10'` (10% opacity).
    *   Primary Action: Keep `#0F766E` (Emerald) for the main CTA only.
*   **Spacing:**
    *   Increase global `padding` on the main `ScrollView` from `spacing.md` (12) to `spacing.lg` (16) or `spacing.xl` (22) for breathing room.
    *   Change `gap` in sections from `spacing.sm` (8) to `spacing.md` (12).
*   **Typography:**
    *   Hero Amount: Increase to `28` or `32`, weight `800`, to anchor the screen.
    *   Labels: Use `colors.mutedInk` for kickers, keep main copy `colors.ink`.
*   **Components:**
    *   Remove `borderWidth: 1` and `borderColor` from `quickAction` styles. Use `backgroundColor: colors.surfaceStrong` with no border for a softer feel if grouping is needed.
    *   `settlementCard`: Remove border, use `borderBottomWidth: 1` for list rows.

### 4. Data/Model Changes Needed Now

No structural changes to the SQL-ready entities are needed for this UI pass, but the *view model* must change:

*   **Personal Balance Calculation:** The UI needs `activeUserBalance` (the net cents for the `activeGroupMember`) directly from `calculateGroupBalances` to render the Hero module.
*   **Primary Debt Cue:** The UI needs a function like `getPrimaryDebtForUser(data, groupId, activeMemberId)` returning `{ debtorName, amountCents }` to show "Diego te debe MXN 430" immediately.

### 5. Risks to Check on 360px

*   **Text Truncation:** "Tú eres Ana" + "Viaje a Oaxaca" might be tight. Ensure the group name truncates with an ellipsis if it exceeds one line.
*   **Hero Amount Overflow:** Large MXN amounts (e.g., `MXN 12,345.00`) might wrap awkwardly. Ensure `numberOfLines={1}` and `adjustsFontSizeToFit` on the hero amount.
*   **Quick Action Labels:** "Integrante", "Liquidar", "Ver todo" must fit in a 3-column row without truncation. Use `flex: 1` and center alignment.
*   **Bottom Nav Overlap:** The persistent "Sin pagos reales" cue must not overlap with the `bottomNav`. Place it just above the nav or inside the scroll view footer.