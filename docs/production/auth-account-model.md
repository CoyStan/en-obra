# Auth And Account Model

## Current Implementation

Cuentas Claras now has a local mock account adapter:

- Provider: `local-mock`
- Storage: `@react-native-async-storage/async-storage`
- Account fields: id, display name, email, provider, created timestamp, last sign
  in timestamp
- Modes: `guest` and `signed-in`
- A local profile can store `activeMemberByGroupId`, mapping a group to the
  group member row the user is acting as in that group.

This is not production authentication. It is a replaceable boundary that lets
the app expose account-state UX and future sync/deletion flows without secrets or
external identity providers.

## Replaceable Boundary

The app code should depend on account actions rather than a specific provider:

- `createAccount(input)`
- `restoreSession()`
- `signOut()`
- future `deleteAccount()`

Production provider candidates remain undecided and require a human decision:

- email/password with a backend auth service,
- passkey-based auth,
- OAuth/Sign in with Google,
- magic link.

## UX Rules

- A user can keep using the app in local guest mode.
- Creating a demo account does not upload data.
- Account screens must show "Cuenta demo local" until a real backend exists.
- Expense entry defaults the payer to the active group member when one is mapped.
- A guest/demo user can still inspect demo data; future production auth can
  require identity before networked writes.
- If account creation ships with a production provider, the app must also ship
  an in-app account deletion path and a web deletion URL.

## Data Safety Implication

With the current mock adapter, no account data leaves the device. Once a real
provider is added, the Data Safety declaration must include account identifiers
and any backend-processed data.
