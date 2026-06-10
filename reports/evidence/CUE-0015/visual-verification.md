# CUE-0015 Visual Verification

## Result

Screenshot capture was attempted but not accepted as final evidence.

## What Worked

- `npm run export:web` completed.
- Headless Chromium captured mobile viewport PNGs at 360x740 and 412x915.
- The exported app rendered nonblank.

## Why Screenshots Were Not Kept

The CUE-0015 worktree is nested under the canonical repo at
`.palari/worktrees/CUE-0015`. Expo/Metro resolved the web bundle against the
parent canonical repo source instead of the edited ticket worktree source. The
captured screenshots therefore showed stale UI copy such as "sin vueltas" and
"Cuenta" even though the ticket source contains "cuentas claras" and "Perfil".

The stale screenshots were removed to avoid misleading review evidence.

## Commands Attempted

- `npm run export:web`
- `npx expo export --platform web --output-dir dist --clear`
- `EXPO_NO_METRO_WORKSPACE_ROOT=1 npx expo export --platform web --output-dir dist --clear`
- temp copy export from `/tmp/cue0015-visual`
- `chromium --headless --screenshot=... --window-size=360,740`
- `chromium --headless --screenshot=... --window-size=412,915`

## Recommended Follow-Up

After CUE-0015 is merged or checked out outside the canonical repo nesting,
rerun:

```bash
npm run export:web
python3 -m http.server 19015 --bind 127.0.0.1 --directory dist
chromium --headless --disable-gpu --no-sandbox --screenshot=reports/evidence/CUE-0015/screenshots/mobile-360x740.png --window-size=360,740 http://127.0.0.1:19015
chromium --headless --disable-gpu --no-sandbox --screenshot=reports/evidence/CUE-0015/screenshots/mobile-412x915.png --window-size=412,915 http://127.0.0.1:19015
```
