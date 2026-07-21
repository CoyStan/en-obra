# Open Design (legacy Cuentas Claras tooling note)

Historical helper for the archived expense-split product. Active product is En Obra — see docs/product/en-obra-pilot.md.

# Open Design Integration

Open Design is used as a design accelerator for Cuentas Claras, not as a runtime dependency of the Expo app.

## Local Checkout

The local Open Design checkout lives outside this repo:

```bash
/home/quetza/projects/open-design
```

It was cloned from:

```bash
https://github.com/nexu-io/open-design
```

Current inspected revision:

```bash
6afe7ea
```

This keeps the Cuentas Claras repo small while still letting Codex inspect Open Design design systems, skills, templates, and plugins.

## Wrapper

Use the repo-local wrapper from Cuentas Claras:

```bash
./bin/open-design --help
./bin/open-design status
./bin/open-design run web
```

The wrapper:

- Uses `/home/quetza/projects/open-design` by default.
- Allows overriding with `OPEN_DESIGN_HOME=/path/to/open-design`.
- Adds a repo-local `pnpm` shim backed by Corepack, because this machine did not have a global `pnpm` binary.
- Does not modify Cuentas Claras runtime dependencies.

## Useful Open Design Material

High-value sources for this app:

- `/home/quetza/projects/open-design/design-systems/stripe/DESIGN.md`
- `/home/quetza/projects/open-design/design-systems/wise/DESIGN.md`
- `/home/quetza/projects/open-design/design-systems/revolut/DESIGN.md`
- `/home/quetza/projects/open-design/design-systems/expo/DESIGN.md`
- `/home/quetza/projects/open-design/design-templates/mobile-app/`
- `/home/quetza/projects/open-design/plugins/_official/scenarios/od-design-refine/`
- `/home/quetza/projects/open-design/plugins/_official/scenarios/od-code-migration/`

## Cuentas Claras Usage Pattern

Use Open Design for planning and critique before changing app code:

1. Read the current Cuentas Claras screen code and design notes.
2. Read Open Design's Stripe, Wise, Revolut, and Expo design systems.
3. Ask for Android-first mobile finance directions with low cognitive load, Spanish-first copy, MXN, no real payments, and local-first shared-expense flows.
4. Convert the chosen direction into Company OS implementation tickets.
5. Implement in React Native manually, preserving local data and tests.

Do not directly paste generated HTML/CSS into the React Native app. Treat Open Design output as art direction, layout strategy, and component inspiration.

## MCP Dry Run

Open Design reports the Codex MCP setup as:

```bash
codex mcp add open-design -- od mcp --daemon-url http://127.0.0.1:7456
```

This was verified with a dry run only:

```bash
./bin/open-design mcp install codex --print
```

Do not install the MCP globally until the founder explicitly wants that local Codex config change.

## Runtime Notes

Open Design 0.11.0 declares Node `~24`. This machine currently has Node `v22.22.2`. Dependency installation completed with warnings, and read/CLI inspection works, but the full daemon/web runtime is blocked by Open Design's Node 24 gate.

The attempted command:

```bash
./bin/open-design start web
```

failed with Open Design's prescribed fix:

```bash
nvm use 24
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @open-design/daemon rebuild better-sqlite3 --pending
```

Until Node 24 is available, use the local checkout as a source library for design systems, skills, templates, and plugin instructions.

The install also warned that `node-pty` build scripts were ignored. If the desktop/terminal sidecar needs PTY support, run Open Design's recommended `pnpm approve-builds` flow in the Open Design checkout after reviewing the dependency.
