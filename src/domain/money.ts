import type { CurrencyCode, SplitShare } from "./types";

const pesoFormatter = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  currencyDisplay: "code",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
});

export function formatMoney(cents: number, currency: CurrencyCode = "MXN") {
  if (currency !== "MXN") {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  return pesoFormatter.format(cents / 100);
}

export function parseMoneyInput(value: string) {
  const normalized = value
    .trim()
    .replace(/mxn/gi, "")
    .replace(/\$/g, "")
    .replace(/\s/g, "");

  if (!normalized) {
    return null;
  }

  const decimalNormalized =
    normalized.includes(",") && !normalized.includes(".")
      ? normalized.replace(",", ".")
      : normalized.replace(/,/g, "");

  if (!/^\d+(\.\d{0,2})?$/.test(decimalNormalized)) {
    return null;
  }

  const amount = Number(decimalNormalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}

export function splitEqual(amountCents: number, participantIds: string[]): SplitShare[] {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("amountCents must be a positive integer");
  }
  if (participantIds.length === 0) {
    throw new Error("At least one participant is required");
  }

  const baseShare = Math.floor(amountCents / participantIds.length);
  const remainder = amountCents % participantIds.length;

  return participantIds.map((memberId, index) => ({
    memberId,
    amountCents: baseShare + (index < remainder ? 1 : 0),
  }));
}
