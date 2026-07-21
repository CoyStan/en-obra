export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isIsoDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function fromIsoDate(value?: string) {
  if (!value || !isIsoDate(value)) {
    return undefined;
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayIsoDate(now: Date = new Date()) {
  return toIsoDate(now);
}

export function formatDisplayDate(value?: string) {
  if (!value || !isIsoDate(value)) {
    return "Fecha por confirmar";
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(year, month - 1, day));
}

export function addDaysIsoDate(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return toIsoDate(next);
}
