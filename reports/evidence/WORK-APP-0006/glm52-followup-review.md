Verdict: accept-ready

**Residual risks:**
1. **Orphaned settlement subtitle copy mismatch:** The test expects `"Ana registró un cambio local · Cena"` for orphaned settlements, but `orphanedActivityFromEvent` uses `group?.name` (which resolves to "Cena" in the test data). This works for the current test, but the subtitle copy diverges from the non-orphaned settlement event path (`"Ana marcó registro local · Sin pagos reales"`). Minor inconsistency, but not blocking.
2. **`activityMetaLine` collision on 360px:** Pill + actor name with `flexWrap: "wrap"` can still push to a second line on narrow devices, increasing row height. Acceptable but unverified on small Android.
3. **`memberName` fallback still "Integrante":** Unchanged from prior review — acceptable but loses context for deleted members on older data.