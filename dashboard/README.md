# En Obra dashboard (internal)

This Vite + React workspace is an **internal design and demo shell** for En Obra
UI patterns (shadcn-style tables, sheets, and status flows). It is **not** the
canonical mobile app.

## Setup

From the repo root (npm workspaces):

```bash
npm ci
npm run dev:dashboard
```

Or from this folder:

```bash
npm run dev -- --host 0.0.0.0 --port 8081
```

## Verify

```bash
npm run build --workspace dashboard
npm run lint --workspace dashboard
```

The Expo app at the repo root is the pilot product surface. See
[docs/product/en-obra-pilot.md](../docs/product/en-obra-pilot.md).
