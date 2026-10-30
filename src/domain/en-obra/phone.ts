const MIN_WHATSAPP_DIGITS = 10;

function digitsOnly(raw: string) {
  return raw.replace(/\D/g, "");
}

export function normalizePhoneToE164(raw: string, defaultCountry = "MX") {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    const digits = digitsOnly(trimmed);
    return digits ? `+${digits}` : "";
  }

  const digits = digitsOnly(trimmed);
  if (!digits) {
    return "";
  }

  if (defaultCountry === "MX" && digits.length === 10) {
    return `+52${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("52")) {
    return `+${digits}`;
  }

  if (digits.length >= 11) {
    return `+${digits}`;
  }

  return "";
}

export function formatPhoneDisplay(e164: string) {
  if (!e164) {
    return "";
  }

  const digits = digitsOnly(e164);
  if (digits.startsWith("52") && digits.length === 12) {
    const local = digits.slice(2);
    return `+52 ${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
  }

  if (digits.startsWith("57") && digits.length === 12) {
    const local = digits.slice(2);
    return `+57 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }

  return e164.startsWith("+") ? e164 : `+${digits}`;
}

export function isValidPhoneForWhatsApp(e164: string) {
  const digits = digitsOnly(e164);
  return digits.length >= MIN_WHATSAPP_DIGITS;
}

export function toWaMeDigits(e164: string) {
  return digitsOnly(e164);
}
