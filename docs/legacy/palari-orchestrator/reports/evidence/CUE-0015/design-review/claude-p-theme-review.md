# Claude Code Theme Review

Date: 2026-06-10

Command:

```text
claude -p --allowedTools Read,Grep,Glob
```

Prompt summary: review `src/theme/theme.ts`, `src/components/ui.tsx`, and
`src/screens/MainScreen.tsx` without edits; recommend changes to make the UI
more professional and Telegram-like.

Outcome: Claude Code `-p` succeeded after the earlier auth issue was resolved.

Applied priorities:

- Collapse competing accent families into one primary blue plus restrained debt
  red.
- Replace warm canvas and gold/demo treatments with cool neutral surfaces.
- Reduce global font weights so hierarchy comes from structure, not heavy copy.
- Shrink and standardize icons, avatar containers, and decorative icon tiles.
- Remove shadow-led emphasis in favor of flat cards with hairline borders.
- Make disclaimer chips neutral rather than highlight-colored.
- Use a compact blue/slate avatar palette for demo and newly created members.
