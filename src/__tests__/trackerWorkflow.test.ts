import { describe, expect, it } from "vitest";
import { trackerDemoData } from "../tracker/demoData";
import { attentionMaterialCount, deliveryMeta, nextMaterialForAction, projectDescriptor } from "../tracker/presentation";
import type { V1Material } from "../tracker/v1types";
import type { Material } from "../tracker/types";
import { createProjectRecord, createSupplierRecord, parsePriceCents, updateMaterialDetailsRecord, updateMaterialStatusRecord, updateProjectRecord, updateSupplierRecord } from "../tracker/workflow";

import type { V1Project as V1Proj, V1Supplier as V1Supp } from "../tracker/v1types";

// Hybrid fixture: satisfies both V1Material (for workflow fns) and Material v2 (for presentation fns).
const baseMaterial: V1Material & Material = {
  id: "material-1",
  projectId: "project-1",
  supplierId: "supplier-1",
  name: "Piedra de río",
  quantity: "4 sacos",
  priceCents: 48000,
  status: "ordered",
  paymentStatus: "deposit_paid",
  statusChangedAt: "2026-07-18T09:00:00Z",
  createdAt: "2026-07-18T09:00:00Z",
  updatedAt: "2026-07-18T09:00:00Z",
};

const baseProject: V1Proj = {
  id: "project-1",
  name: "Jardín frontal",
  clientName: "Camila",
  clientPhone: "525512345678",
  address: "Roma Sur",
  service: "Trabajo en curso",
  startedOn: "2026-07-18",
};

const baseSupplier: V1Supp = {
  id: "supplier-1",
  name: "Vivero del barrio",
  category: "Plantas",
  phone: "525598765432",
  lastContactAt: "2026-07-18T09:00:00Z",
  lastContactNote: "Entrega el jueves.",
};

