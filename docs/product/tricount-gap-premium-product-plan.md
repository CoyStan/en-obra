# Cuentas Claras Tricount Gap Premium Product Plan

Date: 2026-07-06
Status: draft for autonomous Company OS execution

## Purpose

Move Cuentas Claras from a polished local MVP toward a real consumer-grade LATAM shared-expense app that can credibly compete with Tricount while staying original, Spanish-first, Android-first, MXN-first, and safe for a pre-production repo.

This plan is based on the observed gap between Cuentas Claras and Tricount's current public positioning: shared group expenses, invite friends, real-time/shared visibility, flexible splits, offline use, photos/receipts, multi-currency, easy settlement, simple design, and broad use cases like trips, roommates, couples, dinners, and events.

Reference sources:

- Google Play: `https://play.google.com/store/apps/details?id=com.tribab.tricount.android`
- Tricount official site: `https://tricount.com/en-us/`
- Tricount feature article: `https://tricount.com/blog/expense-sharing-apps-what-to-look-for`
- App Store listing: `https://apps.apple.com/us/app/tricount-split-settle-bills/id349866256`
- 2026 competitor comparison: `https://splitterup.app/blog/best-expense-splitting-apps`

## Product North Star

Cuentas Claras should feel like the easiest way for a Mexico/LATAM group to know who paid, who owes, and what to do next.

The app must feel:

- Less like a dashboard.
- More like a shared social utility.
- Simple enough for a distracted user to understand in seconds.
- Trustworthy enough for money conversations.
- Local to Mexico/LATAM without becoming noisy or gimmicky.

## Strategic Positioning

Tricount is strong because it is simple, collaborative, and complete enough for real groups. Cuentas Claras should not copy Tricount visually. It should beat it locally by focusing on:

- Spanish-first UX, not translated UX.
- MXN and LATAM defaults.
- WhatsApp-native invitations and reminders.
- SPEI/CLABE-friendly settlement helpers without processing payments.
- Very low cognitive load.
- Clear no-real-payments boundary until explicitly approved.
- Warm but premium visual language.

## Hard Boundaries

Do not implement:

- Real payments.
- Production backend secrets.
- Paid APIs or paid services.
- Production deployment.
- Legal/compliance final decisions.
- Play Store submission.
- Destructive git cleanup.

Mock/local adapters are allowed when they keep replacement seams clear.

## Success Criteria

The plan is complete when:

- A new user can create or join a group, identify themselves, add an expense, split it flexibly, understand who owes whom, and share a settlement/reminder through local/mock flows.
- The app feels simpler than the current version while containing more capability.
- Major flows are screenshot-tested at Android widths `360x740`, `390x844`, and `412x915`.
- Native Android verification is attempted and documented.
- Company OS records show each work item in review/accept-ready with evidence.
- Only founder-only decisions remain.

## Proposed Company OS Work Items

Use these IDs unless the queue already contains newer items; if so, continue with the next available sequential IDs and keep titles/scopes equivalent.

### Phase A — Collaboration Model

| Item | Title | Acceptance Target |
| --- | --- | --- |
| `WORK-APP-0088` | Tricount gap PRD and UX simplification brief | Documents target gaps, user journeys, information architecture, and low-cognitive-load rules. |
| `WORK-APP-0089` | Multi-user group membership model | Local model supports users, groups, memberships, active identity, group roles, invite metadata, and join state without production backend. |
| `WORK-APP-0090` | Create/join group flow | User can create a group or enter a mocked invite/join flow; selected group scopes all tabs. |
| `WORK-APP-0091` | Member management flow | Add/edit/remove local members, choose active identity, and keep balances consistent. |

### Phase B — Flexible Expense Splitting

| Item | Title | Acceptance Target |
| --- | --- | --- |
| `WORK-APP-0092` | Split engine upgrade | Supports equal, exact amount, shares, and include/exclude participants using integer cents. |
| `WORK-APP-0093` | Add-expense UX simplification | Add expense takes fewer taps, uses progressive disclosure, and avoids card-heavy layout. |
| `WORK-APP-0094` | Participant split editor | Users can edit exact amounts/shares in a clear list/dropdown pattern with validation and cent rounding. |
| `WORK-APP-0095` | Edit/delete expense with audit events | Existing local expenses can be edited/deleted with history entries and recalculated balances. |

