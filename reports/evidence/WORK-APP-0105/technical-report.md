# WORK-APP-0105 Technical Report

## Scope

Redesigned the Home first viewport to show the answer and next action with less
copy and fewer heavy surfaces. The work stayed within the approved `src/**`,
`docs/product/decisions.md`, `reports/evidence/WORK-APP-0105/**`, and
`company-os/workspace.json` scope.

## What Changed

- Reduced Home money instrument padding and vertical gaps.
- Gave the balance amount more width and reduced the oversized font so decimals
  render fully on common Android widths.
- Tightened the identity row and route card.
- Preserved the first-viewport essentials: active user, selected group, personal
  balance, who-owes-whom route, next action, MXN cue, and no-real-payments cue.

## Verification

- `npm run typecheck` passed.
- `npm test` passed.
- `npx expo config --type public` passed.
- `npm run export:web` passed.
- `./bin/company-os scope WORK-APP-0105` passed.
- `./bin/company-os validate` passed.

## Evidence

- `reports/evidence/WORK-APP-0105/screenshots/home-first-viewport-360x740.png`
- `reports/evidence/WORK-APP-0105/screenshots/home-first-viewport-390x844.png`
- `reports/evidence/WORK-APP-0105/screenshots/home-first-viewport-412x915.png`

## Residual Risk

The Home screen is clearer, but a later broader visual pass can still simplify
the money-flow illustration and people strip. Founder acceptance is still
required by Company OS.
