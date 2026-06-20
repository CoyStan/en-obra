# WORK-APP-0013 Technical Report

## Work Item

Repair add-expense dropdown selectors.

## Scope

Founder feedback showed the add-expense sheet was broken on narrow Android
widths: category options were too few, and category, payer, and participant
selection used large card grids that overlapped content and felt heavy.

## Changes

- Expanded expense categories from 6 to 14:
  - Comida, Viaje, Transporte, Super, Casa, Renta, Servicios, Hospedaje,
    Gasolina, Boletos, Salud, Compras, Plan, Otro.
- Replaced the category card grid with a compact animated dropdown list.
- Replaced `Quien pago` cards with a single-select animated dropdown list.
- Replaced participant cards with a multi-select animated dropdown list.
- Kept avatars, category icons, selected checks, and 44px+ touch targets.
- Fixed participant labels so selected people say `Incluido` before an amount is
  available instead of incorrectly saying `No participa`.
- Preserved local-first MXN behavior and `Sin pagos reales` copy.
- Recorded the design decision in `docs/product/decisions.md`.

## Verification

- `npm run typecheck`: passed.
- `npm test`: passed, 8 files and 25 tests.
- `npm run export:web`: passed.
- `./bin/company-os validate`: passed.
- `./bin/company-os scope WORK-APP-0013 ...`: passed.
- Chromium/CDP screenshots captured:
  - `reports/evidence/WORK-APP-0013/screenshots/add-expense-closed-390x844.png`
  - `reports/evidence/WORK-APP-0013/screenshots/category-dropdown-390x844.png`
  - `reports/evidence/WORK-APP-0013/screenshots/payer-dropdown-390x844.png`
  - `reports/evidence/WORK-APP-0013/screenshots/participants-dropdown-390x844.png`

## Not Done

- No native Android emulator/device QA in this pass.
- No production backend, secrets, paid services, or real payments.
- No full navigation rewrite.
