# Codex Autonomy Goal — Execute The NativeWind/Reusables Premium UI Workplan

Copy the block below as the autonomous Codex goal/prompt for this repository.

```text
GOAL
Work autonomously in /home/quetza/projects/cuentas-claras until the NativeWind + React Native Reusables Premium UI Workplan is fully executed:

/home/quetza/projects/cuentas-claras/docs/product/nativewind-reusables-premium-ui-workplan.md

Use Company OS work items WORK-APP-0070 through WORK-APP-0087. If these items do not exist yet, create them from the workplan before implementing product changes. Use ./bin/company-os as authority, not memory.

OBJECTIVE
Transform Cuentas Claras into a more premium, Android-first, LATAM finance app by adopting an agent-legible React Native UI system:
- NativeWind for Tailwind-style Expo/React Native styling.
- React Native Reusables as the shadcn-like copy-owned component source.
- RN Primitives selectively for accessible sheet/dialog/select/label/checkbox primitives.
- gluestack-ui and Tamagui only as evaluated references or fallback options, not default architecture.

Do this by strangler migration, not a big-bang rewrite. Existing StyleSheet screens may remain until touched, but all new premium UI work should use the new tokenized component system once WORK-APP-0071..0075 prove it.

OPERATING LOOP
1. Read docs/product/nativewind-reusables-premium-ui-workplan.md, docs/product/open-design-design-brief.md, docs/tools/open-design.md, docs/product/premium-visual-goal/goal.md, docs/product/design-system.md, docs/product/visual-direction.md, and docs/product/decisions.md.
2. Run:
   git status --short --branch
   ./bin/company-os validate
   ./bin/company-os queue
3. Pick the lowest-numbered item in WORK-APP-0070..WORK-APP-0087 whose Company OS attention is ready for AI work, or create the next missing item from the workplan if the range is not yet present.
4. Read the item with:
   ./bin/company-os detail WORK-APP-XXXX
5. Stay strictly inside the item's allowed_resources. Do not perform forbidden_actions.
6. Implement until the acceptance_target is objectively true. Make founder-quality product/design decisions without stopping for minor choices. Record meaningful decisions in docs/product/decisions.md.
7. Run the commands that prove the ticket:
   npm run typecheck
   npm test
   npx expo config --type public
   npm run export:web
   ./bin/company-os scope WORK-APP-XXXX
   ./bin/company-os validate
   For visual tickets, capture screenshots at 360x740, 390x844, and 412x915 under reports/evidence/WORK-APP-XXXX/.
8. Write reports/evidence/WORK-APP-XXXX/technical-report.md with summary, decisions, verification, screenshots, and not-done items.
9. Commit the implementation/evidence with a clear message referencing the WORK id.
10. Record Company OS lifecycle:
   - attempt record/update with the real result and commit hash
   - evidence record with status passed and real commands run
   - receipt record with sources used, actions taken, outputs created, and not_done
   - review record with verdict accept-ready unless changes or human decision are genuinely required
   - outcome record
   - work update --status in-review
11. Commit the Company OS governance update separately.
12. Repeat from step 2.

DESIGN RULES
- The app is Expo/React Native, not React/Vite web. Do not install web shadcn/ui or Radix UI as the primary system.
- Use NativeWind + React Native Reusables/RN Primitives as the primary path.
- Use gluestack-ui only if a specific primitive is better copied/adapted from it and the ticket documents why.
- Use Tamagui only if the proof tickets show NativeWind/Reusables cannot meet the product need; otherwise do not introduce it.
- New UI components must be tokenized. Avoid raw hex colors and arbitrary pixel constants in components except in token/config files or justified one-off geometry.
- Keep Cuentas Claras original: Stripe-grade clarity, warm green/blue/sand LATAM trust palette, Android-native structure, Spanish-first copy, MXN-first money, low cognitive load.
- Do not make generic dashboard/template UI.
- Do not remove content to make screens lighter; restructure content into better visual objects.

HARD BOUNDARIES
Never implement or require:
- real payments
- production backend
- production auth/secrets/API keys
- paid services
- production deployment
- legal/compliance/payment decisions
- destructive git commands
- Play Store submission, tags, releases, or publishing

If a work item needs a founder/legal/production decision, record the blocker in its report and Company OS records, skip to the next unblocked item, and continue.

COMPLETION TEST
Stop only when all of these are true in the current session:
- WORK-APP-0070..WORK-APP-0087 all have completed attempts, passed evidence, receipts, outcomes, and accept-ready reviews, or are explicitly blocked only by founder-only decisions.
- ./bin/company-os validate passes.
- ./bin/company-os queue shows no AI-safe ready-for-work items in WORK-APP-0070..WORK-APP-0087.
- npm run typecheck passes.
- npm test passes.
- npx expo config --type public passes.
- npm run export:web passes.
- Visual evidence exists for the migrated major flows at 360x740, 390x844, and 412x915.
- The app still has no real payments, no production backend, no secrets, no paid APIs, and no deployment.
- The repo is clean.

FINAL REPORT
Report:
- accepted-ready/in-review tickets completed
- commits
- verification results
- screenshots/evidence paths
- what changed in the UI system
- which libraries were adopted and which were rejected/deferred
- remaining founder-only decisions
- exact next recommended command

Do not stop early because a ticket is hard. Fix it, or document the founder-only blocker and move to the next unblocked work item.
```

