# Empty Loading Error And Accessibility Polish

## Scope

CUE-0019 improves recoverability and accessibility metadata in the current
single-screen shell.

## Changes

- Shared action buttons now expose disabled state and 44 px minimum height.
- Group cards expose selected state, labels with spent/open/member context, and
  selection hints.
- Error banners expose button role, label, and dismissal hint.
- Bottom tabs expose selected state and labels.
- Payer options expose radio labels, checked state, and selection hints.
- Text inputs expose their visible label to assistive tech.

## Notes

- Decorative icons and avatars remain visually smaller than 44 px, but primary
  pressable controls meet the target.
- Empty/loading/error copy remains Spanish-first and local-demo safe.
- No new accessibility or navigation dependency was added.
