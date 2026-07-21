# WORK-APP-0106 Technical Report

## Summary

Simplified and modernized the add-expense composer by reducing redundant text,
removing the heavy header/context rail, and making the save boundary cleaner.
The composer keeps all existing functionality (category, amount, concept, payer,
participants, equal/exact/share split, receipt mock, and split impact preview).

## Scope

- `src/components/reusables/composer.tsx`: made the ComposerSection icon
  optional, reduced title weight, and made the ComposerSaveDock body optional
  for more compact save rails.
- `src/components/reusables/input.tsx`: lightened field labels and added a
  small tracking width for a more modern look.
- `src/screens/MainScreen.tsx`: simplified the expense composer render:
  - removed the "Captura de recibo" kicker, subtitle, and context rail;
  - removed the ComposerSection icon, meta, and badge;
  - removed helper paragraphs from the money, concept, and note inputs;
  - removed the equal-split hint and shortened split impact labels;
  - simplified the receipt attachment row text and removed the Local/Mock pill;
  - shortened the save dock title/body and kept "Sin pagos reales" at the save
    boundary.
- `docs/product/decisions.md`: recorded the add-expense simplification decision.

## External References

No new dependencies, paid services, or production integrations were added.

## Verification

Commands run:

```bash
npm run typecheck
npm test
npx expo config --type public
npm run export:web
./bin/company-os scope WORK-APP-0106
./bin/company-os validate
```

All passed.

## Screenshots

Captured the add-expense composer at the required Android widths. The composer
was temporarily forced open with `showExpenseForm` during export; the flag was
reverted to `false` before the final commit.

- `reports/evidence/WORK-APP-0106/screenshots/gasto-360x740.png`
- `reports/evidence/WORK-APP-0106/screenshots/gasto-390x844.png`
- `reports/evidence/WORK-APP-0106/screenshots/gasto-412x915.png`

## Residual Risks

- The settlement confirmation and data-deletion dialogs still carry verbose
  local-only explanations; they are outside this ticket's scope.
- The Groups, Balance, Activity, and Perfil surfaces remain legacy StyleSheet and
  will benefit from follow-up simplification tickets.
