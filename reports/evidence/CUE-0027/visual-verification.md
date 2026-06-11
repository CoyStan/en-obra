# CUE-0027 Visual Verification

## Screenshots

- `reports/evidence/CUE-0027/screenshots/mobile-360x740.png`
- `reports/evidence/CUE-0027/screenshots/mobile-412x915.png`

## Result

- The first screen now opens on the active group balance view.
- The top module shows app name, compact Android utility actions, active group,
  member count, member avatars, MXN local chip, receive/pay balance, and local
  trust cue.
- The palette follows CUE-0026: agave/teal primary, cool neutral canvas,
  small marigold accent line, and restrained red for debt.
- The quick action rail shows `Agregar gasto`, `Integrante`, and `Liquidar`
  with `Sin pagos reales`.
- One primary settlement appears before the activity preview; remaining
  settlements are preserved lower in the scroll.
- The 412 px screenshot shows active group, balance, quick actions, settlement,
  and activity header in the first viewport.
- The 360 px screenshot keeps amount and action text readable without overlap.

## Screenshot Method

The nested Palari worktree triggers stale Metro resolution for static export.
As documented in CUE-0015, trustworthy screenshots were captured from an
isolated temp copy at `/tmp/cue0027-visual` with a local hardlinked
`node_modules` tree.

Commands used:

- `rsync -a --delete --exclude .git --exclude .palari --exclude node_modules --exclude dist ./ /tmp/cue0027-visual/`
- `cp -al /home/quetza/projects/cuentas-claras/node_modules /tmp/cue0027-visual/node_modules`
- `npx expo export --platform web --output-dir dist --clear`
- `chromium --headless --no-sandbox --disable-dev-shm-usage --window-size=360,740 --virtual-time-budget=10000 --screenshot=... http://127.0.0.1:63828/`
- `chromium --headless --no-sandbox --disable-dev-shm-usage --window-size=412,915 --virtual-time-budget=10000 --screenshot=... http://127.0.0.1:63828/`
- `identify reports/evidence/CUE-0027/screenshots/mobile-360x740.png reports/evidence/CUE-0027/screenshots/mobile-412x915.png`

## Remaining Visual Follow-Up

- CUE-0028 should perform final visual QA against
  `docs/product/visual-direction.md` and decide whether to compact the 360 px
  first viewport further.
