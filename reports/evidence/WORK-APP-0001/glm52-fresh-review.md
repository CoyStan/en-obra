Verdict: accept-ready

Findings:
- Hero satisfies first-viewport requirements: app identity, `Tú eres <user>`, selected group, MXN cue, personal balance, settlement cue, `Agregar gasto` action, and `Sin pagos reales` chip are all present.
- `formatHeroMoney` uses `maximumFractionDigits: 0`, which rounds the displayed balance to whole pesos. The technical report acknowledges this as intentional for scanning, and exact cent values remain in the settlement rows. Acceptable for this scoped pass.
- `displayMember` falls back to `selectedMembers[0]` when no active member is mapped, so the hero still shows a personal balance in demo mode without forcing identity selection. This is consistent with the goal's "do not remove core information" guidance.
- `settlementCue` correctly personalizes copy (`te debe` / `Debes a`) when the active member is involved, and falls back to neutral third-person copy otherwise.
- `setActiveGroupMember` is gated on `account.profile` and `signed-in` mode, so demo users are not forced into identity flows.
- `useEffect` for `payerId` only runs when `showExpenseForm` is true and preserves a valid existing selection, avoiding clobbering user choice.
- Quick action rail was flattened and `Agregar gasto` was moved into the hero as the primary action; the rail now holds Integrante / Liquidar / Actividad. Visual weight reduced as intended.
- Theme palette shifts (warmer canvas `#FAFAF7`, softer border `#E8ECE9`) align with the concept-02 warmth reference without breaking the green/blue trust palette.
- No real payment rails or backend secrets introduced; `Sin pagos reales` boundary remains visible in the hero, settlement rows, and confirmation modal.
- Accessibility: identity pill, quick actions, and sheet options have labels/roles/states; touch targets meet the 44-48 px bar (identity pill 48, nav items 48, payer options 48).

Residual risks:
- No real Android emulator/device verification; only web export screenshots at Android viewport sizes were used. Keyboard behavior, bottom-sheet ergonomics, and native font rendering remain unverified (acknowledged in the report).
- `personalSettlement` picks the first settlement involving the display member, which may not be the highest-priority one; acceptable for a single cue but could mislead if multiple personal settlements exist.
- `heroMoneyFormatter` rounding means a balance of e.g. MXN 1,250.99 displays as `MXN 1,251` in the hero while the settlement row shows exact cents; minor inconsistency a human taste reviewer should confirm.
- `warmWash` is referenced in `noPaymentChip` and `goldPill` but not defined in the diff's theme snippet; assuming it exists in the full theme (referenced in current code as `colors.warmWash`). If missing, it would surface as a runtime style error.
- Broader goal items (SQL-ready model, deeper identity gating, add-expense sheet polish, activity audit refinement, Play Store readiness) are explicitly out of scope for this ticket and remain future work.
- Human/product review still required for final visual taste sign-off against the concept references.