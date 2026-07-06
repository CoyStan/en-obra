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

### Use Public Mobbin Finance Patterns As Benchmark

Decision: Treat Mobbin's public mobile finance category as the benchmark for
visual direction without depending on private screenshots or a paid account.

Rationale: The app needs the discipline of shipped finance products: a
balance-first hierarchy, shallow surfaces, compact tab bars, list rhythm, clear
money-flow objects, and quiet trust cues. These patterns can be applied without
copying a specific private design or adding a large template dependency.

### Keep The First Mobbin-Benchmark Pass In Existing Components

Decision: Improve the current React Native screen, theme, and local dev Metro
config before adopting a large UI kit such as gluestack, Tamagui, or a paid
template.

Rationale: The product has custom shared-expense flows that generic templates
will not model well. A focused pass preserves working behavior, reduces visual
weight quickly, and leaves room to adopt a component library only if repeated
manual polish becomes too slow.
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

### Move To A Cooler Slate And Deep Agave Palette

Decision: Replace the warmer sand-heavy palette with cool slate neutrals, deep
agave teal, restrained indigo, muted terracotta/marigold, and deep rose for debt
states.

Rationale: The previous colors still felt too beige/green-heavy and less
premium. A slate-white foundation gives the app a cleaner fintech base, while
deep agave and indigo keep the Mexico/LATAM trust signal without making the
interface feel one-note or harsh.

### Add Motion Only When It Explains Money Flow

Decision: Use lightweight built-in React Native animation for the settlement
money-flow figure, with reduced-motion support and static visual fallbacks.

Rationale: The app was becoming too text-led. A small animated object showing
who pays whom helps everyday users understand settlement direction faster, while
the reduced-motion path and `Sin pagos reales` semantics prevent the animation
from feeling like real payment processing or inaccessible decoration.

### Recycle Flow Patterns, Not Toy Visual Skin

Decision: Borrow the toy app's useful shared-expense interaction patterns:
restrained group identity objects, stacked avatars, category chips, amount-first
expense entry, visible payer-to-receiver routes, and date-sectioned activity.
Do not copy its raw emoji identity system, saturated green headers, decimal
money model, or payment-like settlement language.

Rationale: Cuentas Claras needs to become easier to understand visually without
becoming playful or cluttered. Object-led rows reduce reliance on text for
mainstream Android users, while the existing slate/agave palette, integer cents,
SQL-ready local model, and `Sin pagos reales` cues preserve the premium finance
trust bar.

### Use Compact Dropdowns For Add-Expense Choices

Decision: Category, payer, and participant selection in the add-expense sheet
should use compact animated dropdown list menus instead of large card grids.

Rationale: The card grids became visually broken on narrow Android screens and
made the sheet feel heavy. Dropdown triggers keep the flow readable, allow a
larger category taxonomy, and make payer/participant choice feel more like a
native form control while preserving clear avatars, checks, and local-only
money semantics.

### Keep Hero Money Precise But Quiet

Decision: The first-viewport personal balance should show decimal cents, keep
the currency label compact, and align the numeric amount to the right instead
of using a large centered amount.

Rationale: Shared-expense apps need exact money values, but oversized hero
money makes the app feel less professional and can truncate on narrow Android
screens. A compact right-aligned number preserves precision and trust while
leaving the left side for the user's balance state.

### Use Responsive Density For Finance UI

Decision: High-risk finance UI should adapt by screen and container width rather
than relying on one fixed size for every phone. Use compact, regular, and roomy
density modes for spacing, and measured container width for sensitive money
amounts.

Rationale: Android devices vary enough that single fixed sizes repeatedly cause
either truncation on narrow screens or unnecessary smallness on larger screens.
Responsive density keeps normal text stable while letting money amounts,
selector triggers, nav labels, and hero spacing tighten or breathe based on the
space they actually have.

### Reserve A Money Rail In Balance Rows

