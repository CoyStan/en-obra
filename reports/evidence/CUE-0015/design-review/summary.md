# CUE-0015 Design Review Summary

## Requested Model

- Requested: Claude Opus 4.8 through local agent/opencode tooling.
- opencode provider list: no Anthropic/Claude provider was configured; only
  DeepSeek credentials were available.
- Claude Code status: `claude auth status` reported a `claude.ai` Max login.
- Claude Code print-mode result: `claude -p` returned `401 Invalid
  authentication credentials` for both `--model opus` and a plain auth probe.

## Fallback Used

- Fallback model: `deepseek/deepseek-v4-pro` through `opencode run`.
- Reason: Claude Opus 4.8 was unavailable in opencode, and Claude Code `-p`
  could not authenticate from this shell despite stored Max auth.
- Evidence files:
  - `prompt.md`
  - `command.txt`
  - `stdout-2.txt`
  - `stderr-2.txt`
  - `exit-2.txt`
  - `claude-auth-status.txt`
  - `claude-stdout.txt`
  - `claude-auth-test-2-stdout.txt`

## Guidance Applied

- Put who-pays/who-receives information directly on group cards.
- Keep balance and settlement content stable by moving forms into sheets.
- Add a confirmation step before marking settlements paid.
- Make "Sin pagos reales" visually prominent near settlement actions.
- Rename account language toward local "Perfil" instead of real account/bank
  implications.
- Use tabular numerals and slightly tighter title scale for amount clarity.
- Improve Spanish copy with accents and Mexico/LATAM-friendly wording.
- Avoid adding real payments, backend, auth provider, analytics, secrets, or a
  heavy UI framework.