describe("tracker workflow", () => {
  it("parses common local price inputs into cents", () => {
    expect(parsePriceCents("1,250.50")).toBe(125050);
    expect(parsePriceCents("$480")).toBe(48000);
    expect(parsePriceCents("sin costo")).toBe(0);
  });

  it("records receipt confirmation when the provider explicitly selects received", () => {
    const received = updateMaterialStatusRecord(baseMaterial, { status: "received" }, "2026-07-18T17:30:00Z");

    expect(received.status).toBe("received");
    expect(received.receivedOn).toBe("2026-07-18");
    expect(received.proofNote).toBe("Recepción confirmada por el proveedor.");
  });

  it("records a receipt date when the provider marks an order as used", () => {
    const installed = updateMaterialStatusRecord(baseMaterial, { status: "installed" }, "2026-07-18T17:30:00Z");

    expect(installed).toMatchObject({
      status: "installed",
      receivedOn: "2026-07-18",
      proofNote: "Material usado en el trabajo.",
    });
  });

  it("lets the provider select the exact status and receipt date instead of advancing one step", () => {
    const received = updateMaterialStatusRecord(baseMaterial, { status: "received", receivedOn: "2026-07-17" }, "2026-07-18T17:30:00Z");

    expect(received).toMatchObject({
      status: "received",
      receivedOn: "2026-07-17",
      proofNote: "Recepción confirmada por el proveedor.",
    });
    expect(updateMaterialStatusRecord(received, { status: "received", receivedOn: "2026-07-17" }, "2026-07-18T18:00:00Z")).toBe(received);
    expect(updateMaterialStatusRecord(received, { status: "ordered" }, "2026-07-18T18:00:00Z")).toMatchObject({
      status: "ordered",
      receivedOn: undefined,
      proofNote: undefined,
    });
  });

  it("adds, changes, and clears an expected delivery only while an item is ordered", () => {
    const dated = updateMaterialStatusRecord(baseMaterial, { status: "ordered", expectedOn: "2026-07-21" }, "2026-07-18T17:30:00Z");
    const cleared = updateMaterialStatusRecord(dated, { status: "ordered" }, "2026-07-18T18:00:00Z");

    expect(dated.expectedOn).toBe("2026-07-21");
    expect(cleared.expectedOn).toBeUndefined();
  });

  it("does not accept a future receipt date", () => {
    const received = updateMaterialStatusRecord(baseMaterial, { status: "received", receivedOn: "2026-07-19" }, "2026-07-18T17:30:00Z");

    expect(received.receivedOn).toBe("2026-07-18");
  });

  it("makes a work from only a job and client name", () => {
    expect(createProjectRecord({ name: "  Pintar patio  ", clientName: "  Rosa  " }, "project-2", "2026-07-18")).toMatchObject({
      id: "project-2",
      name: "Pintar patio",
      clientName: "Rosa",
      clientPhone: "",
      address: "",
      service: "Trabajo en curso",
    });
  });

  it("keeps a new provider lightweight and WhatsApp-ready", () => {
    expect(createSupplierRecord({ name: "  Vivero del barrio ", phone: "+52 55 1234 5678" }, "supplier-2", "2026-07-18T12:00:00Z")).toMatchObject({
      id: "supplier-2",
      name: "Vivero del barrio",
      phone: "525512345678",
      category: "Materiales y trabajo",
    });
  });

  it("calls out late and date-less deliveries without treating scheduled work as urgent", () => {
    const late = { ...baseMaterial, expectedOn: "2026-07-16" };
    const waiting = { ...baseMaterial, id: "material-2", expectedOn: undefined, updatedAt: "2026-07-18T19:00:00Z" };
    const scheduled = { ...baseMaterial, id: "material-3", expectedOn: "2026-07-21" };

    expect(deliveryMeta(late, "2026-07-18")).toMatchObject({ state: "late", label: "Atrasado · 16 jul" });
    expect(deliveryMeta(waiting, "2026-07-18")).toMatchObject({ state: "waiting", label: "Esperando fecha" });
    expect(deliveryMeta(scheduled, "2026-07-18")).toMatchObject({ state: "scheduled", label: "Llega 21 jul" });
    expect(attentionMaterialCount([late, waiting, scheduled], "2026-07-18")).toBe(2);
  });

  it("puts the most delayed material ahead of newer records in the next action", () => {
    const waiting = { ...baseMaterial, id: "material-waiting", expectedOn: undefined, updatedAt: "2026-07-18T19:00:00Z" };
    const late = { ...baseMaterial, id: "material-late", expectedOn: "2026-07-16", updatedAt: "2026-07-16T08:00:00Z" };

    expect(nextMaterialForAction([waiting, late], "2026-07-18")?.id).toBe("material-late");
  });

  it("does not leave a dangling separator when a new work has no address yet", () => {
    expect(projectDescriptor({
      id: "project-empty-address",
      name: "Limpieza de entrega",
      clientName: "Elena",
      clientPhone: "",
      address: "",
      service: "Limpieza final",
      startedOn: "2026-07-18",
      lifecycle: "active" as const,
    })).toBe("Limpieza final");
  });

  it("updates material details without touching status or price", () => {
    const updated = updateMaterialDetailsRecord(
      baseMaterial,
      { name: "  Piedra blanca ", quantity: " 6 sacos ", supplierId: "supplier-2", expectedOn: "2026-07-22" },
      "2026-07-18T20:00:00Z",
    );

    expect(updated).toMatchObject({
      name: "Piedra blanca",
      quantity: "6 sacos",
      supplierId: "supplier-2",
      expectedOn: "2026-07-22",
      status: "ordered",
      priceCents: 48000,
      updatedAt: "2026-07-18T20:00:00Z",
    });
    expect(updateMaterialDetailsRecord(
      updated,
      { name: "Piedra blanca", quantity: "6 sacos", supplierId: "supplier-2", expectedOn: "2026-07-22" },
      "2026-07-18T20:00:00Z",
    )).toBe(updated);
  });

  it("ignores expected delivery edits once a material is already received", () => {
    const received = { ...baseMaterial, status: "received" as const, expectedOn: "2026-07-20", receivedOn: "2026-07-18" };
    const updated = updateMaterialDetailsRecord(
      received,
      { name: "Piedra blanca", quantity: "6 sacos", supplierId: "supplier-2", expectedOn: "2026-07-25" },
      "2026-07-18T20:00:00Z",
    );

    expect(updated.expectedOn).toBe("2026-07-20");
  });

  it("updates project contact details while keeping service metadata", () => {
    const updated = updateProjectRecord(baseProject, {
      name: "  Jardín trasero ",
      clientName: "  Camila R ",
      clientPhone: "+52 55 1111 2222",
      address: "  Condesa ",
    });

    expect(updated).toMatchObject({
      id: "project-1",
      name: "Jardín trasero",
      clientName: "Camila R",
      clientPhone: "525511112222",
      address: "Condesa",
      service: "Trabajo en curso",
      startedOn: "2026-07-18",
    });
  });

  it("updates supplier contact and last agreement note", () => {
    const updated = updateSupplierRecord(
      baseSupplier,
      { name: "  Vivero Norte ", phone: "55 9999 8888", category: "  Tierra y plantas ", lastContactNote: "  Entrega confirmada para el lunes " },
      "2026-07-18T21:00:00Z",
    );

    expect(updated).toMatchObject({
      name: "Vivero Norte",
      phone: "5599998888",
      category: "Tierra y plantas",
      lastContactNote: "Entrega confirmada para el lunes",
      lastContactAt: "2026-07-18T21:00:00Z",
    });
    expect(updateSupplierRecord(updated, { name: "Vivero Norte" }, "2026-07-18T22:00:00Z").lastContactNote).toBe("Entrega confirmada para el lunes");
  });

  it("ships a rich demo that covers blocked, empty, and finished work", () => {
    const camilaMaterials = trackerDemoData.materials.filter((material) => material.projectId === "project-camila");
    const mateoMaterials = trackerDemoData.materials.filter((material) => material.projectId === "project-mateo");

    expect(trackerDemoData.projects).toHaveLength(7);
    expect(trackerDemoData.suppliers).toHaveLength(9);
    expect(trackerDemoData.materials).toHaveLength(36);
    expect(camilaMaterials.some((material) => deliveryMeta(material as unknown as Material, "2026-07-18").state === "late")).toBe(true);
    expect(camilaMaterials.some((material) => material.supplierId === "supplier-pending")).toBe(true);
    expect(trackerDemoData.materials.some((material) => material.projectId === "project-elena")).toBe(false);
    expect(mateoMaterials).toHaveLength(4);
    expect(mateoMaterials.every((material) => material.status === "installed")).toBe(true);
  });
});
