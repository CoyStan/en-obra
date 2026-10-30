import { formatDisplayDate } from "./dates";
import { toWaMeDigits } from "./phone";
import type { MaterialStatus } from "./types";

type SupplierMessageInput = {
  jobName: string;
  materialName: string;
  quantity?: string;
  need: string;
  expectedOn?: string;
};

type ClientMessageItem = {
  name: string;
  quantity?: string;
  status: MaterialStatus;
};

type ClientMessageInput = {
  jobName: string;
  clientFirstName: string;
  materialsReadyCount: number;
  materialsTotal: number;
  items: ClientMessageItem[];
};

export function buildSupplierMessage(input: SupplierMessageInput) {
  const lines = [
    `Hola, te escribo por el trabajo “${input.jobName}”.`,
    `Necesito ${input.need}: ${input.materialName}${input.quantity ? ` (${input.quantity})` : ""}.`,
  ];

  if (input.expectedOn) {
    lines.push(`¿Puedes confirmar entrega para ${formatDisplayDate(input.expectedOn)}?`);
  } else {
    lines.push("¿Me confirmas disponibilidad y fecha?");
  }

  return lines.join("\n");
}

export function buildClientMessage(input: ClientMessageInput) {
  const readyLine = `${input.materialsReadyCount} de ${input.materialsTotal} materiales ya están listos en obra.`;
  const itemLines = input.items.slice(0, 5).map((item) => {
    const quantity = item.quantity ? ` (${item.quantity})` : "";
    return `- ${item.name}${quantity}`;
  });

  return [
    `Hola ${input.clientFirstName}, actualización de “${input.jobName}”.`,
    readyLine,
    itemLines.length ? "Materiales recientes:" : "Seguimos confirmando las próximas entregas.",
    ...itemLines,
  ].join("\n");
}

export function waMeUrl(phoneE164: string, text: string) {
  const digits = toWaMeDigits(phoneE164);
  if (!digits) {
    return undefined;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
