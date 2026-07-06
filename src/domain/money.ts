import type { CurrencyCode } from "./types";
export { splitEqual } from "./splits";

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
