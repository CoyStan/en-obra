# CUE-0015 Visual Verification

## Result

Screenshot capture now has accepted theme evidence from an isolated temp
worktree run, plus fresh multi-viewport Android-sized captures.

## What Worked

- Expo web served the CUE-0015 theme branch from
  `/tmp/cuentas-claras-cue0015-run`.
- The temp run copy used a local hardlinked `node_modules` tree instead of a
  symlink to the parent repo, preventing Metro from resolving stale parent
  source.
- Headless Chromium captured a nonblank mobile viewport PNG at 390x844.
- Headless Chromium captured nonblank mobile viewport PNGs at 360x740 and
  412x915 after the branch was synced with current main.
- The screenshot shows the expected professional theme: cool gray canvas,
  Telegram-like blue accent, smaller brand mark, "cuentas claras" title copy,
  and "Perfil" bottom tab.

## Current Evidence

- `reports/evidence/CUE-0015/theme-preview.png`
- `reports/evidence/CUE-0015/screenshots/mobile-360x740.png`
- `reports/evidence/CUE-0015/screenshots/mobile-412x915.png`

## Final Capture Notes

- Source was copied to `/tmp/cuentas-claras-cue0015-run` outside the nested
  Palari worktree.
- Full installed dependencies were hardlinked from the canonical repo.
- `npm run export:web` succeeded from the temp copy.
- A static server served `dist` on `127.0.0.1:19015`.
- Chromium captured both screenshots with DBus warnings only; image dimensions
  were verified with ImageMagick `identify`.

## Earlier Stale Capture Issue

The CUE-0015 worktree is nested under the canonical repo at
`.palari/worktrees/CUE-0015`. Expo/Metro resolved the web bundle against the
parent canonical repo source instead of the edited ticket worktree source. The
captured screenshots therefore showed stale UI copy such as "sin vueltas" and
"Cuenta" even though the ticket source contains "cuentas claras" and "Perfil".

The stale screenshots were removed to avoid misleading review evidence. The
accepted screenshot was captured only after replacing the temp run copy's
`node_modules` symlink with a local hardlinked dependency tree.

## Commands Attempted

- `npm run export:web`
- `npx expo export --platform web --output-dir dist --clear`
- `EXPO_NO_METRO_WORKSPACE_ROOT=1 npx expo export --platform web --output-dir dist --clear`
- temp copy export from `/tmp/cue0015-visual`
- `chromium --headless --screenshot=... --window-size=360,740`
- `chromium --headless --screenshot=... --window-size=412,915`
- `chromium --headless --no-sandbox --disable-dev-shm-usage --window-size=390,844 --virtual-time-budget=10000 --screenshot=reports/evidence/CUE-0015/theme-preview.png http://localhost:8083`

## Remaining Follow-Up

For final acceptance, a reviewer should inspect the screenshots directly. No
additional screenshot blocker is known for CUE-0015.