### Phase C — Settlement And Sharing

| Item | Title | Acceptance Target |
| --- | --- | --- |
| `WORK-APP-0096` | Settlement simplification engine | Produces minimal settlement routes and explains them in simple Spanish. |
| `WORK-APP-0097` | WhatsApp-style share/reminder mock | Generates shareable Spanish text for group summary, individual debt, and settlement reminder without external secrets. |
| `WORK-APP-0098` | SPEI/CLABE helper mock | Allows optional local settlement note fields such as bank alias/CLABE placeholder with no payment processing. |
| `WORK-APP-0099` | Settlement confirmation polish | Mark-paid flow is lighter, clearer, and explicitly local/no-real-payment. |

### Phase D — Receipts, Categories, Search, And Export

| Item | Title | Acceptance Target |
| --- | --- | --- |
| `WORK-APP-0100` | Receipt attachment local mock | Add expense can attach a local/mock receipt photo placeholder and display it in history. |
| `WORK-APP-0101` | Category system expansion | Categories cover common Mexico/LATAM use cases with cleaner dropdown/list selection. |
| `WORK-APP-0102` | Search and filters | Activity/expenses can be searched and filtered by person, category, amount, and date. |
| `WORK-APP-0103` | CSV/PDF-ready export mock | Local export summary is generated as text/CSV-ready data without paid services. |

### Phase E — Visual Restructure

| Item | Title | Acceptance Target |
| --- | --- | --- |
| `WORK-APP-0104` | App IA simplification | Navigation is restructured around Groups -> Group Home -> Expenses/Balances/Activity/Profile with fewer competing panels. |
| `WORK-APP-0105` | Home answer-first redesign | First viewport shows the answer and next action with far less copy and fewer cards. |
| `WORK-APP-0106` | Add-expense full-screen redesign | Composer feels native, fast, list-driven, and less visually heavy. |
| `WORK-APP-0107` | Balance and settlement redesign | Balance screen prioritizes who owes whom, right-aligned money, and one clear settlement action. |
| `WORK-APP-0108` | Dark mode and theme hardening | Light/dark themes pass contrast checks and keep brand personality. |

### Phase F — Android And Release Readiness

| Item | Title | Acceptance Target |
| --- | --- | --- |
| `WORK-APP-0109` | Native Android verification pass | Runs or attempts emulator/device checks; documents blockers; captures Android evidence where available. |
| `WORK-APP-0110` | Internal testing readiness refresh | Updates Play/internal testing checklist, demo-only boundaries, screenshots, and remaining human gates. |

## UX Rules For All Items

- Prefer one obvious primary action per screen.
- Replace explanatory paragraphs with labels, structure, and progressive disclosure.
- Use lists/dropdowns/sheets for selection; avoid grids of large cards unless visual comparison is genuinely useful.
- Show money right-aligned whenever scanning amounts matters.
- Keep MXN as default and always show decimals for balances and expenses.
- Keep touch targets Android-friendly.
- Keep `Sin pagos reales` visible at settlement/payment-adjacent moments only, not as visual noise everywhere.
- Do not add decorative objects that compete with task completion.
- Every screen should answer: Where am I? Who am I? What group is this? What do I need to do next?

## Verification Expectations

Per work item, run the relevant subset:

```bash
git status --short --branch
./bin/company-os validate
./bin/company-os queue
npm run typecheck
npm test
npx expo config --type public
npm run export:web
./bin/company-os scope WORK-APP-XXXX
```

For visual/UI items:

- Export web.
- Run a local preview.
- Capture screenshots at `360x740`, `390x844`, and `412x915`.
- Attempt native Android/emulator verification when the item touches Android-specific behavior.
- Document any unavailable tooling as a blocker, then continue with available verification.

## Completion Test

The plan is done when:

- All proposed items, or their sequential equivalents, are in review/accept-ready.
- The app has a real local collaboration model, flexible split engine, clear settlement/reminder flows, and simplified Tricount-level core UX.
- Checks pass.
- Evidence exists.
- The repo is clean.
- Remaining work is only founder acceptance, production backend/auth, legal/privacy adoption, Play credentials/signing, or real payments.
