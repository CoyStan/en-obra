# WORK-APP-0119 Technical Report

## QA findings (fake / incomplete before fix)
- Home "Vista previa" badge looked interactive but did nothing
- Desktop client footer (avatar/eye) looked interactive but did nothing
- Materials could not be edited after create (name/qty/supplier)
- Projects could not be edited after create
- Suppliers could not be edited; "último acuerdo" was boilerplate text only

## Fixes
- Vista previa → client tab
- Desktop client footer → client tab
- Material row body → edit sheet; status chip → status sheet
- ProjectSwitcher Editar → project edit
- Supplier Editar + lastContactNote field
- Workflow/update APIs + tests

## Commands
typecheck, test (184), scope, validate
