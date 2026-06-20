Verdict: needs-changes

### Findings

**1. Premium Goal Alignment**
The diff materially advances the premium, multi-user goal. Introducing the `expenseIdentityBand`, `Sin pagos reales` trust chip, and `splitPreview` directly addresses the product requirements. The copy shifts to plain Spanish (`Quién participa`, `Dividido en partes iguales`, `Registro local`), successfully moving away from accounting jargon.

**2. Cognitive Load & 360px Layout**
The sheet is likely too heavy for 360px Android devices. Rendering `selectedMembers` twice (once for payer, once for participants) as full-width rows with avatars, text, and icons will cause severe vertical scrolling. The `expenseIdentityBand` and `splitPreview` add further vertical weight. On a 360x740 viewport with the keyboard open, the "Guardar gasto" button will likely be pushed off-screen, violating the "keep Save button reachable with keyboard open" requirement.

**3. React Native State & UX Bugs**
- **Payer validation gap:** The disabled state checks `!payerId`, but if the user selects a payer, then deselects them as a participant, the payer remains `payerId` but is excluded from the split. The app allows saving an expense where the payer isn't participating, which might be confusing for equal-split UX unless explicitly intended.
- **Amount parsing:** `parseMoneyInput` is used for the preview, but `addExpense` still receives the raw string `expenseAmount`. If `addExpense` doesn't parse it identically, the preview and saved data could diverge.

**4. Accessibility**
- Semantics are generally strong: `accessibilityRole="checkbox"` and `accessibilityState` are correctly applied to participant toggles.
- However, the payer selection uses `accessibilityRole="button"` without a clear state indication (selected/unselected) for screen readers. It should use `accessibilityState={{ selected: payerId === member.id }}`.

### Recommended Changes
1. **Reduce Visual Weight:** Change the `peopleGrid` for both payer and participants to a more compact layout (e.g., horizontal chips or a 2-column grid) to save vertical space on narrow screens.
2. **Fix Payer/Participant Logic:** Ensure that selecting a payer automatically includes them in `participantIds`, or explicitly handle the UX where the payer is not a participant (e.g., "Pagó por todos").
3. **Accessibility:** Add `accessibilityState={{ selected: payerId === member.id }}` to the payer `Pressable`.
4. **Scrolling:** Ensure the bottom sheet content is wrapped in a `ScrollView` with `keyboardShouldPersistTaps="handled"` and that the submit button is anchored or easily reachable above the keyboard.