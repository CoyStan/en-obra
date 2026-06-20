# Privacy And Terms Readiness

## Current State

Cuentas Claras has draft Spanish privacy and terms documents for internal
testing preparation:

- `docs/legal/privacy-policy-draft.md`
- `docs/legal/terms-draft.md`

They are not final legal documents and should not be published until reviewed
and approved by a human with authority for legal/compliance decisions.

Official references checked on 2026-06-20:

- Google Play review/privacy policy guidance:
  https://support.google.com/googleplay/android-developer/answer/9859455?hl=en
- Google Play Data Safety guidance:
  https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
- Google Play account deletion policy explanation:
  https://android-developers.googleblog.com/2024/03/designing-your-account-deletion-experience-google-play.html

## Current Data Posture

The app is currently local-first:

- no production backend,
- no real authentication provider,
- no real payments,
- no analytics SDK,
- no ads SDK,
- no push notifications,
- no location permission,
- no contacts permission,
- no camera/photo/receipt upload,
- no requested Android permissions in `app.json`.

Local app data can include groups, member names, expense concepts, amounts,
dates, notes, settlements, activity history, and demo account fields. Current
docs should describe these as local device data, not server-collected data.

## Draft Google Play Data Safety Direction

This needs human confirmation before submission:

- Data collected by Cuentas Claras servers: likely "No" for the current local
  build because the app does not transmit user data to a backend.
- Data shared with third parties by the app: likely "No" for the current local
  build.
- Data encrypted in transit: not applicable to app-owned user data until a
  backend exists.
- Data deletion request: local uninstall/clear-data covers local storage, but a
  public deletion URL and in-app deletion path are required if production
  account creation or server-side data is added.
- Financial information: user-entered expense amounts exist locally; Data Safety
  answers must follow Google Play definitions for collected/transmitted data.

## Required Human Decisions

- Legal entity/responsible party.
- Jurisdiction and governing law posture.
- Privacy/support contact email.
- Public privacy policy URL for Play Console.
- Whether to publish terms in-app, on the web, or both.
- Whether the internal test build will include account UI as local demo only.
- Data Safety answers in Play Console.
- Account/data deletion URL if real accounts or backend sync ship.
- Final age/minor policy.
- Final liability, warranty, and dispute language.

## Release Checklist

Before Play internal testing:

- Host approved privacy policy at a public URL.
- Ensure Play Console privacy URL matches the approved document.
- Confirm app screenshots and store copy do not imply real payments.
- Confirm app UI says "Sin pagos reales" near settlement actions.
- Confirm `app.json` requested Android permissions remains accurate.
- Confirm no analytics, ads, crash reporting, or backend SDK was added without
  updating privacy/Data Safety answers.
- Confirm legal owner and support email are ready for store listing.

Before production account/backend launch:

- Add in-app account deletion flow.
- Add public data deletion request URL.
- Define retention windows and deletion fulfillment process.
- Update privacy policy and terms for backend, auth provider, sync, diagnostics,
  incident handling, and support workflows.
- Re-run security and privacy review.

## Non-Goals For This Ticket

- No legal approval.
- No Play Console submission.
- No privacy URL hosting.
- No account deletion implementation.
- No backend, analytics, ads, payment, or third-party SDK integration.
