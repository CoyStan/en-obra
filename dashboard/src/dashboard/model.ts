import { trackerDemoData } from "../../../src/tracker/demoData";
import type {
  Material,
  MaterialStatus,
  Project,
  Supplier,
  TrackerData,
} from "../../../src/tracker/types";

export type DashboardView = "home" | "materials" | "suppliers" | "client" | "whatsapp";

export const statusOptions: Array<{
  value: MaterialStatus;
  label: string;
  description: string;
}> = [
  { value: "to_order", label: "Por pedir", description: "Todavía falta pedirlo." },
  { value: "ordered", label: "Pedido", description: "El proveedor ya recibió el pedido." },
  { value: "received", label: "Recibido", description: "Ya llegó al trabajo o contigo." },
  { value: "installed", label: "Usado", description: "Ya se utilizó en el trabajo." },
];

export const paymentLabels = {
  pending: "Pendiente",
  deposit_paid: "Anticipo",
  paid: "Pagado",
} as const;

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost";

const demoToday = "2026-07-18";

export function cloneDemoData(): TrackerData {
  return JSON.parse(JSON.stringify(trackerDemoData)) as TrackerData;
}

export function formatDate(value?: string) {
  if (!value) {
    return "Fecha por confirmar";
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return "Fecha por confirmar";
  }
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(new Date(year, month - 1, day));
}

export function dateFromIso(value?: string) {
  if (!value) {
    return undefined;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return undefined;
  }
  return new Date(year, month - 1, day);
}

export function isoFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function statusLabel(status: MaterialStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? "Sin estado";
}

export function deliveryLabel(material: Material, today = demoToday) {
  if (material.status === "installed") {
    return "Usado en el trabajo";
  }
  if (material.status === "received") {
    return `Recibido ${formatDate(material.receivedOn)}`;
  }
  if (material.status === "ordered") {
    if (!material.expectedOn) {
      return "Esperando fecha";
    }
    if (material.expectedOn < today) {
      return `Atrasado · ${formatDate(material.expectedOn)}`;
    }
    if (material.expectedOn === today) {
      return "Llega hoy";
    }
    return `Llega ${formatDate(material.expectedOn)}`;
  }
  if (!material.expectedOn) {
    return "Pendiente de pedir";
  }
  if (material.expectedOn < today) {
    return `Pendiente desde ${formatDate(material.expectedOn)}`;
  }
  if (material.expectedOn === today) {
    return "Pedir hoy";
  }
  return `Pedir antes de ${formatDate(material.expectedOn)}`;
}

/** Short date line for the Entrega column (calendar row). */
export function deliveryDateLine(material: Material) {
  if (material.status === "received" || material.status === "installed") {
    return formatDate(material.receivedOn);
  }
  if (material.expectedOn) {
    return formatDate(material.expectedOn);
  }
  return "Sin fecha";
}

/** Secondary line under the date in Entrega. */
export function deliverySubLabel(material: Material, today = demoToday) {
  const state = attentionState(material, today);
  if (state === "late") return "Atrasado";
  if (state === "complete") {
    return material.status === "installed" ? "Usado" : "Recibido";
  }
  if (state === "today") return material.status === "ordered" ? "Llega hoy" : "Pedir hoy";
  if (state === "waiting") return "En camino";
  if (material.status === "ordered") return "En camino";
  if (material.status === "to_order") return "Por pedir";
  return "Programado";
}

export function attentionState(material: Material, today = demoToday) {
  if (material.status === "installed" || material.status === "received") {
    return "complete";
  }
  if (!material.expectedOn) {
    return material.status === "ordered" ? "waiting" : "normal";
  }
  if (material.expectedOn < today) {
    return "late";
  }
  if (material.expectedOn === today) {
    return "today";
  }
  return "normal";
}

/** Estado chip: late overrides status so the table matches the mockup. */
export function estadoChip(material: Material, today = demoToday): { label: string; variant: BadgeVariant } {
  if (attentionState(material, today) === "late") {
    return { label: "Atrasado", variant: "destructive" };
  }
  if (material.status === "to_order") {
    return { label: statusLabel(material.status), variant: "destructive" };
  }
  if (material.status === "ordered") {
    return { label: statusLabel(material.status), variant: "secondary" };
  }
  if (material.status === "received") {
    return { label: statusLabel(material.status), variant: "secondary" };
  }
  return { label: statusLabel(material.status), variant: "default" };
}

export function whatsAppHref(phone: string | undefined, text: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) {
    return undefined;
  }
  const withCountry = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

export function openWhatsApp(phone: string | undefined, text: string) {
  const href = whatsAppHref(phone, text);
  if (!href) {
    return false;
  }
  window.open(href, "_blank", "noopener,noreferrer");
  return true;
}

export function supplierFor(suppliers: Supplier[], supplierId: string) {
  return suppliers.find((supplier) => supplier.id === supplierId);
}

export function projectLabel(project: Project) {
  return [project.service, project.address].filter(Boolean).join(" · ") || "Trabajo en curso";
}

export function materialInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "M";
}
