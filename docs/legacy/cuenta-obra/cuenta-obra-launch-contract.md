# Cuenta Obra launch contract

**Parties:** Product owner (you) and product builder (Codex)

**Purpose:** Turn Cuenta Obra into a trustworthy, paid Android-first tool for
very small Spanish-speaking service providers. The provider pays for the tool;
clients receive a safe, read-only view of work progress. Cuenta Obra does not
move money between provider, client, or supplier.

**Operating agreement**

- Codex will update this file as work progresses.
- A checkbox moves to complete only after the work exists and has been verified
  in proportion to its risk.
- Codex continues with every task that is safe and within the product scope.
- Anything that needs the product owner's identity, account, commercial choice,
  legal approval, credentials, money, or outside coordination belongs in
  [Blockers](#blockers). A blocker does not stop unrelated work.
- Product scope changes are recorded in the change log before they are treated
  as release requirements.

## Status legend

- `[x]` complete and verified
- `[ ]` not started or still in progress
- `BLOCKED` cannot be completed without the product owner or an external party

## Engineering standard

Every future feature is checked against the
[Cuenta Obra engineering checklist](cuenta-obra-engineering-checklist.md). It
adapts Android quality, Expo date-control, accessibility, OWASP mobile, and API
security guidance to this product.

## Product foundation

- [x] Pivot the product from person-to-person payments to a provider work and
  inventory tracker.
- [x] Build desktop and Android-friendly provider navigation, material states,
  supplier contacts, and a client-safe progress view.
- [x] Support quick job, client, and supplier creation.
- [x] Seed a stress-demo with 7 jobs, 9 suppliers, 36 materials, late/waiting/
  due-today/complete/empty cases, and browser coverage of those states.
- [x] Define the optional provider-owned Google Drive evidence model, including
  narrow scope and resumable-upload guardrails.
- [x] Replace one-tap material-status cycling with an explicit status selection
  sheet that previews and saves the chosen state.
- [x] Replace free-text expected-delivery dates with a native Android date
  picker, a web calendar fallback, and date-only ISO storage rules.
- [x] Let providers correct an expected delivery after an item is ordered; make
  used materials retain a non-future receipt date for client-safe progress.
- [x] Validate and serialize local prototype storage, with safe recovery from
  malformed records and visible persistence failures.
- [x] Separate prototype verification from release approval so legacy payments
  backend checks cannot falsely label Cuenta Obra as ready for Play release.
- [x] Replace the desktop web prototype with the official shadcn `dashboard-01`
  Base UI shell and generated shadcn controls for navigation, data tables,
  forms, sheets, status selection, calendars, feedback, and progress.
  The Android Expo surface remains native because shadcn/Base UI target browser
  React, not React Native.
- [ ] Add a simple supplier-payment ledger tied to a job and material: amount,
  paid/pending state, payment date, and a short note. This is record-keeping
  only; it must not imply that Cuenta Obra processes customer payments.
- [ ] Replace local-only demo persistence with authenticated provider workspaces
  and durable cloud sync.
- [ ] Create a secure read-only client update link, with revocation and no
  access to supplier or internal data.
- [ ] Capture delivery proof offline and reliably queue/retry upload to the
  provider's connected Google Drive.
- [ ] Add in-app help, support contact, and Spanish-first recovery paths.

## Trust, privacy, and reliability

- [ ] Write and publish a privacy policy, terms of service, and support policy.
  Cuenta Obra-specific drafts now exist; publication remains blocked on legal
  publisher details, review, support policy, and public hosting.
- [ ] Implement account deletion, data export, and a clear user data deletion
  request path.
- [x] Define the production data map: what stays on device, in Cuenta Obra, and
  in the provider's Drive. See
  [production data map](cuenta-obra-production-data-map.md).
- [ ] Implement authorization, tenant isolation, encrypted transport, and
  server-side secret management.
- [ ] Add database backups, restore drills, data migrations, monitoring, and
  crash/error reporting.
- [ ] Test offline creation, conflict handling, device loss, re-login, and
  interrupted Drive uploads on low-cost Android hardware.
- [x] Complete a first accessibility hardening pass for the current tracker UI:
  labels, roles, live messages, sheet controls, compact tap targets, and
  mobile focus behavior.
- [x] Verify keyboard navigation for project switching, tabs, and material-sheet
  open/close on the web build.
- [ ] Complete the remaining accessibility pass on TalkBack/physical Android,
  including screen-reader announcements, contrast, tap targets, and Spanish
  copy.

## Paid product and billing

- [ ] Decide the paid offer: free limit, trial length, monthly/annual price,
  currency, cancellation behavior, and what remains available after expiry.
- [ ] Build subscription entitlements, restore purchase, expiry/grace handling,
  billing support, and refund support.
- [ ] Integrate and server-validate Google Play Billing for Play-distributed
  Android subscriptions.
- [ ] Build truthful paywall, plan selection, purchase success/failure, manage
  subscription, and cancellation screens.
- [ ] Measure activation, first delivery tracked, client update sent, weekly
  retention, and subscription conversion without collecting unnecessary data.

## Pilot, launch, and support

- [ ] Recruit 10–15 real providers across at least three service types.
- [ ] Run a closed Android pilot with real jobs and gather observed workflow
  failures, not only opinions.
- [ ] Define pilot success thresholds: first job in under 3 minutes, one
  delivery update in week one, and repeat weekly use.
- [ ] Prepare Play Store listing: Spanish copy, screenshots, privacy policy,
  support URL, content rating, and Data Safety declaration.
- [ ] Run internal testing, closed testing, release candidate testing, and a
  production rollback plan.
- [ ] Set up support inbox/WhatsApp, incident response, refund workflow, and a
  weekly product-review rhythm.

## Blockers

### External accounts and authorization

- **BLOCKED — Google Drive production connection.** The product owner must
  create or authorize a Google Cloud project, OAuth consent screen, Android
  OAuth client ID for `com.cuentasclaras.app`, and production redirect details.
  Codex can implement the client once those identifiers and approval scope are
  available; no Google client secret will be placed in the app.
- **BLOCKED — Google Play paid distribution.** The product owner must own or
  authorize the Play Console account, legal/payments profile, tax details, and
  bank payout configuration. Codex cannot accept Play agreements or submit
  identity/tax information on the owner's behalf.
- **BLOCKED — production hosting ownership.** A production database, backend,
  monitoring, and secret store require an organization-owned cloud account and
  billing authorization.

### Product-owner decisions

- **BLOCKED — commercial offer.** Confirm the launch country/currency, free
  limit or trial, monthly and annual prices, and refund policy. Until then,
  Codex will build the product so pricing is configurable rather than hard-code
  a price.
- **BLOCKED — legal publisher details.** The privacy policy, terms, support
  address, and deletion contact must name the correct legal publisher and
  governing jurisdiction. A qualified local advisor should review final terms.

### Explicit mapping for remaining checklist work

- **BLOCKED — real accounts, cloud sync, client links, deletion, backups, and
  monitoring.** These share the same prerequisite: an organization-owned
  production backend/auth provider, region, billing authorization, security
  review, and retention/deletion policy. Codex has completed the data boundary
  and can implement against a chosen, authorized environment.
- **BLOCKED — support and public policy.** The in-app support path, support
  policy, published legal URLs, and public deletion route require an
  owner-controlled contact channel, domain/hosting, publisher identity, and
  legal approval.
- **BLOCKED — physical Android accessibility and resilience testing.** TalkBack
  validation, low-cost hardware/offline testing, device-loss testing, and
  interrupted-upload testing require access to representative Android hardware
  and eventually the production services it will exercise.
- **BLOCKED — paid billing.** Subscription entitlement, Play Billing
  validation, pricing screens, cancellation, refunds, and analytics need the
  commercial offer decision plus Play Console authority from the product owner.
- **BLOCKED — pilot and release.** Recruiting providers, real-job observation,
  tester contact information, Play listing submission, internal/closed tracks,
  and production rollback approval require owner-led external coordination.

## Change log

- **2026-07-18:** Contract created. Product foundation currently has a
  functional, locally persisted prototype with rich demo data. No production
  account, cloud sync, Drive OAuth, billing, or public-store submission is
  represented as complete.
- **2026-07-18:** Production data map completed. It fixes ownership and access
  boundaries for provider records, client links, Drive proof, billing metadata,
  offline sync, and deletion without claiming a production backend exists.
- **2026-07-18:** First accessibility hardening pass completed and verified:
  explicit roles/hints for sheet controls, clearer radio announcements,
  44px compact actions, and no automatic mobile text focus. Legal drafts were
  rewritten for Cuenta Obra; they remain unpublished drafts pending owner and
  legal approval.
- **2026-07-18:** Web keyboard navigation verified for changing work, selecting
  a tab, opening a material sheet, and closing it. All remaining launch tasks
  now map to a concrete external blocker rather than an implicit waiting state.
- **2026-07-18:** Engineering checklist adopted. Status changes now require an
  explicit choose-and-save sheet; receipt and expected-delivery dates use date
  controls rather than free text. Type checks, 175 unit tests, web export, and
  desktop/mobile interaction checks passed. Physical Android validation remains
  in the existing accessibility and resilience blocker.
- **2026-07-18:** QA corrected the Android command semantics. `verify:android:prototype`
  verifies code/config health; `release:android:check` now intentionally stops
  with Cuenta Obra's real product blockers instead of passing legacy
  expense-splitting backend evidence as release proof.
- **2026-07-18:** Expanded QA fixed three rendered defects: stale offscreen
  status-sheet controls after closing, a mobile add button on the client preview,
  and insufficient contrast on compact delivery/status labels. It also added
  status/date policy coverage, serialized/validated local storage, submission
  locks, and Expo SDK alignment. The final verification passed 180 automated
  tests, web export, and `expo-doctor` (21/21). QA also distinguished the
  still-missing supplier-payment ledger from payment processing; it is an
  unblocked product feature, not a release claim. The remaining Android
  hardware and production-service requirements are still blocked.
- **2026-07-18:** The fixed web prototype URL now serves a dedicated
  `dashboard/` Vite application created with shadcn's Base preset and its
  official `dashboard-01` block. Desktop/mobile browser QA exercised status
  saving, date selection, material creation, sidebar navigation, and console
  health. All visible interactive desktop-dashboard controls use generated
  shadcn/Base UI primitives; the separate Android app continues to use its
  native control system.
