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

### Default Expense Payer To Logged-In Member Identity

Decision: Store a per-group mapping between local account profiles and group
members, and use that mapping as the default payer in expense entry.

Rationale: Multiple users should be able to use the same shared group with their
own identity. The expense form should start with who is logged in, not always the
first member.

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

### Use Deterministic Vector-Derived Store Assets

Decision: Create icon, splash, and feature graphic assets from repo-local SVG
sources rendered to PNG.

Rationale: Release assets need consistency and repeatability. A simple balance
mark matches the app's fairness metaphor and avoids relying on one-off generated
bitmap art for a core brand asset.

### Draft Privacy And Terms Before Legal Approval

Decision: Keep privacy and terms copy as Spanish draft documents until a human
approves legal owner, contact details, Play Data Safety answers, deletion
process, and publication URLs.

Rationale: The current app is local-first and avoids backend, payments,
analytics, ads, and secrets, but legal text still requires accountable human
approval before Play Store publication.

### Define Local Data Deletion Before Backend

Decision: Add a local deletion helper and security/data deletion model that
clears app data, mock sync state, and local mock account state before any real
backend exists.

Rationale: Internal testing needs a concrete deletion story for local data, but
remote account deletion, retention, and support processes require human
privacy/security decisions before production sync ships.

### Separate Local Readiness From Play Upload Authority

Decision: Track internal-testing readiness with a repo checklist that separates
local verification from Play Console upload, signing, legal, and tester-list
actions.

Rationale: Agents can prepare and verify the app locally, but a signed AAB,
store listing, Data Safety submission, privacy URL, tester distribution, and
upload approval require human-owned accounts and credentials.

### Use A Professional Android-First Finance UI Pass

Decision: Improve the MVP UI with balance-first group previews, bottom-sheet
forms, clearer settlement confirmation, stronger "Sin pagos reales" treatment,
tabular amount rendering, Spanish copy polish, and compact local Perfil status.

Rationale: The app must feel like a trustworthy consumer finance utility before
internal testing. The pass keeps local-first behavior and avoids new libraries,
payments, backend services, and secrets.

### Use A Restrained Telegram-Like Visual System

Decision: Consolidate the UI around a cool neutral canvas, white surfaces,
hairline borders, Telegram-like blue accent states, smaller 16-20 px icons, and
a compact blue/slate avatar palette.

Rationale: The earlier green/blue/gold/coral mix and large icon tiles made the
app feel more decorative than professional. A calmer system improves scanning,
reduces perceived randomness, and keeps warning color reserved for debt or
errors.

### Keep Core Flow Sheets Open On Validation Errors

Decision: Return explicit success/failure from group, member, and expense
actions so invalid submissions keep the current form open and show Spanish error
copy in context.

Rationale: Closing a sheet after a rejected local action feels unreliable and
forces the user to repeat work. Internal testing should prove a forgiving first
expense path before adding advanced split features.

### Explain Balances With Text, Not Color Alone

Decision: Add plain-language balance explanations and activity subtitles that
show who paid, how expenses were split, and that settlements are local records.

Rationale: A finance app must make debt state auditable in one scan. Textual
explanations reduce ambiguity for color-blind users and reinforce that Cuentas
Claras does not move money.

### Add Accessibility Metadata Without New Frameworks

Decision: Improve core pressables and inputs with accessibility labels, selected
and disabled states, hints, hit slop, and 44 px button targets using React Native
primitives already in the app.

Rationale: The MVP can become materially more usable for screen reader and
motor-access users without adding dependencies or changing navigation
architecture.

### Treat Play Internal Testing As A Human-Owned Release Gate

Decision: Keep the repo ready for internal testing QA while leaving signed AAB
creation, Play Console upload, tester rollout, Data Safety submission, and legal
approval as explicit human-owned gates.

Rationale: Local automation can validate config, tests, assets, and docs, but
Play upload requires credentials, account authority, and final policy decisions
that should not be simulated by agents.

### Adopt Style 1 Plus Style 2 Warmth And Style 3 Android Structure

Decision: Use the generated Style 1 trustworthy fintech minimal concept as the
base visual direction, add restrained Mexico/LATAM warmth from Style 2, and
organize the app with Android-native Material-style structure from Style 3.

