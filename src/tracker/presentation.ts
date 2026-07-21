import { MaterialCommunityIcons } from "@expo/vector-icons";
import { isIsoDate, todayIsoDate } from "./dates";
import { trackerColors as color } from "./theme";
import type { Material, MaterialStatus, Project, Supplier, TrackerTab } from "./types";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export const trackerTabs: { id: TrackerTab; label: string; icon: IconName }[] = [
  { id: "home", label: "Hoy", icon: "home-variant-outline" },
  { id: "materials", label: "Materiales", icon: "package-variant-closed" },
  { id: "suppliers", label: "Proveedores", icon: "store-outline" },
  { id: "client", label: "Vista cliente", icon: "account-eye-outline" },
];

export const statusMeta: Record<
  MaterialStatus,
  { label: string; description: string; icon: IconName; color: string; wash: string }
> = {
  to_order: {
    label: "Por pedir",
    description: "Todavía no lo has pedido.",
    icon: "cart-plus",
    color: color.clay,
    wash: color.clayWash,
  },
  ordered: {
    label: "Pedido",
    description: "Ya lo pediste al proveedor.",
    icon: "truck-delivery-outline",
    color: color.sun,
    wash: color.sunWash,
  },
  received: {
    label: "Recibido",
    description: "Ya llegó al trabajo o contigo.",
    icon: "package-variant-closed-check",
    color: color.blue,
    wash: color.blueWash,
  },
  installed: {
    label: "Usado",
    description: "Ya se usó en el trabajo.",
    icon: "check-decagram-outline",
    color: color.success,
    wash: color.successWash,
  },
};

export const paymentMeta: Record<
  Material["paymentStatus"],
  { label: string; icon: IconName; color: string; wash: string }
> = {
  pending: { label: "Pago pendiente", icon: "cash-clock", color: color.sun, wash: color.sunWash },
  deposit_paid: { label: "Anticipo registrado", icon: "cash-fast", color: color.blue, wash: color.blueWash },
  paid: { label: "Pago registrado", icon: "cash-check", color: color.success, wash: color.successWash },
};

/** @deprecated Prefer paymentMeta[status].label */
export const paymentLabel: Record<Material["paymentStatus"], string> = {
  pending: paymentMeta.pending.label,
  deposit_paid: paymentMeta.deposit_paid.label,
  paid: paymentMeta.paid.label,
};

export type DeliveryState = "late" | "waiting" | "today" | "scheduled" | "to_order" | "complete";

export type DeliveryMeta = {
  color: string;
  icon: IconName;
  label: string;
  priority: number;
  state: DeliveryState;
  wash: string;
};

function isBeforeToday(value: string, today: string) {
  return isIsoDate(value) && value < today;
}

export function deliveryMeta(material: Material, today = todayIsoDate()): DeliveryMeta {
  if (material.status === "received") {
    return {
      state: "complete",
      label: `Recibido ${formatTrackerDate(material.receivedOn)}`,
      color: color.blue,
      wash: color.blueWash,
      icon: "package-variant-closed-check",
      priority: 90,
    };
  }
  if (material.status === "installed") {
    return {
      state: "complete",
      label: "Usado en el trabajo",
      color: color.success,
      wash: color.successWash,
      icon: "check-decagram-outline",
      priority: 100,
    };
  }
  if (material.status === "ordered") {
    if (!material.expectedOn) {
      return { state: "waiting", label: "Esperando fecha", color: color.sun, wash: color.sunWash, icon: "calendar-question", priority: 1 };
    }
    if (isBeforeToday(material.expectedOn, today)) {
      return {
        state: "late",
        label: `Atrasado · ${formatTrackerDate(material.expectedOn)}`,
        color: color.clay,
        wash: color.clayWash,
        icon: "alert-octagon-outline",
        priority: 0,
      };
    }
    if (material.expectedOn === today) {
      return { state: "today", label: "Llega hoy", color: color.sun, wash: color.sunWash, icon: "truck-fast-outline", priority: 2 };
    }
    return {
      state: "scheduled",
      label: `Llega ${formatTrackerDate(material.expectedOn)}`,
      color: color.inkMuted,
      wash: color.surfaceMuted,
      icon: "calendar-clock",
      priority: 4,
    };
  }
  if (!material.expectedOn) {
    return { state: "to_order", label: "Pendiente de pedir", color: color.clay, wash: color.clayWash, icon: "cart-plus", priority: 3 };
  }
  if (isBeforeToday(material.expectedOn, today)) {
    return {
      state: "late",
      label: `Pendiente desde ${formatTrackerDate(material.expectedOn)}`,
      color: color.clay,
      wash: color.clayWash,
      icon: "alert-octagon-outline",
      priority: 0,
    };
  }
  if (material.expectedOn === today) {
    return { state: "today", label: "Pedir hoy", color: color.sun, wash: color.sunWash, icon: "cart-arrow-down", priority: 2 };
  }
  return {
    state: "to_order",
    label: `Pedir antes de ${formatTrackerDate(material.expectedOn)}`,
    color: color.inkMuted,
    wash: color.surfaceMuted,
    icon: "cart-outline",
    priority: 3,
  };
}

export function nextMaterialForAction(materials: Material[], today = todayIsoDate()) {
  return materials.reduce<Material | undefined>((next, material) => {
    if (material.status === "installed") {
      return next;
    }
    if (!next) {
      return material;
    }
    const materialMeta = deliveryMeta(material, today);
    const nextMeta = deliveryMeta(next, today);
    if (materialMeta.priority !== nextMeta.priority) {
      return materialMeta.priority < nextMeta.priority ? material : next;
    }
    return material.updatedAt > next.updatedAt ? material : next;
  }, undefined);
}

export function attentionMaterialCount(materials: Material[], today = todayIsoDate()) {
  return materials.filter((material) => {
    const state = deliveryMeta(material, today).state;
    return state === "late" || state === "waiting" || state === "today";
  }).length;
}

export function formatTrackerDate(value?: string) {
  if (!value || !isIsoDate(value)) {
    return "Fecha por confirmar";
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(year, month - 1, day));
}

export function supplierFor(suppliers: Supplier[], supplierId: string) {
  return suppliers.find((supplier) => supplier.id === supplierId);
}

export function projectDescriptor(project: Project) {
  return [project.service, project.address].filter(Boolean).join(" · ") || "Trabajo en curso";
}

export function readyMaterialCount(materials: Material[]) {
  return materials.filter((material) => material.status === "received" || material.status === "installed").length;
}
