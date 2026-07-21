import { describe, expect, it } from "vitest";
import { migrateV1ToV2 } from "../en-obra/migrate";

describe("migrateV1ToV2", () => {
  it("preserves edited records and normalizes v2 fields", () => {
    const migrated = migrateV1ToV2({
      version: 1,
      activeProjectId: "project-1",
      projects: [
        {
          id: "project-1",
          name: "Jardín editado",
          clientName: "Camila Torres",
          clientPhone: "5511223344",
          address: "Roma Sur",
          service: "Renovación",
          startedOn: "2026-07-14",
        },
      ],
      suppliers: [
        {
          id: "supplier-1",
          name: "Vivero Norte",
          category: "Plantas",
          phone: "",
          lastContactAt: "2026-07-18T12:00:00Z",
          lastContactNote: "Entrega confirmada.",
        },
      ],
      materials: [
        {
          id: "material-1",
          projectId: "project-1",
          supplierId: "",
          name: "Tierra negra",
          quantity: "12 costales",
          priceCents: 228000,
          paymentStatus: "paid",
          status: "ordered",
          expectedOn: "2026-07-20",
          createdAt: "2026-07-15T12:00:00Z",
          updatedAt: "2026-07-18T12:30:00Z",
        },
        {
          id: "material-2",
          projectId: "project-1",
          supplierId: "supplier-1",
          name: "Macetas",
          quantity: "6 piezas",
          priceCents: 90000,
          paymentStatus: "pending",
          status: "received",
          expectedOn: "2026-07-18",
          receivedOn: "2026-07-18",
          proofNote: "Recibidas en obra.",
          createdAt: "2026-07-16T10:00:00Z",
          updatedAt: "2026-07-18T15:10:00Z",
        },
      ],
    });

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.projects[0]).toMatchObject({
      name: "Jardín editado",
      lifecycle: "active",
      clientPhone: "+525511223344",
    });
    expect(migrated.materials[0]).toMatchObject({
      name: "Tierra negra",
      quantity: "12 costales",
      supplierId: undefined,
      expectedOn: "2026-07-20",
      statusChangedAt: "2026-07-18T12:30:00Z",
    });
    expect(migrated.materials[0]).not.toHaveProperty("priceCents");
    expect(migrated.materials[0]).not.toHaveProperty("paymentStatus");
    expect(migrated.materials[1]).toMatchObject({
      status: "received",
      expectedOn: "2026-07-18",
      receivedOn: "2026-07-18",
      proofNote: "Recibidas en obra.",
    });
  });
});
