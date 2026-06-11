# CUE-0018 Balance Verification

## Result

Balance, settlement, and activity copy changes are covered by focused unit tests
and app-level checks.

## Checks

- `npm run typecheck` passed.
- `npm test` passed with 5 files and 15 tests.
- `src/__tests__/balances.test.ts` covers balance explanation copy, expense
  split activity copy, and paid-settlement local-only activity copy.

## Manual Review Notes

- Balance rows no longer rely on color alone; they explain paid amount, owed
  amount, and settlement adjustments in text.
- Settlement cards say the payment is external and continue to show "Sin pagos
  reales".
- Activity history explains whether an item is an expense split or a local paid
  settlement record.

## Screenshot Evidence

CUE-0015 already contains accepted small/mobile shell screenshots. CUE-0018 uses
behavior-focused tests for the changed balance and activity copy; no new
interaction screenshot was captured.
