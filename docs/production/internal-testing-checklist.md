# Internal Testing Checklist

## Goal

Prepare Cuentas Claras for Google Play internal testing without pretending the
repo can upload an AAB from this environment. This checklist separates what is
ready locally from what still requires human-owned accounts, credentials, legal
approval, or Play Console access.

## Local Verification Before Build

Run from the app repo:

```bash
npm run typecheck
npm test
npx expo config --type public
npm run export:web
```

Expected local posture:

- App name: Cuentas Claras.
- Android package: `com.cuentasclaras.app`.
- Version: `0.1.0`.
- Android versionCode: `1`.
- Android permissions: none requested.
- Runtime version policy: app version.
- App remains local-first with no real payments.
- Settlement actions continue to show "Sin pagos reales".

## Assets To Confirm

Before Play upload:

- App icon exists and renders clearly.
- Android adaptive icon foreground exists.
- Splash image exists.
- Play listing icon candidate exists.
- Feature graphic candidate exists.
- Mobile screenshots are captured from the current UI, not stale MVP screens.

Screenshot scenarios:

- Group dashboard with realistic demo balances.
- Expense form with MXN amount.
- Balance view showing who pays and who receives.
- Settlement action with "Sin pagos reales" visible.
- Activity history after an expense and a marked-paid settlement.
- Account/demo-local screen if included in the internal build.

## Play Console Prerequisites

Human/operator owned:

- Google Play developer account.
- App created in Play Console.
- Package name confirmed before first upload.
- App signing strategy chosen.
- EAS account/project or local Android build environment chosen.
- Internal testing track configured.
- Tester email list or Google Group ready.
- Store listing draft, category, contact email, and app access answers ready.
- Privacy policy URL hosted publicly.
- Data Safety answers completed and reviewed.
- Account deletion URL ready if real account creation ships.

## Build Path

Preferred configured command after EAS/account setup:

```bash
npm run build:android:internal
```

Current environment blockers:

- `java` is not installed.
- Android SDK/Gradle tooling is not installed.
- EAS CLI/account credentials are not available.
- Play upload credentials and signing keys are not available.

Because of these blockers, this environment can verify config and app behavior
but cannot produce or upload a signed internal-testing AAB.

## Internal Test Smoke Script

For each internal build:

1. Install from Play internal testing link.
2. Launch cold from Android launcher.
3. Confirm splash/icon render correctly.
4. Confirm demo groups load.
5. Open a group and review total spent, balance, members, and activity.
6. Add a member with a realistic Spanish name.
7. Add an expense in MXN with a payer and note.
8. Confirm balances update and settlement suggestions are understandable.
9. Mark one settlement paid and confirm "Sin pagos reales" is visible nearby.
10. Confirm activity history records the expense and settlement.
11. Create or restore a demo local account only if that UI ships in the build.
12. Reset demo/local data if the build exposes that flow.
13. Close and reopen the app to confirm local persistence.
14. Test offline launch and core local flows.
15. Record screenshots or screen recording for the release log.

## Tester Feedback Questions

- Is it clear who owes and who should receive money?
- Is "Sin pagos reales" obvious before marking a settlement paid?
- Does the app feel trustworthy enough for informal shared expenses?
- Is any wording confusing for Mexico/LATAM Spanish?
- Are touch targets comfortable on small Android screens?
- Did any tester expect a real payment to happen?
- Did local data persist after closing and reopening?
- Did any state feel like banking, credit, tax, or investment functionality?

## Demo-Only Boundaries

Keep these explicit in tester notes:

- No real payments.
- No backend sync.
- No production account provider.
- No invite/collaboration flow.
- No receipt uploads.
- No analytics/ads instrumentation.
- No financial institution or money transmission claims.

## Exit Criteria For Internal Testing Readiness

Local/repo criteria:

- Typecheck passes.
- Unit tests pass.
- Expo public config resolves.
- Static web export works for visual smoke testing.
- App icon/splash/store asset candidates exist.
- Privacy/terms drafts exist and are reviewed by a human before publication.
- Security/data deletion model exists.
- Internal testing checklist is complete.

Human/operator criteria:

- Signed AAB produced.
- Play Console app and internal track configured.
- Privacy policy hosted.
- Data Safety completed.
- Store listing and screenshots reviewed.
- Tester list ready.
- Upload and rollout approved by the app owner.

## Do Not Upload Until

- The UI has passed a fresh product-quality review.
- Legal/privacy text has human approval.
- Data Safety answers match the exact build.
- Account deletion requirements are satisfied if real account creation is
  included.
- The app owner explicitly approves Play Console upload.
