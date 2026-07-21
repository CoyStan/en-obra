# Cuenta Obra production data map

## Purpose

This is the privacy and storage boundary for the paid product. It describes the
future production system, not a claim about the current local demo. The rule is
simple: Cuenta Obra stores the smallest useful operational record; original
delivery photos remain in the provider's Google Drive.

## Current prototype versus production

| Area | Current prototype | Required paid product |
| --- | --- | --- |
| Identity | No real account; demo is local | Authenticated provider account and workspace ownership |
| Work data | AsyncStorage on one device | Local offline cache plus provider-owned cloud workspace |
| Client access | Same app screen / WhatsApp handoff | Revocable, read-only client link with a scoped token |
| Proof photos | Not captured yet | Original files in provider's Drive; only references in Cuenta Obra |
| Billing | None | Play purchase entitlement, validated server-side |
| Deletion | Prototype local storage only | Account deletion, remote deletion workflow, export, and documented retention |

The current `AsyncStorage` tracker key is appropriate for a prototype but must
not be described as encrypted storage, cloud backup, multi-device sync, or a
real account system.

## Data inventory and ownership

| Data | Examples | System of record | Who can access it | Deletion / retention rule |
| --- | --- | --- | --- | --- |
| Provider account | account ID, display name, verified login identifier | Auth provider + Cuenta Obra account table | Provider; minimal support staff | Retain only while account is active, then delete/anonymize under the final policy |
| Provider workspace | workspace ID, owner, plan and entitlement state | Cuenta Obra database | Provider; tightly scoped operations staff | Delete with account unless a lawful retention reason is approved |
| Client contact | name, WhatsApp number, work address | Cuenta Obra workspace database | Provider; client never receives other client records | Delete with the work/account, or earlier at provider request |
| Supplier contact | name, phone, category, last agreement note | Cuenta Obra workspace database | Provider only | Delete with the work/account, or earlier at provider request |
| Work record | job name, service, status, material quantities, delivery state, timestamps | Cuenta Obra workspace database + offline cache | Provider; client only through a scoped share view | Delete with the work/account; export before irreversible deletion when requested |
| Delivery-proof metadata | material ID, note, confirmed time, Drive file ID/link | Cuenta Obra workspace database | Provider; client only if provider explicitly includes it in their share view | Remove with the work/account; Drive original follows the provider's Drive rules |
| Original delivery proof | photo/video/receipt | Provider's normal visible `Cuenta Obra` Google Drive folder | Provider; client only if provider shares it | Cuenta Obra does not own or silently delete the original Drive file |
| Client share link | opaque token hash, allowed fields, expiry, revocation time | Cuenta Obra database | Token holder sees only one permitted work view | Expire/revoke on provider action, work completion, or account deletion |
| Billing record | Play purchase token, product ID, entitlement dates, validation result | Cuenta Obra billing service | Provider; limited billing support | Keep only the minimum needed for support, fraud prevention, tax/accounting obligations, and final policy |
| Support record | request, timestamp, resolution, account reference | Support system | Provider and authorized support staff | Retention period must be approved before launch |
| Diagnostics | crash version, device/app metadata, error code | Monitoring service | Engineering only | No work content, phone numbers, proof links, or raw client/supplier names in logs |

## Access rules

1. Every server record belongs to exactly one provider workspace.
2. A client is not a workspace member. A client link can expose only the
   selected work, its safe material progress, and provider-selected proof.
3. Client links never expose supplier names, supplier contact information,
   internal notes, costs, billing status, or other works.
4. Support access is exceptional, logged, least-privilege, and never based on a
   shared production password.
5. Google Drive access uses the narrow `drive.file` scope. The app works only
   with files it creates or that the provider deliberately selects/shares.

## Offline and sync rules

- Create and update work data locally first; do not require signal to record a
  delivery.
- Give every synced record a server ID, workspace ID, `createdAt`, `updatedAt`,
  and server revision. The client queues mutations with an idempotency key.
- A sync retry may never create a second material, share link, or proof record.
- A server-side authorization check runs for every mutation and every client
  share request; the app UI alone is not a security boundary.
- If a conflict cannot be merged safely, preserve the local draft, show a clear
  retry/review state, and never silently discard a delivery confirmation.
- Photos are queued separately from work state. A material may be marked
  received before its optional Drive upload finishes.

## Client sharing contract

The first production client view should be a server-rendered or API-backed
read-only route using an opaque, high-entropy token. It must support:

- provider-created expiry and manual revocation;
- token hashing at rest rather than storing a usable token in the database;
- no indexing by search engines;
- rate limiting and audit events;
- a minimal response payload with only the work title, provider-selected client
  name, material status, receipt date, and provider-selected proof; and
- no sign-in requirement for the client unless later risk analysis says it is
  necessary.

## Account deletion and Drive disconnection

When a provider deletes their Cuenta Obra account, the production workflow must:

1. confirm the request and revoke all client links immediately;
2. export work data on request before irreversible deletion;
3. delete or anonymize Cuenta Obra account/workspace metadata according to the
   approved retention policy;
4. remove stored Drive file references and OAuth tokens; and
5. tell the provider that original photos stay in their Drive unless they choose
   to delete them there.

The final public policy must define timelines, backup handling, legal retention
exceptions, support contact, and the account-deletion request route. Those are
not product decisions Codex can make for the publisher.

## Implementation sequence

1. Product owner selects a production backend, auth provider, region, and
   organization-owned accounts.
2. Build workspace-authenticated API and offline mutation queue for jobs,
   suppliers, materials, and client records.
3. Add revocable client links with server authorization tests.
4. Add Google Drive OAuth and resumable proof upload after OAuth credentials
   exist.
5. Add Play Billing entitlement validation after Play Console access exists.
6. Complete privacy, deletion, retention, monitoring, and security review
   against the real deployed system before inviting paid users.
