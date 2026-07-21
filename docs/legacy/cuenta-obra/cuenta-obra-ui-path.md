# Cuenta Obra better UI path

Status: **bundle ready for founder accept**  
Goal: `GOAL-CUENTA-OBRA`  
Authority: `DECISION-UI-0001`  
Plan: [`cuenta-obra-ui-reconstruction-plan.md`](./cuenta-obra-ui-reconstruction-plan.md)

## Rule

Preferred kit (`dashboard/src/components/ui`, shadcn base-nova) is the visual
and structural source of truth. Reconstruct Cuenta Obra Expo surfaces into owned
NativeWind equivalents of those elements.

## Bundle queue

| Work item | Intent | Attention |
| --- | --- | --- |
| `WORK-APP-0112` | Reconstruction plan | closed |
| `WORK-APP-0113` | Token bridge | receipt-ready |
| `WORK-APP-0114` | Preferred-kit primitives | receipt-ready |
| `WORK-APP-0115` | Home / next-move | needs-human-decision |
| `WORK-APP-0116` | Materials + status composer | needs-human-decision |
| `WORK-APP-0117` | Setup + desktop workspace | needs-human-decision |
| `WORK-APP-0118` | Client-safe preview | needs-human-decision |

## Accept the bundle

```bash
./bin/company-os queue
# Accept WORK-APP-0113 … WORK-APP-0118 together, then close
```
