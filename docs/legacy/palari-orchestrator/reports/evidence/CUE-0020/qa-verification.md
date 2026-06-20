# CUE-0020 QA Verification

## Commands

- `npm run release:android:check`: passed.
- `identify assets/icon.png assets/adaptive-icon.png assets/splash.png assets/store/icon-512.png assets/store/feature-graphic.png reports/evidence/CUE-0015/screenshots/mobile-360x740.png reports/evidence/CUE-0015/screenshots/mobile-412x915.png`: passed.
- `command -v java`: not found.
- `command -v eas`: not found.

## Verified Dimensions

- `assets/icon.png`: 1024x1024.
- `assets/adaptive-icon.png`: 1024x1024.
- `assets/splash.png`: 1242x2436.
- `assets/store/icon-512.png`: 512x512.
- `assets/store/feature-graphic.png`: 1024x500.
- `reports/evidence/CUE-0015/screenshots/mobile-360x740.png`: 360x740.
- `reports/evidence/CUE-0015/screenshots/mobile-412x915.png`: 412x915.

## Blockers Confirmed

- No local Java binary.
- No local EAS binary.
- No Play Console account or signing credentials available to this agent.
- No human approval for privacy/terms or security/data deletion gates yet.
