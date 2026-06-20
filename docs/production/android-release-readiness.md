# Android Release Build Readiness

## Current State

The app is configured as an Expo Android app with:

- package id: `com.cuentasclaras.app`
- app version: `0.1.0`
- Android `versionCode`: `1`
- runtime version policy: `appVersion`
- requested Android permissions: none
- EAS internal build profile: app bundle (`.aab`)

## Commands

Local verification:

```bash
npm run release:android:check
```

This command includes the backend release gate. The gate requires the
release secret/config safety scan, which fails on committed API keys, payment
keys, Play service-account credentials, private keys, or premature production
backend URLs in release-facing config.

Internal testing build path, after EAS and credentials exist:

```bash
npm run build:android:internal
```

Static web smoke build:

```bash
npm run export:web
```

## Play Readiness Notes

Google Play requires new Android apps and updates to target Android 15 / API 35
or higher from August 31, 2025. Expo SDK 56 / React Native 0.86 should be kept
current and verified before submission.

## Known Hard Blockers In This Environment

- `java` is not installed.
- Android SDK/Gradle tooling is not installed.
- `eas` CLI is not installed globally.
- No Expo account, EAS project, Play developer account, signing credentials, or
  Play upload credentials are present.

Because of those blockers, this repo is configured for release readiness but
cannot produce a signed uploadable AAB locally in this environment.

## Human/Operational Inputs Still Needed

- Google Play developer account.
- Expo/EAS project ownership decision or local native Android build decision.
- App signing strategy.
- Privacy policy URL.
- Account deletion URL if production account creation ships.
- Data Safety answers.
- Internal tester email list.
- Final store listing copy and images.
