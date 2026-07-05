# WORK-APP-0086 Technical Report

## Summary

Removed dead legacy StyleSheet entries for surfaces already migrated to the reusable component system and verified the app still exports cleanly.

The cleanup intentionally stayed conservative. It removed unused style blocks tied to the migrated shell, Inicio money instrument, composer wrappers, Activity row, Perfil identity rows, and balance settlement-map wrappers. It did not attempt a broad historical style purge.

## Cleanup Result

- `src/screens/MainScreen.tsx` style keys before cleanup scan: 790
- Style keys after cleanup: 667
- Removed style declarations: 123
- MainScreen source reduction: about 16 KB
- Remaining unused style keys after cleanup: 288

Remaining unused keys are intentionally left for later because they belong to older or less clearly migrated surfaces and need separate visual QA.

## Evidence

- `reports/evidence/WORK-APP-0086/bundle-style-report.json`
- `reports/evidence/WORK-APP-0086/technical-report.md`

Current web export bundle files from `dist`:

- CSS: `dist/_expo/static/css/web-8de480a1763ee68c01e15d1b4b5f62e7.css` — 12,120 bytes
- JS: `dist/_expo/static/js/web/AppEntry-f074a99dcce3048ad4e04be8db4ae760.js` — 1,297,301 bytes

## Verification

Passed:

- `npm run typecheck`
- `npm test`
- `npx expo config --type public`
- `npm run export:web`
- `./bin/company-os scope WORK-APP-0086`
- `./bin/company-os validate`

## Boundaries

No app behavior, data model, payments, backend, secrets, deployment, legal copy, or production release workflow was changed.
