# CUE-0028 Visual QA

## Screenshots

- `reports/evidence/CUE-0028/screenshots/mobile-360x740.png`
- `reports/evidence/CUE-0028/screenshots/mobile-412x915.png`

## Close-Resemblance Checklist

- Style 1 balance-first hierarchy: Pass. The first screen opens on the active
  group balance, with receive/pay amounts, one clear settlement, and next
  actions before secondary lists.
- Style 2 warmth secondary: Pass. Warmth is limited to the marigold top rule,
  local MXN chip, and light warm/tinted surfaces. The app does not read beige,
  brown, or decorative.
- Style 3 Android-native structure: Pass. The UI uses persistent bottom tabs,
  compact icon buttons, chips, action tiles, and touch-friendly controls.
- Small mobile first viewport: Pass. At 412x915, active group, balance, quick
  actions, primary settlement, and activity header are visible. At 360x740,
  text remains readable and the primary settlement section begins before the
  fold.
- Finance/trust first: Pass. Amounts, debt state, and local settlement copy are
  visually dominant; decorative cues stay secondary.
- Demo honesty: Pass. `Sin pagos reales` appears in the top trust cue, action
  rail, settlement card, and confirmation flow.
- Text fit: Pass. No amount collision, broken action labels, or overlapping UI
  was observed in the captured 360 px and 412 px screenshots.

## Manual Review Notes

- The 360 px screenshot necessarily clips the first settlement card at the
  bottom because the screen is short, but no text is clipped inside controls or
  cards.
- `Viaje a Oaxaca` wraps on the narrowest viewport because the group chip and
  icon share the row. This is acceptable for 360 px; the group identity remains
  obvious and readable.
- Remaining settlement suggestions are intentionally placed below activity so
  the first screen resembles the selected balance-first concept while keeping
  full settlement detail available by scrolling.

## Screenshot Method

Captured from isolated temp copy `/tmp/cue0028-visual` to avoid nested Palari
worktree Metro stale-source behavior.

Commands used:

- `npm run typecheck`
- `npm test`
- `npx expo config --type public`
- `npx expo export --platform web --output-dir dist --clear`
- `chromium --headless --no-sandbox --disable-dev-shm-usage --window-size=360,740 --virtual-time-budget=10000 --screenshot=reports/evidence/CUE-0028/screenshots/mobile-360x740.png http://127.0.0.1:63829/`
- `chromium --headless --no-sandbox --disable-dev-shm-usage --window-size=412,915 --virtual-time-budget=10000 --screenshot=reports/evidence/CUE-0028/screenshots/mobile-412x915.png http://127.0.0.1:63829/`
- `identify reports/evidence/CUE-0028/screenshots/mobile-360x740.png reports/evidence/CUE-0028/screenshots/mobile-412x915.png`

## Recommendation

Move to review. The app closely resembles the approved hybrid visual direction
and remaining decisions are founder review/acceptance, not blocked
implementation.
