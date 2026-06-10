# Cuentas Claras Decision Log

## 2026-06-10

### Use Expo React Native TypeScript

Decision: Build the MVP with Expo, React Native, and TypeScript.

Rationale: The product is Android-first, but Expo gives the fastest practical
path to a local mobile app, Android device testing, and browser-based mobile
viewport verification without requiring native Android tooling in this
environment.

### Local-First Demo, No Accounts

Decision: Store all data locally with seeded demo data and no authentication.

Rationale: The MVP needs to prove the expense-sharing experience, not cloud
collaboration. This avoids secrets, paid services, production infrastructure,
and privacy decisions that require human approval.

### MXN Only In MVP

Decision: Use MXN as the only currency.

Rationale: The target market is Mexico/LATAM and the user explicitly requested
MXN default currency. Multi-currency exchange would require product and risk
decisions outside the MVP.

### No Real Payments

Decision: Settlement actions only record local "paid" state. The UI must say
"Sin pagos reales" near settlement actions.

Rationale: Payment rails, SPEI wording, compliance, and financial integrations
are hard blockers without human/legal/payment decisions.

### Equal Splits Only

Decision: Split MVP expenses equally among all current group members.

Rationale: Equal split is the required core behavior and keeps the balance model
auditable. Unequal splits can be a follow-up after the baseline is polished.

### System Typography

Decision: Use Android/system fonts instead of bundling custom fonts.

Rationale: System fonts keep the local app reliable, avoid asset dependency
work, and still support a polished finance UI through spacing, weight, and
hierarchy.

### State-Based Navigation For MVP

Decision: Use a lightweight state-based shell with bottom tabs instead of adding
a full navigation framework.

Rationale: The MVP has a small surface area. Avoiding an extra framework reduces
setup risk while preserving mobile UX expectations.

### Demo Data Uses Mexico/LATAM Contexts

Decision: Seed groups such as a Oaxaca trip, CDMX apartment, and Monterrey
asada with realistic member names and expense categories.

Rationale: Localized examples make the app feel credible and keep verification
fast.

### Pin To Current Expo 56 Line

Decision: Use Expo `56.0.9`, React `19.2.7`, and React Native `0.86.0` for the
initial scaffold.

Rationale: npm registry checks on 2026-06-10 showed these as the current package
line. Staying on the current Expo line improves compatibility for Android,
React Native Web verification, and Expo Go-style local demos.

### Use Ticket-Level Palari Lint During Stacked Review

Decision: For final autonomous verification, run ticket-level Palari lint instead
of global `npm run lint:palari`.

Rationale: Earlier tickets are intentionally left `in-review` without reviewer
notes or acceptance. Global Palari lint would correctly report those pending
review gates, so ticket-level lint keeps implementation verification actionable
while preserving the remaining human/reviewer gates.

### Exclude Palari Worktrees From App Test Discovery

Decision: Configure Vitest to include only app tests under `src/**` and exclude
`.palari/**`.

Rationale: Palari ticket worktrees live inside this repo to honor the "all app
work inside the app repo" constraint. Without an explicit test config, root
Vitest scans duplicate tests inside those worktrees and inflates results.

### Use Local Mock Account Adapter Before Real Auth

Decision: Add account UX through a local `local-mock` adapter instead of
integrating a real identity provider.

Rationale: Account state is needed for production-readiness planning, but real
auth requires provider, privacy, deletion, and infrastructure decisions. A
replaceable local adapter lets the UI and model mature without secrets or paid
services.

### Use Local Mock Sync Adapter Before Backend

Decision: Add a `SyncAdapter` contract and local mock implementation instead of
connecting a production backend.

Rationale: Backend sync changes privacy, infrastructure, security, deletion, and
operating-cost responsibilities. A mock adapter gives the app a replaceable
boundary and queue model without secrets or deployment.

### Prepare EAS Internal Build Config Without Credentials

Decision: Add `eas.json`, Android version metadata, and release-check scripts
without provisioning signing credentials or Play upload secrets.

Rationale: The repo can be very close to internal testing while avoiding secrets,
paid services, and production deployment decisions. A real AAB requires human
account and signing setup.

### Separate Local Readiness From Play Upload Authority

Decision: Track internal-testing readiness with a repo checklist that separates
local verification from Play Console upload, signing, legal, and tester-list
actions.

Rationale: Agents can prepare and verify the app locally, but a signed AAB,
store listing, Data Safety submission, privacy URL, tester distribution, and
upload approval require human-owned accounts and credentials.
