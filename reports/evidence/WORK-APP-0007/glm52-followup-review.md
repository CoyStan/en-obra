Verdict: accept-ready

**Residual risks:**

1. **Stale closure in `addExpense` (useAppData.ts line ~155).** The `useCallback` depends on `[data.groups, updateData]`, but it reads `getGroupMembers(data, groupId)` and `validateExpenseInput` from the render-time `data` snapshot. If group members change between render and the callback firing, validation could use a stale member list. Low risk in typical single-user demo flows, but a potential correctness issue if the app ever supports concurrent edits or rapid member additions.

2. **`activeActorUserId` computed once per render (MainScreen.tsx line ~392).** It captures `activeGroupMember?.userId` at render time. If the user switches group member between render and the `addExpense`/`markSettlementPaid` callback firing (unlikely but possible with stale closures in React), the actor could be stale. Low risk but worth noting.

3. **No test coverage for `defaultActorUserId` fallback path.** The test file covers `resolveActorUserId` with a valid requested user and a stale requested user, but does not test the no-`requestedUserId` fallback path (i.e., `defaultActorUserId` calling `resolveActorUserId(data)` with no second argument). The `createGroup` and `addMember` flows use this path, and a regression there would silently misattribute activity events.