Decision: Member balance rows should use a stable right-side money rail and a
flexible left-side identity/detail area instead of letting name, explanation,
and amount compete in one undifferentiated row.

Rationale: Balance rows are scanned like a financial table, even when presented
as mobile cards. A reserved amount rail makes pesos line up predictably, while
the identity/status/detail cluster can wrap naturally on narrow Android screens
without crowding the amount or leaving the right side visually empty.

### Make Groups The Parent Navigation Context

Decision: The app should start on `Grupos`. Selecting a group opens that
group's `Actividad`, while `Balance` and `Perfil` remain scoped to the same
selected group until the user returns to `Grupos` and switches context.

Rationale: Shared expenses are group-first. Treating groups as one peer tab made
the rest of the app feel disconnected: users could be in Balance or Profile
without understanding which group they were editing. A parent group switcher
keeps the model simple for everyday users: choose a group, then inspect activity,
balances, or profile/person settings for that group.

### Keep The Backend Contract Provider-Neutral Until Access Is Decided

Decision: Define the backend foundation as a deterministic SQL schema and
seed/export layer in code before choosing production storage, auth, hosting, or
sync infrastructure.

Rationale: The app needs to be close to Play Store readiness, but the founder
still needs to decide access and storage. A provider-neutral SQL contract lets us
test users, groups, memberships, expenses, participants, settlements, activity,
and sync outbox behavior now without introducing secrets, paid services, or
irreversible infrastructure choices.

### Make Inicio A Single Money Instrument

Decision: The selected-group `Inicio` screen should present the user's active
money state as one integrated instrument: group context, identity, personal
balance, who-owes-whom route, open-vs-spent progress, people strip, and next
action. Avoid stacking separate hero, route, member, and metric cards above the
fold.

Rationale: Open Design's Stripe/Wise/Revolut references point toward precise
financial hierarchy, consumer-money objects, and one-job mobile screens. A
single instrument makes the first viewport easier to understand for mainstream
users, reduces repeated chrome, keeps `Sin pagos reales` visible, and gives the
app a more premium product shape without changing the local-first data model.

### Make Balance A Settlement Map

Decision: The `Balance` tab should lead with a settlement map: open group
amount, route count, main payer-to-receiver route, local settlement action, and
compact secondary route chips before the member ledger.

Rationale: Users come to Balance to answer one question: who needs to settle
with whom. A map structure is easier to scan than stacked dashboard cards and
better matches premium consumer-finance references from Open Design. The
member ledger remains available for detail, but the first viewport now explains
the current route and preserves exact MXN amounts plus `Sin pagos reales`.

### Treat Activity As A Local Audit Trail

Decision: The `Actividad` tab should lead with a local audit certificate:
group context, movement counts, settlement count, open MXN amount, latest proof,
and action shortcuts before the daily timeline.

Rationale: Activity is not just a feed; it is the trust record for who changed
money state and when. Presenting it as a bitácora/audit trail reinforces that
settlements are local records, not real payments, while making the latest event
and daily timeline easier to scan.

### Treat Groups As Workspace Rows

Decision: Group selection should behave like a premium workspace switcher:
compact group rows with a route preview, right-side open MXN rail, member stack,
and clear active state instead of large repeated cards.

Rationale: Groups are the parent context for the rest of the app. Workspace
rows make switching groups faster to scan, preserve the "group controls all
other tabs" mental model, and reduce visual weight while keeping active group,
member count, open balance, and `Sin pagos reales` cues visible.

### Make Perfil An Identity Vault

Decision: The `Perfil` tab should behave like a lightweight identity and trust
vault for the selected group, not a generic settings page. It should lead with
the local profile, group context, demo mode, local/sync/payment trust cues, and
then show the active group persona as a selectable member list.

