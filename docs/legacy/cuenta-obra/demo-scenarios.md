# Rich demo scenarios

This is a deliberately busy but believable snapshot of a two-person service
business on 18 July 2026. It tests whether Cuenta Obra stays useful when the
work day is messy, not just when every supplier is on time.

| Scenario | Job | What must stay clear in the app |
| --- | --- | --- |
| Late delivery | Jardín de Camila | Gravel was promised two days ago; it must become the next move, ahead of newer records. |
| Waiting for a date | Jardín de Camila | A supplier accepted the order but has not confirmed a delivery time. |
| Due today / scheduled | Jardín de Camila | Some deliveries are due today and some later, without looking like an emergency. |
| Partly complete job | Jardín de Camila | Received and installed materials remain visible as proof while pending work stays actionable. |
| Missing supplier contact | Jardín de Camila | A material can exist before the supplier is fully known; the UI says `Sin proveedor` rather than failing. |
| No supplier WhatsApp | Pintura de la sala | The provider can save a supplier without a number; attempting to write gives a useful next step. |
| Client without WhatsApp | Reparación del baño | Client updates never crash or try to send when no number was captured. |
| New, empty job | Limpieza de entrega | An empty materials list has a focused start action instead of a blank view. |
| Fully finished job | Mantenimiento del portón | The home screen reaches the all-caught-up state when every material was used. |
| Long names and many records | Repisas / Ventiladores | Long real-world material names truncate gracefully and the list remains scrollable. |

The demo includes 7 jobs, 9 supplier records, and 36 material records across
all four workflow states. It is seed data only; no payment or cost data is
shown in the product UI.
