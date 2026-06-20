Verdict: needs-changes

**Findings:**

1. **`selectedUserId` function is now dead/misleading code.** The function at line 40 was updated to call `resolveActorUserId(data)` but is no longer called by `addExpense` or `markSettlementPaid` (both now call `resolveActorUserId` directly). If it's still referenced elsewhere, it silently ignores any passed actor and always falls back — an audit-trail mismatch risk. If unused, it should be removed.

2. **`resolveActorUserId` signature/precedence is unverified.** The diff shows `resolveActorUserId(current, input.actorUserId)` and `resolveActorUserId(current, actorUserId)`, but the implementation is not included. Correct behavior depends on: when the second argument is provided and non-stale, it must win; otherwise fall back to `data.selectedUserId` → demo user. If the resolver instead always prefers `data.selectedUserId` first, the active group member identity would be silently overridden — a stale-identity bug. This needs human or code confirmation.

3. **`activeActorUserId` computed once per render (MainScreen line 392).** It captures `activeGroupMember?.userId` at render time. If the user switches group member between render and the `addExpense`/`markSettlementPaid` callback firing (unlikely but possible with stale closures in React), the actor could be stale. Low risk but worth noting.

4. **No test shown for settlement actor threading.** The report claims unit coverage for active actor resolution and stale fallback, but the diff includes no test file changes. If tests are pre-existing or in an un-diffed file, this is fine; otherwise the claim is unsubstantiated.

**Bottom line:** The wiring looks correct in principle, but the missing `resolveActorUserId` implementation and the orphaned `selectedUserId` function create enough ambiguity to block accept-ready. Recommend confirming the resolver's precedence and cleaning up or removing `selectedUserId`.