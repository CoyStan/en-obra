# WORK-APP-0062 Technical Report

## Summary

Installed Open Design as an external sibling checkout and added repo-local Cuentas Claras wrappers/docs so it can be used as a design accelerator without becoming an Expo runtime dependency.

## What Changed

- Added `SOURCE-OPEN-DESIGN` to Company OS.
- Cloned Open Design to `/home/quetza/projects/open-design`.
- Installed Open Design dependencies with Corepack pnpm.
- Added `bin/open-design` wrapper for Cuentas Claras.
- Added a repo-local Corepack-backed `pnpm` shim for Open Design nested scripts.
- Added Open Design usage documentation.
- Added a Cuentas Claras-specific Open Design design brief.

## Verified Open Design Assets

- `/home/quetza/projects/open-design/design-systems/stripe/DESIGN.md`
- `/home/quetza/projects/open-design/design-systems/wise/DESIGN.md`
- `/home/quetza/projects/open-design/design-systems/revolut/DESIGN.md`
- `/home/quetza/projects/open-design/design-systems/expo/DESIGN.md`
- `/home/quetza/projects/open-design/design-templates/mobile-app/`
- `/home/quetza/projects/open-design/plugins/_official/scenarios/od-design-refine/`
- `/home/quetza/projects/open-design/plugins/_official/scenarios/od-code-migration/`

## Verification

- `git clone --depth 1 https://github.com/nexu-io/open-design.git /home/quetza/projects/open-design` passed.
- `corepack pnpm install --frozen-lockfile` passed in the Open Design checkout.
- `./bin/open-design --help` passed.
- `./bin/open-design mcp install codex --print` passed and produced a dry-run command.
- `./bin/open-design status` passed and reported Open Design services idle.

## Blocker

`./bin/open-design start web` failed because Open Design 0.11.0 requires Node `~24`, while this machine currently has Node `v22.22.2`.

Open Design's suggested fix:

```bash
nvm use 24
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @open-design/daemon rebuild better-sqlite3 --pending
```

This ticket did not change the system Node version.

## Limits

- Did not install the MCP server into Codex global config; only the dry-run was performed.
- Did not change app source code.
- Did not introduce real payments, production backend, secrets, paid services, or legal/payment decisions.
