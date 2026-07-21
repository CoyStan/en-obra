# Cuenta Obra engineering checklist

This is the working build standard for Cuenta Obra. It converts established Android, Expo, accessibility, and OWASP guidance into release criteria for an Android-first work tracker. It supplements the launch contract; it does not replace legal review or a production security assessment.

## Source standards

- [Android core app quality](https://developer.android.com/docs/quality-guidelines/core-app-quality) for interruptions, state restoration, consistent flows, and real-device QA.
- [Android date picker guidance](https://developer.android.com/develop/ui/compose/components/datepickers) for modal or input date selection rather than ambiguous free text.
- [Expo DateTimePicker](https://docs.expo.dev/versions/latest/sdk/date-time-picker/) for a native, Expo-compatible date control in this codebase.
- [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) for labels, tap/focus states, errors, long content, forms, and web keyboard support.
- [OWASP MASVS](https://mas.owasp.org/MASVS/) and its [checklist](https://mas.owasp.org/checklists/) for mobile storage, auth, network, platform, code, and privacy controls.
- [OWASP API Security Top 10](https://owasp.org/API-Security/) for the future authenticated backend.

## Product interaction rules

- [x] A material status is selected from an explicit sheet or menu. A single tap must never silently cycle through `Por pedir`, `Pedido`, `Recibido`, and `Usado`.
- [x] The current state, available choices, and effect are readable before save. The provider can cancel without changing the record.
- [x] Marking `Recibido` defaults the receipt date to today and lets the provider change it with a date picker. The app stores a date-only ISO value (`YYYY-MM-DD`) and renders it with `Intl.DateTimeFormat`.
- [x] An expected delivery date is optional. When absent, the UI says `Esperando fecha`; it never pretends an unknown date exists.
- [x] No provider must type a date format from memory. Inputs use the correct native control or keyboard, and errors state how to fix the problem.
- [x] Every write has a clear success/failure state. Repeated taps cannot create a duplicate material or delivery confirmation.
- [ ] Destructive actions require a confirmation or an undo period.
- [x] Client views expose only the selected job's safe fields: no costs, supplier contact, internal note, or other-client data.

## Frontend and UX acceptance criteria

- [ ] Use real Android/Expo controls where they reduce cognitive load: native date picker, keyboard type for phone/quantity, radio options for finite states, and a bottom sheet for a focused choice.
- [x] All controls have a visible label, 44px touch target or equivalent hit area, keyboard path on web, and a clear selected/disabled/error state.
- [x] Forms preserve incomplete input when a sheet is interrupted and never auto-focus a mobile keyboard without a clear benefit.
- [x] Long names, no phone number, missing supplier, no date, empty work, and all-complete work render intentionally.
- [ ] Test 320px, 390px, 768px, 1024px, and 1440px widths; test Android back, sleep/resume, app switching, low battery, and connectivity changes.
- [x] Keep the home screen focused on one next physical move. Dense history belongs in the materials view.
- [x] Run an interaction test for each new flow and inspect desktop/mobile screenshots before marking it complete.

## Data and backend acceptance criteria

- [ ] Every production record carries an ID, workspace ID, creator, timestamps, server revision, and an idempotency key for client mutations.
- [ ] The server, not the app UI, enforces workspace membership and field-level access. Client-share tokens are opaque, hashed, expiring, revocable, and limited to one safe work view.
- [ ] Validate status transitions and date fields on the server. A material has one supported state, `expectedOn` is nullable/date-only, and `receivedOn` is added only with a receipt confirmation.
- [ ] Offline mutations queue locally and retry safely. Conflicts preserve the provider's evidence; retries are idempotent.
- [ ] APIs are authenticated, authorized per object and field, rate-limited, versioned, inventoried, logged with minimal data, and protected against excessive resource use and unsafe third-party API consumption.
- [ ] Credentials/tokens use platform secure storage; work records and logs do not contain more personal data than needed.
- [ ] Backups, restore tests, deletion jobs, retention, observability, and incident response are implemented before real data is marketed as synced.

## Release gate

- [ ] The Android quality flows pass on physical low-cost devices: all screens, offline/online changes, sleep/resume, app switching, and purchase paths.
- [ ] The relevant MASVS and API checklist controls have an owner, evidence, and a review result.
- [ ] The Data Safety declaration, privacy policy, terms, Drive consent copy, support route, deletion route, and billing screens describe the actual shipped behavior—nothing aspirational.
