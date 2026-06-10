# Google Play Internal Testing Readiness

## Current Posture

Cuentas Claras is a local-first Expo React Native app with no real payments, no
production backend, and no secrets. The goal for this phase is to make it very
close to Google Play internal testing while keeping production services mocked or
documented until human decisions are made.

## Current Play Requirements Researched

- Target API: Google Play requires new Android apps and updates submitted from
  August 31, 2025 to target Android 15 / API 35 or higher, except for certain
  non-phone form factors. Source:
  https://developer.android.com/google/play/requirements/target-sdk
- Internal testing: Play Console internal testing is intended for quick
  distribution to a small set of trusted testers without waiting for app review.
  Source: https://play.google.com/console/about/internal-testing/
- Data Safety: all developers must declare collected/shared data and security
  practices, including data handled by SDKs. Source:
  https://support.google.com/googleplay/android-developer/answer/10787469
- Account deletion: if the app allows account creation, it must provide an
  in-app path to delete accounts and associated data plus a web link resource.
  Source:
  https://support.google.com/googleplay/android-developer/answer/13327111
- Splash behavior: Android 12+ uses the platform SplashScreen API with app icon,
  icon background, and window background customization. Source:
  https://developer.android.com/develop/ui/views/launch/splash-screen

## Local Tooling Reality

- `java`, `keytool`, `gradle`, and `eas` are not installed in this environment.
- A signed AAB cannot be produced locally here without Java/Android tooling or
  EAS/Play credentials.
- Static web export and mobile screenshots work.
- Expo project config can be prepared for Android release builds without secrets.

## Production-Readiness Tickets

- `CUE-0008`: Auth/account model with local mock adapter.
- `CUE-0009`: Backend/sync architecture with replaceable local mock adapter.
- `CUE-0010`: Android release build readiness.
- `CUE-0011`: App icon, splash, and store assets.
- `CUE-0012`: Privacy/terms draft.
- `CUE-0013`: Security and data deletion model.
- `CUE-0014`: Internal testing checklist.

## Release Definition For This Phase

The app is "very close to internal testing" when:

- Expo Android app identity is configured with version and versionCode.
- App assets exist for icon, adaptive icon foreground, splash, screenshots, and
  feature graphic.
- Auth, sync, deletion, privacy, and terms are designed and present in-app or in
  documentation with mock adapters.
- `npm run typecheck`, `npm test`, Expo public config, and static export pass.
- Internal testing checklist identifies remaining human/tooling blockers:
  developer account, package signing, privacy policy URL, data deletion URL,
  Play Console Data Safety answers, and uploaded AAB.
