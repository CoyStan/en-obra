Verdict: accept-ready

- High issue resolved: `addExpense` now uses `validation.value.participantIds` instead of re-fetching all group members. Validation correctly accepts subsets, defaults to all members when none provided, and rejects invalid participant IDs.
- New tests cover both the subset-preservation path and the invalid-participant rejection path.
- Medium #2 resolved: `normalizeAppData` removed from `persistData`; `cloneDemoData` no longer redundantly normalizes already-normalized demo data.
- Low #6 resolved: `settlement` now has explicit `Settlement` type annotation.
- Residual risks: `syncOutbox` still grows unbounded (explicitly out of scope); v1 normalization heuristic for group-scoped member IDs remains fragile (documented limitation); no Android device testing performed.