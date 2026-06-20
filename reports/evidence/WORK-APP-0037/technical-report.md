# WORK-APP-0037 Technical Report

## Summary

Clarified the group-scoped tab model after review feedback. Groups now reads as
the stable group-selection surface, and Activity, Balance, and Profile are
presented as views of the active group.

## Changes

- Kept the bottom tab label as `Grupos` instead of changing it to `Cambiar`.
- Added `openGroupWorkspace()` so selecting a group closes transient group
  controls and opens the first group workspace tab.
- Added a compact selector intro explaining that Activity, Balance, and Profile
  update from the selected group.
- Muted group-scoped tabs when no group is selected and improved accessibility
  labels for selected-group context.

## Verification

- `npm run typecheck` passed.
- `./bin/company-os validate` passed.
- `./bin/company-os scope WORK-APP-0037` passed.

## Out Of Scope

- No production backend changes.
- No real payments.
- No secrets, paid services, or deployment.
- No removal of existing group content or local demo behavior.