Rationale: The multi-user model is one of the clearest ways to distinguish the
app from a one-person finance manager. Open Design's mobile profile patterns
favor one primary identity object, compact stats/rails, and list rows over
large repeated cards. A vault structure keeps the screen premium, clearer for
mainstream users, and explicit that data and settlements are local-only demo
records.

### Make Add Expense A Receipt Composer

Decision: The add-expense sheet should feel like a receipt-to-route composer:
selected group and identity chips, a compact receipt object, a visible money
route from payer to participants, and a split preview before saving.

Rationale: A generic form makes users parse too much text while they are trying
to enter a simple expense. Open Design's mobile and fintech references favor one
job per surface, compact progress indicators, and financial objects that show
state visually. A receipt composer makes category, amount, payer, participants,
and split consequence easier to understand without introducing real payments or
backend behavior.

### Adopt NativeWind And React Native Reusables By Strangler Migration

Decision: Cuentas Claras should adopt NativeWind, React Native Reusables, and
selective RN Primitives as the next UI-system foundation. gluestack-ui remains a
component/pattern fallback, and Tamagui remains deferred unless the proof work
shows NativeWind/Reusables cannot satisfy the product's needs.

Rationale: The app is Expo/React Native, so web shadcn/Radix is not the right
runtime layer. NativeWind plus copy-owned React Native components preserves the
valuable part of the Tailwind/shadcn workflow: agent-legible styling, local
component ownership, and fewer global styling conventions. A strangler
migration lets the app keep working while new premium surfaces move into a more
consistent, tokenized system.

### Govern New UI Components Through An Ownership Guide

Decision: New NativeWind/Reusables UI work should follow
`docs/product/ui-component-system.md` for component paths, naming, token rules,
variant semantics, accessibility, migration order, and verification.

Rationale: Adding a new styling layer without ownership rules would recreate
the same drift problem in a different syntax. A guide gives future agents a
clear place to look before inventing components, variants, colors, or migration
patterns.

### Use Pill As The First Production NativeWind Migration

Decision: The first visible production migration to NativeWind should be the
shared `Pill` primitive rather than a full screen.

Rationale: Pills appear across trust, group, status, and money-state surfaces,
so they prove the new tokenized styling layer on real UI. The primitive is small
enough to verify safely before migrating larger surfaces such as sheets,
navigation, or balance maps.

## 2026-07-06

### Close The Tricount Gap Through Local/Mock Collaboration First

Decision: The next product phase should move beyond a polished local MVP toward
a Tricount-credible shared-expense utility: local/mock create/join groups,
active group identity, member management, flexible splits, share/reminder text,
receipt placeholders, search/export, and simpler Android-first information
architecture.

Rationale: The largest competitive weakness is not only visual polish; it is
that Tricount feels like a complete collaborative social utility while Cuentas
Claras still behaves like a single-device demo. Building provider-neutral
local/mock collaboration and split capabilities closes real product gaps without
crossing hard boundaries around production auth, sync, payments, secrets, paid
services, legal commitments, or Play submission.

### Add Local Invite Metadata Before Production Sync

Decision: Extend the local SQL-ready model with `groupInvites`, membership
status, join source, inviter metadata, and invite-linked activity events before
building the create/join UI.

Rationale: The app needs to feel collaborative without claiming real-time
backend sync. Local invite metadata gives the next tickets a concrete contract
for mock join flows and later provider replacement, while keeping all data on
device and avoiding secrets, paid services, production auth, and production
backend decisions.

### Upgrade The Split Engine Before The Split Editor

Decision: Support equal, exact-amount, and share-unit splits in the local domain,
mutation, SQL-ready dataset, and demo seed before redesigning the add-expense
split editor UI.

Rationale: Flexible splits are a core shared-expense trust feature, but the
engine has to stay deterministic before the UI becomes more expressive. Integer
cents, explicit participant rows, and persisted split methods let future UI work
offer exact amounts, shares, and include/exclude controls without changing the
backend contract or introducing real payments, production sync, secrets, or paid
services.
