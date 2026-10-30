import { addDaysIsoDate, todayIsoDate } from "./dates";
import type { Material, Project, Supplier, TrackerDataV2 } from "./types";

export function createDemoData(now: Date): TrackerDataV2 {
  const today = todayIsoDate(now);
  const yesterday = addDaysIsoDate(now, -1);
  const tomorrow = addDaysIsoDate(now, 1);
  const isoNow = now.toISOString();

  const projects: Project[] = [
    {
      id: "demo-project-jardin",
      name: "Jardín de la casa",
      clientName: "Camila Torres",
      clientPhone: "",
      address: "Roma Sur, CDMX",
      service: "Renovación de jardín",
      startedOn: yesterday,
      lifecycle: "active",
    },
    {
      id: "demo-project-pintura",
      name: "Pintura de la sala",
      clientName: "Jorge Salas",
      clientPhone: "+520000000000",
      address: "Del Valle, CDMX",
      service: "Pintura interior",
      startedOn: today,
      lifecycle: "active",
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: "demo-supplier-vivero",
      name: "Vivero La Jacaranda",
      category: "Plantas y tierra",
      phone: "+520000000001",
      createdAt: isoNow,
      updatedAt: isoNow,
      lastContactAt: isoNow,
      lastContactNote: "Confirman entrega de macetas para hoy por la tarde.",
    },
    {
      id: "demo-supplier-ferreteria",
      name: "Ferretería San Luis",
      category: "Riego y herramientas",
      phone: "",
      createdAt: isoNow,
      updatedAt: isoNow,
      lastContactAt: isoNow,
      lastContactNote: "Apartaron conexiones; falta confirmar quién recoge.",
    },
  ];

  const materials: Material[] = [
    {
      id: "demo-material-tierra",
      projectId: "demo-project-jardin",
      supplierId: "demo-supplier-vivero",
      name: "Tierra negra",
      quantity: "12 costales",
      status: "received",
      receivedOn: yesterday,
      statusChangedAt: isoNow,
      proofNote: "Recibidos en el domicilio y revisados con Camila.",
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: "demo-material-grava",
      projectId: "demo-project-jardin",
      supplierId: "demo-supplier-ferreteria",
      name: "Piedra de río",
      quantity: "8 costales",
      status: "ordered",
      expectedOn: yesterday,
      statusChangedAt: isoNow,
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: "demo-material-macetas",
      projectId: "demo-project-jardin",
      supplierId: "demo-supplier-vivero",
      name: "Macetas de barro",
      quantity: "6 piezas",
      status: "ordered",
      expectedOn: today,
      statusChangedAt: isoNow,
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: "demo-material-riego",
      projectId: "demo-project-jardin",
      name: "Kit de riego por goteo",
      quantity: "1 kit",
      status: "to_order",
      expectedOn: tomorrow,
      statusChangedAt: isoNow,
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: "demo-material-pintura",
      projectId: "demo-project-pintura",
      supplierId: "demo-supplier-ferreteria",
      name: "Pintura blanca mate",
      quantity: "4 cubetas",
      status: "to_order",
      statusChangedAt: isoNow,
      createdAt: isoNow,
      updatedAt: isoNow,
    },
  ];

  return {
    schemaVersion: 2,
    activeProjectId: "demo-project-jardin",
    projects,
    suppliers,
    materials,
  };
}
