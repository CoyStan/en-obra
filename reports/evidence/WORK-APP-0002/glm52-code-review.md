## Code Review: WORK-APP-0002

Verdict: needs-changes

### Summary

The committed diff successfully introduces SQL-ready local entities (`users`, `group_members`, `expense_participants`, `activity_events`, `sync_outbox`) and preserves offline/local-first demo behavior. Money is safely handled as integer cents, and equal splits are mathematically sound. However, there is a significant bug in the `addExpense` action that overrides user-selected participants with all group members, along with a few minor normalization and state issues that should be fixed before accept-ready.

---

### Findings by Severity

#### High

1. **`addExpense` ignores user-selected participants** — `src/state/useAppData.ts` (lines ~295-305)
   - The `addExpense` callback validates `input` against `groupMemberIds`, but then hardcodes `participantIds` by fetching all group members again: `const participantIds = getGroupMembers(current, groupId).map((member) => member.id);`. This completely ignores `validation.value.participantIds` (or `input.participantIds`) if the user selected a subset of members. Every expense will be split among all group members regardless of user choice.
   - **Fix:** Use the validated participant IDs from the input/validation result, falling back to all group members only if none are provided.

#### Medium

2. **`persistData` normalizes on every write** — `src/state/storage.ts` (line ~34)
   - `persistData` calls `normalizeAppData(data)` before saving. This means every save operation runs the full normalization logic (including `splitEqual` for any expenses missing participants). While not catastrophic for an MVP, it adds unnecessary overhead on every state mutation and could mask data integrity issues by silently "fixing" them on write rather than at the boundary.
   - **Recommendation:** Normalize only on load (`loadPersistedData`), not on every persist. The in-memory state should already be normalized after load and after each action.

3. **`cloneDemoData` normalizes already-normalized data** — `src/state/storage.ts` (line ~24)
   - `cloneDemoData` deep-clones `demoData` (which is already v2) and then runs `normalizeAppData` on it. This is harmless but redundant. The normalization function does handle v2 input correctly (it checks `data.users?.length`, `data.groupMembers?.length`, etc.), so it's a no-op, but it adds unnecessary computation on every cold start and reset.

4. **Legacy normalization creates duplicate users for shared members** — `src/domain/appDataNormalization.ts` (lines ~6-14)
   - `legacyUsers` creates one `User` per `Member`. In v1 demo data, the same person (e.g., "Ana") appeared as a single member across multiple groups. After normalization, `legacyGroupMembers` maps each group's `memberIds` to these users. This works if v1 members were globally unique (as they were in the old demo data with IDs like `member-ana`). However, if any v1 data had group-scoped member IDs (e.g., `member-oaxaca-ana` and `member-roma-ana` for the same person), normalization would create two separate users for the same person. The `userIdForMember` heuristic (`user-${memberId.replace(/^member-/, "")}`) would produce `user-oaxaca-ana` and `user-roma-ana` — two different users for what should be one person.
   - **Risk:** Low for current v1 data shapes, but the heuristic is fragile. Document this limitation or add a note that v1 data with group-scoped member IDs may produce duplicate users.

#### Low

5. **`expenseParticipantCount` re-filters participants unnecessarily** — `src/domain/balances.ts` (lines ~83-86)
   - `expenseParticipantCount` filters `data.expenseParticipants` to count participants, but `expenseParticipantShares` already does the same filter. These are called sequentially in `buildActivity`. Minor inefficiency, not a bug.

6. **`settlement` object lacks explicit `Settlement` type annotation** — `src/state/useAppData.ts` (line ~356)
   - The `settlement` const in `markSettlementPaid` is untyped (inferred). It works because the shape matches, but adding an explicit `const settlement: Settlement = {...}` would catch future drift.

7. **`activityEvents` ordering uses prepend (LIFO)** — `src/state/useAppData.ts` (multiple locations)
   - New events are prepended: `activityEvents: [event, ...(current.activityEvents ?? [])]`. This is consistent and fine for display (most recent first), but `buildActivity` in `balances.ts` sorts by date anyway. No bug, just noting the pattern.

8. **`selectedUserId` fallback to `"user-local-demo"`** — `src/state/useAppData.ts` (line ~35)
   - If `data.users` is empty or undefined and `selectedUserId` is unset, the fallback is `"user-local-demo"` — a user that doesn't exist. This could produce orphan activity events. In practice, `normalizeAppData` ensures `selectedUserId` is set to `users[0]?.id`, so this path should not be reached after normalization. Still, the fallback is a code smell.

9. **`splitEqual` import in `demoData.ts` depends on `./domain/money`** — `src/data/demoData.ts` (line 2)
   - The `splitEqual` function is used at module load time to generate `expenseParticipants`. If `splitEqual` has any side effects or throws for edge cases (e.g., 0 participants), the module import would fail. The current implementation is pure and safe, but this coupling means demo data generation is not static — it's computed at import time.

---

### Residual Risks

- **No backend sync is implemented** — `syncOutbox` items are created but never processed. This is explicitly out of scope and acceptable, but the outbox will grow unbounded during extended local use. A future ticket should add cleanup or a cap.
- **No Android emulator/device testing** — only web export and Expo config were verified. The screenshot is a web smoke screenshot at 360x740, not a real Android build.
- **`isAppData` type guard accepts both v1 and v2** — `src/state/storage.ts` (line ~13). This is correct for backward compatibility, but there's no schema validation for v2 shape (e.g., ensuring `users` array exists for v2). A corrupted v2 document with missing `users` would pass the guard and then be normalized with empty arrays.

---

### Recommended Next Steps

1. **Fix the `addExpense` participant bug (High)** — use validated input participant IDs instead of all group members.
2. **Remove `normalizeAppData` from `persistData`** — normalize only on load; trust in-memory state during writes.
3. **Add a test for partial participant selection** — verify that selecting 2 of 5 members produces an expense split between only those 2.
4. **Add explicit `Settlement` type to the `settlement` const in `markSettlementPaid`**.
5. **Document the v1 normalization limitation** for group-scoped member IDs in `appDataNormalization.ts`.
6. After fixes, re-run `npm test` and `npm run typecheck` to confirm no regressions.