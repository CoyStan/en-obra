import { parseMoneyInput } from "../domain/money";

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export type ValidGroupInput = {
  name: string;
  description: string;
};

export type ValidMemberInput = {
  name: string;
};

export type ValidExpenseInput = {
  amountCents: number;
  note?: string;
  payerId: string;
  title: string;
};

export function validateGroupInput(
  name: string,
  description = "",
): ValidationResult<ValidGroupInput> {
  const cleanName = name.trim();
  if (!cleanName) {
    return { ok: false, error: "Ponle nombre al grupo." };
  }

  return {
    ok: true,
    value: {
      name: cleanName,
      description: description.trim(),
    },
  };
}

export function validateMemberInput(name: string): ValidationResult<ValidMemberInput> {
  const cleanName = name.trim();
  if (!cleanName) {
    return { ok: false, error: "Escribe el nombre del integrante." };
  }

  return {
    ok: true,
    value: {
      name: cleanName,
    },
  };
}

export function validateExpenseInput({
  amount,
  memberIds,
  note,
  payerId,
  title,
}: {
  amount: string;
  memberIds: string[];
  note?: string;
  payerId: string;
  title: string;
}): ValidationResult<ValidExpenseInput> {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    return { ok: false, error: "Agrega un concepto para el gasto." };
  }

  const amountCents = parseMoneyInput(amount);
  if (!amountCents) {
    return { ok: false, error: "Ingresa un monto valido mayor a cero." };
  }

  if (memberIds.length === 0) {
    return { ok: false, error: "Agrega integrantes antes de registrar gastos." };
  }

  if (!payerId || !memberIds.includes(payerId)) {
    return { ok: false, error: "Elige quien pago el gasto." };
  }

  const cleanNote = note?.trim();
  return {
    ok: true,
    value: {
      amountCents,
      note: cleanNote || undefined,
      payerId,
      title: cleanTitle,
    },
  };
}
