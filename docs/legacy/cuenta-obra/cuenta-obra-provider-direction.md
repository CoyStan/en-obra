# Cuenta Obra — provider-first direction

## Product thesis

Cuenta Obra is not an ERP, an accounting system, or a payment product. It is the shared **work and material record** for a one- or two-person service business: gardener, painter, plumber, installer, cleaner, or small contractor.

The provider should always be able to answer three questions in seconds:

1. **What work do I need to move today?**
2. **What material is missing, ordered, or already received?**
3. **What can I safely show the client?**

The client gets calm, read-only visibility of deliveries and progress. Provider prices, payment notes, and supplier conversations stay private.

## Audience and design posture

Do not frame the audience as "uneducated." The real constraint is that this person is working in the field, interrupted by calls and WhatsApp, may have a basic phone, and may have little experience with business software. The product must respect their practical knowledge.

- Spanish first; use familiar words: **trabajo**, **cliente**, **material**, **proveedor**, **llegó**.
- One clear action per screen; no business jargon such as CRM, SKU, accounts payable, or workflow.
- Large tap targets, icon plus text, high contrast, and short sentences.
- The happy path must work with a first name, WhatsApp number, and one material name. Everything else is optional.
- A photo, voice note, or WhatsApp share is more natural than a complex form.

## What the closest alternatives teach us

