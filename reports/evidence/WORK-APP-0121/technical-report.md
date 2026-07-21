# WORK-APP-0121 Technical Report

## Intent

Execute the Palari Labs ↔ Cuenta Obra token bridge: paint preferred-kit token
slots with lab colors from [palari.io](https://palari.io/) without editing
primitive APIs or copying marketing chrome into field UI.

## Authority

- `DECISION-UI-0001` (preferred kit structure)
- `DECISION-UI-0002` (adopt lab token personality)
- `docs/product/ui-component-system.md` — Palari Labs ↔ Cuenta Obra Token Bridge

## Changes

| File | Change |
| --- | --- |
| `src/theme/tokens.json` | Warm paper `#F7F5F2`, indigo ink `#2E2A7B`, teal primary `#22B8B0`, coral due/accent, gold sun; `forest*` aliases → lab primary family |
| `global.css` | Mirror CSS variables |
| `dashboard/src/index.css` | Mirror kit `:root` + charts/sidebar |
| `docs/product/ui-component-system.md` | Bridge marks lab as current |
| `docs/product/decisions.md` | Adoption decision recorded |

## Not done

- Splash / adaptive icon still use older green (`#0F7B63` in Expo config)
- Marketing patterns (Fraunces, floating orbs, character avatars)
- Android screenshot packet at 360/390/412

## Verification

```bash
npm run typecheck   # pass
npm test            # 184 pass
npx expo config --type public
npm run export:web
./bin/company-os scope WORK-APP-0121
./bin/company-os validate
```

## How to see it

- Dashboard: `npm start` → hard refresh (warm paper + teal primary)
- Tracker: `npm run web:expo -- --clear` → teal hero/actions, indigo text
