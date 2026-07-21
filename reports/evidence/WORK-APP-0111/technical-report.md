# WORK-APP-0111 Technical Report

## Summary

Refreshed the Cuentas Claras palette to a cleaner, modern slate-white base with a
sky-blue primary and simplified the Inicio/Home surface by removing redundant
labels and non-essential local-demo metadata. The "Sin pagos reales" safety
disclaimer remains visible inside the money instrument near settlement context.

## Scope

- `src/theme/tokens.json`: updated color tokens to a cool neutral + sky-blue palette.
- `src/components/reusables/home-money-instrument.tsx`: lighter typography
  hierarchy, shorter labels, optional identity meta, and more compact route/progress
  sections.
- `src/screens/MainScreen.tsx`: simplified the Inicio/Home render:
  - removed the "Grupo activo" kicker and the duplicate topbar "Sin pagos reales" chip;
  - removed the group member strip header;
  - removed the activity stream "Historial" kicker and the "Demo" reset control;
  - removed the "Perfil local" / "Demo local" identity meta from the home instrument;
  - shortened settlement captions and action-dock meta copy.
- `docs/product/decisions.md`: recorded the palette simplification and the
  Inicio text-density reduction decisions.
- `company-os/workspace.json`: created the WORK-APP-0111 work item.

## External References

No new dependencies, paid services, or production integrations were added. The
palette was chosen locally from the Tailwind slate/sky/blue scale.

## Verification

Commands run:

```bash
npm run typecheck
npm test
npx expo config --type public
npm run export:web
./bin/company-os scope WORK-APP-0111
./bin/company-os validate
```

All passed.

## Screenshots

Captured the Inicio/Home surface at the required Android widths. The default
active tab was temporarily set to "home" during export to show the workspace
surface; the default was reverted to "groups" before the final commit.

- `reports/evidence/WORK-APP-0111/screenshots/inicio-360x740.png`
- `reports/evidence/WORK-APP-0111/screenshots/inicio-390x844.png`
- `reports/evidence/WORK-APP-0111/screenshots/inicio-412x915.png`

## Residual Risks

- The splash background (`#F7F3EA`) and Android adaptive icon background
  (`#0F7B63`) in `assets/` still reflect the old warm/green palette. They are
  outside the allowed scope of this ticket (`assets/` is not listed in
  `allowed_resources`) and should be refreshed in a follow-up design ticket.
- Other tabs (Grupos, Balance, Actividad, Perfil) still use the legacy StyleSheet
  monolith and will benefit from the same simplification treatment in subsequent
  scoped work items.
- Full dark mode is not implemented; the token structure is now light-theme only.
