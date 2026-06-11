# Play Internal Testing QA Readiness

## Current Verdict

Cuentas Claras is close to Google Play internal testing from a repo/config
standpoint, but not uploadable from this environment. The app still requires
human-owned Play Console access, signing/EAS credentials, hosted privacy URL,
Data Safety answers, and approval of CUE-0012/CUE-0013 gates before upload.

## Verified Locally On 2026-06-11

- `npm run release:android:check` passed.
- `npm run typecheck` passed.
- `npm test` passed with 5 files and 15 tests.
- `npx expo config --type public` resolved Android config.
- Android package: `com.cuentasclaras.app`.
- App version: `0.1.0`.
- Android versionCode: `1`.
- Android permissions: none requested.
- Runtime version policy: app version.
- `identify` verified release/store/screenshot dimensions.

## Asset Inventory

- App icon: `assets/icon.png`, 1024x1024.
- Adaptive icon foreground: `assets/adaptive-icon.png`, 1024x1024.
- Splash image: `assets/splash.png`, 1242x2436.
- Play listing icon candidate: `assets/store/icon-512.png`, 512x512.
- Feature graphic candidate: `assets/store/feature-graphic.png`, 1024x500.
- Mobile screenshot evidence:
  - `reports/evidence/CUE-0015/screenshots/mobile-360x740.png`, 360x740.
  - `reports/evidence/CUE-0015/screenshots/mobile-412x915.png`, 412x915.

## Official References Checked

- Google Play target API level requirements:
  https://developer.android.com/google/play/requirements/target-sdk
- Google Play store listing preview assets:
  https://support.google.com/googleplay/android-developer/answer/9866151?hl=en
- Google Play app review/privacy policy guidance:
  https://support.google.com/googleplay/android-developer/answer/9859455?hl=en
- Google Play Data Safety guidance:
  https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
- Expo app config:
  https://docs.expo.dev/versions/latest/config/app/

## Human-Owned Blockers

- Java/Android build tooling is unavailable locally.
- EAS CLI/account credentials are unavailable locally.
- Play developer account and app record are not available to this agent.
- Signing/app signing strategy requires owner approval.
- Privacy policy URL must be hosted and approved.
- Data Safety answers must be completed by the owner.
- CUE-0012 privacy/terms remains `needs-human`.
- CUE-0013 security/data deletion remains `needs-human`.
- App owner must approve store listing, screenshots, tester list, and rollout.

## Internal Testing Upload Runbook

1. Confirm final branch/tag and no unexpected dirty files.
2. Run `npm run release:android:check`.
3. Run `npx expo config --type public` and confirm package/versionCode.
4. Confirm assets and screenshots match the exact build.
5. Close or formally waive CUE-0012 and CUE-0013 human gates.
6. Host approved privacy policy URL.
7. Complete Play Console App content, Data Safety, App access, and store listing.
8. Configure EAS or local Android signing.
9. Run `npm run build:android:internal` from an authenticated environment.
10. Upload signed AAB to the Play internal testing track.
11. Add tester emails or Google Group.
12. Roll out internal test only after owner approval.

## Do Not Upload If

- Any UI copy implies real payments.
- Data Safety answers are not aligned with the exact build.
- Privacy/deletion URLs are missing where required.
- Signing credentials or Play tokens would need to be handled in this repo.
- A human owner has not approved the rollout.
