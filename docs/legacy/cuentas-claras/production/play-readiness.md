# Google Play Internal Testing Readiness

## Current Posture

Cuentas Claras is a local-first Expo React Native app with no real payments, no
production backend, and no secrets. The goal for this phase is to make it very
close to Google Play internal testing while keeping production services mocked or
documented until human decisions are made.

## Current Play Requirements Researched

Official references checked on 2026-06-20:

- Target API: Google Play requires new Android apps and updates submitted from
  August 31, 2025 to target Android 15 / API 35 or higher, except for certain
  non-phone form factors. Source:
  https://developer.android.com/google/play/requirements/target-sdk
- Internal testing: Play Console internal testing can distribute to up to 100
  testers and can be started before all app setup is complete. Source:
  https://support.google.com/googleplay/android-developer/answer/9845334
- Release upload: Google Play release tracks use an Android App Bundle for new
  apps. Source:
  https://support.google.com/googleplay/android-developer/answer/9859348
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
- `eas.json` already defines `internal` and `production` Android app-bundle
  profiles, plus a `preview-apk` internal distribution profile.

## Company OS Work Items

- `WORK-APP-0001`: Premium Android visual system redesign; reviewed
  accept-ready, waiting on human approval.
- `WORK-APP-0002`: Local-first user and group account model; reviewed
  accept-ready, waiting on human approval.
- `WORK-APP-0003`: Android internal testing readiness; current release-readiness
  work item.

Older `CUE-*` records are legacy Palari Orchestrator history and should not be
used as the forward workflow.

## Release Definition For This Phase

The app is "very close to internal testing" when:

- Expo Android app identity is configured with version and versionCode.
- App assets exist for icon, adaptive icon foreground, splash, screenshots, and
  feature graphic.
- Auth/account, sync, deletion, privacy, and terms are designed in documentation
  with local/mock adapters where implementation exists.
- `npm run typecheck`, `npm test`, Expo public config, and static export pass.
- Internal testing checklist identifies remaining human/tooling blockers:
  developer account, package signing, privacy policy URL, data deletion URL,
  Play Console Data Safety answers, and uploaded AAB.
