import { describe, expect, it } from "vitest";
import { toClientSnapshot } from "../en-obra/clientSnapshot";
import type { Material, Project } from "../en-obra/types";

const project: Project = {
  id: "project-1",
  name: "Jardín de Camila",
  clientName: "Camila Torres",
  clientPhone: "+525511223344",
  address: "Roma Sur, CDMX",
  service: "Renovación de jardín",
  startedOn: "2026-07-14",
  lifecycle: "active",
};

const materials: Material[] = [
  {
    id: "material-1",
    projectId: "project-1",
    supplierId: "supplier-1",
    name: "Tierra negra",
    quantity: "12 costales",
    status: "received",
    receivedOn: "2026-07-18",
    statusChangedAt: "2026-07-18T12:30:00Z",
    proofNote: "Nota interna",
    createdAt: "2026-07-15T12:00:00Z",
    updatedAt: "2026-07-18T12:30:00Z",
  },
];

describe("toClientSnapshot", () => {
  it("only exposes client-safe fields", () => {
    const snapshot = toClientSnapshot(project, materials);
    const serialized = JSON.stringify(snapshot);

    expect(snapshot).toEqual({
      name: "Jardín de Camila",
      service: "Renovación de jardín",
      address: "Roma Sur, CDMX",
      clientName: "Camila Torres",
      materials: [
        {
          name: "Tierra negra",
          quantity: "12 costales",
          status: "received",
          receivedOn: "2026-07-18",
          installedOn: undefined,
          statusChangedAt: "2026-07-18T12:30:00Z",
        },
      ],
    });
    expect(serialized).not.toMatch(/supplier|price|payment|proofNote|projectId|clientPhone/i);
  });
});
