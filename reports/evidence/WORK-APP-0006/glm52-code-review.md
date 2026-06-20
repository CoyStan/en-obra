Verdict: needs-changes

**1. Audit Trail Progress:** Strongly advances toward a premium multi-user audit trail. Event-type labels, actor identity, and explicit local/no-real-payment cues are well executed. The fallback merge logic correctly prevents duplicate rows when `activityEvents` partially cover expenses/settlements.

**2. Bugs in buildActivity / Lookup:**
- **Fallback subtitle inconsistency:** Fallback expense rows use `"Dividido entre N integrantes"` while event-sourced rows use `"N participantes"`. This is a copy inconsistency that will be visible to users.
- **Orphaned event fallback:** If an `activityEvent` references an `entityId` for an expense/settlement that doesn't exist in `data`, `activityFromEvent` falls through to the `group` default branch, producing a misleading "creó el grupo" row. Should return a minimal/synthesized row from `event.summary` instead.
- **Member name lookup:** `userName` falls back to `"Alguien"` which is acceptable, but `memberName` falls back to `"Integrante"`. If `actorUserId` is absent on older data, `actorName` is `undefined` and the actor line is hidden — reasonable, but fallback rows lose actor context entirely.

**3. UX Risk on Small Android Rows:**
- The new `activityMetaLine` (Pill + actor name) stacked above the title adds vertical height per row. Combined with `numberOfLines={2}` on title, rows may grow tall on 360px-width devices. The `activityAmount` column (date + amount) is right-aligned and could collide or wrap awkwardly with long actor names since `activityActor` has `flexShrink: 1` but the meta line `flexWrap: "wrap"` could push to a second line.
- Subtitle strings are long (e.g., `"Ana registró · Pagó Ana · 3 participantes"`). On 360px these will truncate. No `numberOfLines` is set on subtitle, so it may wrap to 2+ lines unpredictably. Add `numberOfLines={2}` to subtitle.

**4. Accept-Readiness:** Not accept-ready. Fix the orphaned-event fallback, align copy between event-sourced and fallback paths, and add `numberOfLines` to the subtitle. These are small, mechanical fixes — no human/design gate needed beyond the existing Company OS requirement.