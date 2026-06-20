Verdict: needs-changes

### Assessment of Prior Blocking Concerns

**1. Payer excluded from participants — RESOLVED**
`chooseExpensePayer` now auto-includes the payer in `participantIds`. `toggleExpenseParticipant` prevents removing the payer. The submit button's disabled state explicitly checks `participantIds.includes(payerId)`. This is handled well.

**2. Payer accessibility state — RESOLVED**
Payer `Pressable` now uses `accessibilityRole="checkbox"` with `accessibilityState={{ checked: payerId === member.id }}`, matching the participant pattern.

**3. Vertical heaviness — PARTIALLY ADDRESSED, STILL BLOCKING**
The payer and participant grids now use a 2-column layout (`flexBasis: "48%"`, `flexWrap: "wrap"`), which halves the vertical footprint of those sections. However, the diff **adds** three new full-width vertical blocks: `expenseIdentityBand` (~58px), a second `sheetSectionHeader` for participants, and `splitPreview` (~58px). On a 360px device with keyboard open, the net vertical weight remains high. Critically, **no `ScrollView` wrapper or `keyboardShouldPersistTaps` is present** in the diff, and the `ActionButton` is not anchored — the prior recommendation #4 is entirely unaddressed.

### Remaining Risks

1. **No ScrollView / keyboard handling (blocking):** The sheet content appears to be rendered in a plain `View`. With the keyboard open on 360×740, the "Guardar gasto" button will be pushed off-screen or covered. This was explicitly flagged in the prior review and is unresolved.

2. **Amount parsing divergence (unresolved from prior):** `addExpense` still receives the raw string `expenseAmount` while the preview uses `parseMoneyInput`. If `addExpense` parses differently, preview and saved data diverge.

3. **`expensePreviewTotal` may not equal input:** `splitEqual` distributes cents; the preview total is the sum of shares, which could differ from `expenseAmountCents` by rounding remainder. The preview text displays this sum without reconciling against the input amount.