# WORK-APP-0107 Technical Report

## Summary

Simplified the Balance surface and settlement confirmation dialog by removing
redundant text, duplicate safety disclaimers, and visual clutter. The surface
now shows the group name, open balance amount, status label, one settlement map
with a single action, and a compact member ledger.

## Scope

- `src/screens/MainScreen.tsx`:
  - Balance hero: removed the "Mapa de balance" kicker, the meta line
    ("MXN · N integrantes · arreglo externo"), the trust chip, the "Abierto"
    status label, and the metrics row (Rutas / Integrantes).
  - Settlement map section: removed the ComposerSection badge, icon, and meta.
    Shortened the route meta to "Sin pagos reales" and the action label to
    "Marcar". Removed the peace-state subtitle.
  - Settlement card: removed the "Monto MXN" label and the "Sin pagos reales"
    demo chip (redundant with the settlement map).
  - Member ledger: removed the "Integrantes" kicker.
  - Settlement confirmation dialog: removed the "Arreglo fuera de la app"
    eyebrow, the SPEI helper box header and text, the effect timeline
    ("Antes: pendiente → Después: registrado local"), and the input helper
    paragraphs. Shortened the boundary text to "Sin pagos reales · Marca el
    arreglo como pagado. No mueve dinero." and the action label to "Registrar".
- `docs/product/decisions.md`: recorded the balance simplification decision.

## External References

No new dependencies, paid services, or production integrations were added.

## Verification

Commands run:

```bash
npm run typecheck
npm test
npx expo config --type public
npm run export:web
./bin/company-os scope WORK-APP-0107
./bin/company-os validate
```

All passed.

## Screenshots

Captured the Balance surface at the required Android widths. The balance tab
was temporarily forced active with `activeTab` during export; the flag was
reverted to `"groups"` before the final commit.

- `reports/evidence/WORK-APP-0107/screenshots/balance-360x740.png`
- `reports/evidence/WORK-APP-0107/screenshots/balance-390x844.png`
- `reports/evidence/WORK-APP-0107/screenshots/balance-412x915.png`

## Residual Risks

- Dead StyleSheet entries remain for removed elements (balanceMapKicker,
  balanceMapMeta, balanceMapMetrics, settlementHelperBox, etc.). They are
  harmless but could be cleaned up in a follow-up.
- The Activity and Perfil surfaces remain legacy StyleSheet and will benefit
  from follow-up simplification tickets.
