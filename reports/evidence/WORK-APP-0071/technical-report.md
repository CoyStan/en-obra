# WORK-APP-0071 Technical Report

## Summary

Installed and wired stable NativeWind for the Expo/React Native app. Added the
Tailwind config, global CSS entrypoint, TypeScript declarations, Babel/Metro
configuration, and a tiny hidden proof component that uses `className` without
changing the visible production screens.

## Dependency Decision

Used the stable NativeWind v4 path:

- `nativewind`
- `tailwindcss@^3.4.17`
- `react-native-reanimated`
- `react-native-safe-area-context`
- `prettier-plugin-tailwindcss`
- `babel-preset-expo`

Deferred NativeWind v5/Tailwind v4 preview because the stable npm release is
NativeWind v4 and this ticket is meant to prove setup safely before migrating
production UI.

## Outputs

- `package.json`
- `package-lock.json`
- `babel.config.js`
- `metro.config.js`
- `App.tsx`
- `global.css`
- `nativewind-env.d.ts`
- `tailwind.config.js`
- `src/components/nativewind/NativeWindProof.tsx`
- `reports/evidence/WORK-APP-0071/runtime-proof.json`
- `reports/evidence/WORK-APP-0071/nativewind-proof-390x844.png`

## Verification

- `npm run typecheck` passed.
- `npm test` passed: 36 files, 144 tests.
- `npx expo config --type public` passed.
- `npm run export:web` passed and emitted a CSS bundle.
- Runtime proof loaded the exported app at `390x844`, found the hidden
  `NativeWind ready` node, and confirmed `Cuentas Claras` rendered.
- `./bin/company-os scope WORK-APP-0071` passed.
- `./bin/company-os validate` passed.

## Warnings

- `npm install` reported existing moderate audit findings. No audit fix was run
  because that could introduce unrelated dependency churn.
- npm reported a peer warning involving Expo's nested `react-native-worklets`
  package and React Native `0.86.0`. The app checks and web export still pass.

## Not Done

- No React Native Reusables components copied yet.
- No production UI surface migrated to NativeWind yet.
- No Tailwind token bridge beyond the initial Cuentas Claras token names.
- No real payments, production backend, secrets, paid services, deployment, or
  legal/payment decisions.