| Product | How it is used | What to borrow | What Cuenta Obra must avoid |
| --- | --- | --- | --- |
| [Alegra](https://www.alegra.com/costarica/) | General business hub for invoice, POS, accounting, purchases, inventory, and reports. | Centralizing contacts and purchases gives a single source of truth. | Tax setup, POS, accounting, catalog administration, and a menu of unrelated modules. |
| [Siigo](https://www.siigo.com/) | Administrative/accounting suite for inventory, purchases, payroll, and compliance across several LATAM countries. | Their aspiration to be logical for non-accountants. | Supplier tax data, reports, document types, and back-office steps before the job can start. |
| [Bind ERP](https://bind.com.mx/erp/proceso-de-compra) | Mexican ERP connecting purchasing, supplier catalogues, inventory, sales, finance, and accounting. | A connected record of what was ordered, received, and paid. | Multi-warehouse, purchase orders, bank reconciliation, formal supplier records, and report-heavy control. |
| [Obrahub](https://www.obrahub.app/) | Contractor app: quote becomes project, then expenses, documentation, photos, customer history, and WhatsApp sharing. | Project-centric work, field photos, and one-tap WhatsApp sharing. | Financial dashboards, AR measuring tools, digital signatures, calculators, and broad contractor toolbox in v1. |
| [AppTec](https://www.apptec.com.ar/) | Service-team operations: work orders, technician assignment, client history, inventory and material requests. | A field worker's day should be clear, quick, and mobile-ready. | Dispatching, team assignment, serial numbers, route planning, and stock-minimum systems for a solo provider. |
| [Traziq](https://traziq.com/) | Construction operations: attendance, wages, budgets, and daily evidence replacing WhatsApp and spreadsheets. | Replace scattered chats and uncontextualized photos with one work record. | Payroll, attendance and cost-control complexity that belongs to larger works. |

### Market position

The gap is deliberately narrow:

> **"The simple record that keeps a small job moving and lets the client see proof of progress."**

ERPs model a company. Field-service suites model a team. Cuenta Obra should model **one live job**.

## The minimum useful model

```text
Provider
  └── Work (project)
        ├── Client (name + WhatsApp)
        ├── Materials (name, provider, simple status, optional photo/note)
        └── Client update (read-only progress link / WhatsApp message)

Supplier
  └── name + WhatsApp + what they usually provide
```

No stock catalog. No invoices. No payments. No accounting. No formal client record required before creating a job.

## Stupidly easy core flows

### 1. Start a job — under one minute

The home screen has one dominant button: **Nuevo trabajo**.

1. "¿Qué vas a hacer?" — `Jardín de Camila` or `Pintar el cuarto de Ana`.
2. "¿Para quién?" — first name + WhatsApp. Address is optional.
3. Tap **Empezar trabajo**.

The app opens the new job immediately. Do not ask for estimated cost, dates, category, tax ID, billing address, team, or a template.

### 2. Add what is needed — one screen, one decision

Inside a job, show **+ Agregar material**.

1. Tap a photo or type/voice `10 bolsas de tierra`.
2. Choose an existing provider as a large chip, or tap **Nuevo proveedor**.
3. Optionally say when it should arrive.
4. Tap **Guardar**.

Default status: **Falta pedir**. Prices and payment notes are optional, provider-only, and never block saving.

### 3. Update progress — one big next-state button

Material rows are action cards, not an accounting table on a phone:

`Falta pedir  →  Marcar pedido  →  Marcar que llegó  →  Marcar usado`

When an item arrives, ask only: **"¿Llegó bien?"** with `Sí, llegó` and optional `Tomar foto`. The photo makes the client update credible without creating paperwork.

### 4. Add a provider — no catalog ceremony

**Nuevo proveedor** asks for only:

- Name or business name
- WhatsApp number
- What they sell (`plantas`, `pintura`, `tubería`) — optional

The next screen has a direct **Escribir por WhatsApp** button pre-filled with the job and material. The app records the promise/date; it does not attempt to replace WhatsApp.

### 5. Keep the client calm — never expose internal data

The provider taps **Enviar avance**. The client gets a WhatsApp message or a read-only link containing only:

- Work name and a simple `1 de 3 materiales listos` progress line
- What arrived and optional proof photo
- What is expected next
- A plain sentence: `No muestra precios ni pagos.`

## Information architecture

### Desktop: a practical control panel, not a finance dashboard

Left navigation:

1. **Hoy** — one next action and recent jobs
2. **Trabajos** — project list and create project
3. **Proveedores** — people/businesses you buy from
4. **Clientes** — only clients with active or recent jobs

The right side is the active workspace. For an open job, the top contains the job name, client, and an obvious **Agregar material** button. Below it, the focal object is a material table on desktop with status and next action in the final column. It should never lead with profit, payments, or dense metrics.

### Phone: the companion for the work site

Phone home shows only:

1. **Lo siguiente** — one card, one button.
2. **Mis trabajos** — large cards with a status dot.
3. A fixed **+** for a work, material, photo, or provider.

Project details use a short vertical list of action cards. Navigation uses four labeled icons, never icons alone.

## Visual direction

**Signature:** the "next physical move" card. It reads like a work ticket, not a spreadsheet: material icon, plain status, supplier/name, promised date, and one full-width action.

- **Color world:** fresh leaf green (work moving), terracotta (missing / needs attention), warm yellow (ordered / expected), pale blue (received), cement gray (structure), off-white paper (calm canvas).
- **Typography:** large, bold Spanish labels; 16px minimum body text; numbers only where useful.
- **Depth:** quiet paper surfaces with soft separators. No glossy gradients, no neon charts, no tiny dense widgets.
- **Imagery:** real proof photos of materials and work when available; no stock photos inside the workflow.
- **Desktop density:** calm sidebar, generous header, dense but readable table in the workspace.
- **Phone density:** one decision per card; 48px minimum action height.

## MVP boundary

Ship only these:

- Create / archive a work
- Create client while creating a work
- Create/select provider while adding a material
- Add material with optional due date, photo, note, and private price note
- Four material states: falta pedir, pedido, llegó, usado
- Provider WhatsApp opener with a pre-filled message
- Read-only client update/share that hides internal data
- Local-first/offline-friendly storage and a plain recovery/export path

Do not ship in v1:

- In-app payments or money movement
- Invoicing, tax, payroll, accounting, inventory stock, warehouse, purchase orders
- Team dispatch, GPS, approvals, automations, formal CRM, dashboards, charts, or AI

## Pricing posture versus Obrahub

Obrahub publicly lists a free plan with up to three active projects, Plus at **US$9.99/month** for an individual, and Pro at **US$23.99/month** for multi-user teams. Plus includes broad contractor features such as quotes, profitability dashboards, signatures, inventory, client management, iCloud sync, and WhatsApp. It is currently iPhone/iPad-only; its site says Android and web are still in progress.

Cuenta Obra must not try to beat its free price. Instead, make the provider-first workflow available on **Android and web** and price only the convenience of unlimited, backed-up work:

| Plan | Recommended price | Purpose |
| --- | --- | --- |
| Free | US$0 | 3 active jobs, providers, simple materials, client-ready WhatsApp update. The user can complete a real job before paying. |
| Simple | **US$2.99/month** or **US$24/year** | Unlimited active jobs, cloud backup, client update history, enough proof-photo storage for an individual provider. |
| Dúo | **US$5.99/month** | Two people can update the same job. No dispatch or enterprise permissions. |

At US$2.99/month, Simple is about 70% below Obrahub Plus; US$24/year is about US$2/month, about 80% below it. Show local-currency prices that stay easy to understand in the launch country.

This pricing works only if the product stays narrow. Do not add quotes/PDF rendering, payments, accounting, AR measurement, GPS tracking, signature workflows, calculators, or expensive unlimited media to the first paid plan. Those are Obrahub's cost and complexity; **one clear job record, material status, provider WhatsApp, and client proof** are ours.

## Success metric

The first-session test is not "did the person complete onboarding?" It is:

> A provider can create one job, add one provider and one material, mark it ordered, and send the client an update — without help — in under five minutes.
