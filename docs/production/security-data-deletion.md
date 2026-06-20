# Security And Data Deletion Model

Official references checked on 2026-06-20:

- Google Play account deletion policy explanation:
  https://android-developers.googleblog.com/2024/03/designing-your-account-deletion-experience-google-play.html
- Google Play Data Safety guidance:
  https://support.google.com/googleplay/android-developer/answer/10787469?hl=en

## Current Security Posture

Cuentas Claras is currently a local-first Expo app:

- no production backend,
- no real payment rails,
- no banking credentials,
- no analytics or ads SDK,
- no requested Android permissions,
- no secrets in the app repo,
- no production account provider.

The app stores user-entered group, member, expense, settlement, local account,
and mock sync state on the device with AsyncStorage. AsyncStorage is appropriate
for the current demo/local MVP, but it should not be described as encrypted
storage. A person with device access, backups, debug tooling, or screenshots may
access local data.

## Local Data Inventory

Current local storage keys:

- `cuentas-claras:v1`: groups, members, expenses, settlements, selected group,
  and local activity source data.
- `cuentas-claras:sync:v1`: mock sync queue and sync mode state.
- `cuentas-claras:account:v1`: local mock account profile, display name, email,
  provider, and sign-in timestamps.

Implemented helper:

- `deleteLocalUserData()` in `src/security/dataDeletion.ts`

The helper removes all current app-owned AsyncStorage keys and returns a
structured result describing what was cleared and why remote deletion is not yet
configured.

## Deletion Behavior

Current local-only deletion path:

1. Confirm the person wants to delete local Cuentas Claras data.
2. Call `deleteLocalUserData()`.
3. The helper removes app data, mock sync state, and local mock account state.
4. On next launch, empty storage loads demo data and no local account profile.

The helper is exposed in Perfil behind a deliberate confirmation action. The UI
also restores a clean local demo after deletion so internal testers can keep
using the app without creating backend data.

## Remote Deletion

Remote deletion is not configured because no production backend exists. Before a
real backend or account provider ships, the product needs:

- in-app account deletion flow,
- public data deletion request URL,
- authenticated deletion request handling,
- deletion status and retry UX,
- backend deletion job with audit trail,
- backup/retention policy,
- support escalation path,
- privacy policy and Google Play Data Safety updates.

The existing sync adapter already has a `clearRemoteData(accountId)` boundary,
but the current implementation is a local mock. Production code must replace it
with a real backend deletion workflow before accounts/sync are marketed as real.

## Security Rules For Internal Testing

- Keep "Sin pagos reales" visible near settlement actions.
- Do not collect banking, SPEI, card, tax, or government identity data.
- Do not add analytics, ads, crash reporting, backend SDKs, or payments without
  updating privacy, security, and Data Safety docs.
- Do not commit API keys, signing credentials, Play credentials, or EAS tokens.
- Treat screenshots and demo data as potentially sensitive if they contain real
  names or expenses.
- Use device lock screen and avoid testing with real sensitive expenses.

## Future Production Requirements

Before production backend launch:

- choose auth provider and region,
- define encryption in transit and at rest,
- define access controls and least-privilege operational roles,
- define incident response and user notification workflow,
- define logs/observability with data minimization,
- define retention and deletion SLAs,
- run security review against the actual backend and mobile build.

## Human Blockers

- Legal/privacy approval for deletion promises.
- Backend provider and data residency decision.
- Public deletion URL ownership.
- Support process owner.
- Security review for any production sync or account flow.