Rationale: The combination best matches the founder preference and the product
need: a real finance utility should feel calm and trustworthy first, locally
familiar second, and obviously Android-native in navigation, chips, action
placement, and touch behavior.

### Default To Balance-First Android Home

Decision: Open the MVP on the active group balance screen instead of the group
list, with one primary settlement suggestion, quick actions, and activity
preview in the first viewport.

Rationale: The selected visual direction is balance-first. Internal testers
should immediately see who receives, who pays, the next local action, and the
audit trail without first navigating away from a generic list.

### Use An Identity-First Personal Balance Hero

Decision: Replace the first-screen group-wide receive/debt split with a lighter
personal balance hero that shows the active demo user, selected group, MXN cue,
personal balance, one settlement cue, one primary `Agregar gasto` action, and
`Sin pagos reales` in the first viewport.

Rationale: The premium goal requires the app to stop feeling like one person is
managing everyone else's finances. Leading with `Tú eres Ana` and `Tu balance`
makes the experience personal and easier to understand on 360 px Android
screens. The hero rounds to whole pesos for scanning, while detailed rows keep
exact cent values.

### Add SQL-Ready Local Entities Without A Backend

Decision: Evolve local app data to version 2 with `users`, `groupMembers`,
`expenseParticipants`, `activityEvents`, and `syncOutbox` while still persisting
one local AsyncStorage document for the MVP.

Rationale: The premium goal needs the app to feel multi-user and later become
SQLite/backend-ready. Adding SQL-shaped entities now lets balances, payer
defaults, participant shares, activity, and future sync adapt without introducing
production auth, backend secrets, or paid services.

### Make Expense Creation Participant-First

Decision: The add-expense sheet must explicitly show the active identity, payer,
participants, equal MXN split preview, and `Sin pagos reales` before saving a
local expense.

Rationale: A shared-expense app should not feel like one person is entering
accounting for everyone. Showing `Quién participa` and the per-person split
aligns the UI with the SQL-ready `expenseParticipants` model, keeps low-IQ
everyday users from guessing how the split works, and preserves the no-payments
boundary at the moment money is discussed.

### Expose Local Data Controls In Perfil

Decision: Perfil should include local-only data controls that show what is kept
on the device, allow a clean demo reset, and allow deleting local app/account
data behind a confirmation.

Rationale: Internal testers need a trustworthy settings surface before Play
testing. Local deletion can be implemented safely now, while remote deletion,
legal language, backend retention, and account recovery remain explicit human
and infrastructure gates.

### Treat Activity As A Local Audit Trail

Decision: Activity rows should be built from `activityEvents` when available and
show actor identity, event type, relevant MXN amounts, and local/no-real-payment
cues.

Rationale: The premium app should feel multi-user and trustworthy, not like a
passive receipt list. A local audit trail helps people understand who recorded a
gasto, who marked a settlement, and what changed, while keeping backend sync and
real payment claims out of scope.

### Record Money Actions With The Active Group Identity

Decision: Expense and settlement writes should use the active group member's
`userId` as `createdByUserId`, `recordedByUserId`, and activity actor when that
identity exists locally.

Rationale: The app must not feel like one person manages everyone else's money.
If a tester switches to Diego in a group, new gastos and local settlement
records should be attributed to Diego in the audit trail. If that identity is
stale or missing, the app falls back to the selected demo user.

### Make Settlement Actions Perspective-Aware

Decision: Settlement suggestions and confirmations should say whether the active
identity pays, receives, or is only viewing a group record, and every action must
be framed as a local record of a payment made outside the app.

Rationale: The premium Android MVP needs low cognitive load around the most
sensitive money action. Clear payer/receiver language reduces mistakes, while
`Sin pagos reales` and external-payment copy keep the app away from payment
processing claims.

### Prefer A Softer First Viewport Over Dense Action Rails

Decision: The balance home should use one soft hero surface, a clear personal
balance module, a compact settlement cue with `Liquidar`, and the settlement row
itself instead of a separate three-button quick-action rail.

Rationale: The premium goal calls for lower visual weight without hiding core
content. Removing the extra action rail reduces decision fatigue on narrow
Android screens, while keeping `Agregar gasto`, `Liquidar`, `Siguiente paso`,
MXN, identity, group, and `Sin pagos reales` visible in the first viewport.
