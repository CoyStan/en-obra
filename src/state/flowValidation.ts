import { parseMoneyInput } from "../domain/money";
import { resolveSplit, type ResolvedSplitShare } from "../domain/splits";
import type { SplitInput } from "../domain/types";

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
  participantIds: string[];
  splitShares: ResolvedSplitShare[];
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
  participantIds,
  payerId,
  split,
  title,
}: {
  amount: string;
  memberIds: string[];
  note?: string;
  participantIds?: string[];
  payerId: string;
  split?: SplitInput;
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

  const selectedParticipantIds = participantIds?.length ? Array.from(new Set(participantIds)) : memberIds;
  if (selectedParticipantIds.length === 0) {
    return { ok: false, error: "Elige integrantes para dividir el gasto." };
  }

  if (selectedParticipantIds.some((memberId) => !memberIds.includes(memberId))) {
    return { ok: false, error: "Elige solo integrantes de este grupo." };
  }

  const splitInput = split ?? { method: "equal" as const, participantIds: selectedParticipantIds };
  const splitResult = resolveSplit(amountCents, splitInput);
  if (!splitResult.ok) {
    return { ok: false, error: splitResult.error };
  }

  if (splitResult.shares.some((share) => !memberIds.includes(share.memberId))) {
    return { ok: false, error: "Elige solo integrantes de este grupo." };
  }

  const cleanNote = note?.trim();
  return {
    ok: true,
    value: {
      amountCents,
      note: cleanNote || undefined,
      payerId,
      participantIds: splitResult.shares.map((share) => share.memberId),
      splitShares: splitResult.shares,
      title: cleanTitle,
    },
  };
}
