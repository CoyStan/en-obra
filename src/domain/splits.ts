import type { SplitInput, SplitMethod, SplitShare } from "./types";

export type ResolvedSplitShare = SplitShare & {
  method: SplitMethod;
  units?: number;
};

export type SplitResult =
  | { ok: true; shares: ResolvedSplitShare[] }
  | { ok: false; error: string };

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: number) {
  return Number.isInteger(value) && value >= 0;
}

export function splitEqual(amountCents: number, participantIds: string[]): SplitShare[] {
  const result = resolveSplit(amountCents, { method: "equal", participantIds });
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.shares.map(({ amountCents, memberId }) => ({ amountCents, memberId }));
}

export function resolveSplit(amountCents: number, input: SplitInput): SplitResult {
  if (!isPositiveInteger(amountCents)) {
    return { ok: false, error: "El monto debe ser un entero positivo en centavos." };
  }

  if (input.method === "equal") {
    const participantIds = unique(input.participantIds);
    if (participantIds.length === 0) {
      return { ok: false, error: "Elige integrantes para dividir el gasto." };
    }

    const baseShare = Math.floor(amountCents / participantIds.length);
    const remainder = amountCents % participantIds.length;
    return {
      ok: true,
      shares: participantIds.map((memberId, index) => ({
        memberId,
        amountCents: baseShare + (index < remainder ? 1 : 0),
        method: "equal",
      })),
    };
  }

  if (input.method === "exact") {
    const memberIds = unique(input.shares.map((share) => share.memberId));
    if (memberIds.length !== input.shares.length || memberIds.length === 0) {
      return { ok: false, error: "Cada integrante debe aparecer una sola vez en el split." };
    }
    if (input.shares.some((share) => !isNonNegativeInteger(share.amountCents))) {
      return { ok: false, error: "Cada monto exacto debe estar en centavos enteros." };
    }
    if (input.shares.every((share) => share.amountCents === 0)) {
      return { ok: false, error: "Al menos un integrante debe tener monto mayor a cero." };
    }
    const total = input.shares.reduce((sum, share) => sum + share.amountCents, 0);
    if (total !== amountCents) {
      return { ok: false, error: "Los montos exactos deben sumar el total del gasto." };
    }
    return {
      ok: true,
      shares: input.shares.map((share) => ({ ...share, method: "exact" })),
    };
  }

  const memberIds = unique(input.shares.map((share) => share.memberId));
  if (memberIds.length !== input.shares.length || memberIds.length === 0) {
    return { ok: false, error: "Cada integrante debe aparecer una sola vez en el split." };
  }
  if (input.shares.some((share) => !isPositiveInteger(share.units))) {
    return { ok: false, error: "Las partes deben ser enteros positivos." };
  }

  const totalUnits = input.shares.reduce((sum, share) => sum + share.units, 0);
  const rawShares = input.shares.map((share) => {
    const numerator = amountCents * share.units;
    const base = Math.floor(numerator / totalUnits);
    return {
      memberId: share.memberId,
      amountCents: base,
      method: "shares" as const,
      remainder: numerator % totalUnits,
      units: share.units,
    };
  });
  const assigned = rawShares.reduce((sum, share) => sum + share.amountCents, 0);
  let remaining = amountCents - assigned;
  const orderedRemainders = [...rawShares].sort((left, right) =>
    right.remainder - left.remainder || left.memberId.localeCompare(right.memberId),
  );
  for (const share of orderedRemainders) {
    if (remaining <= 0) {
      break;
    }
    share.amountCents += 1;
    remaining -= 1;
  }

  const roundedByMember = new Map(orderedRemainders.map((share) => [share.memberId, share.amountCents]));
  return {
    ok: true,
    shares: input.shares.map((share) => ({
      memberId: share.memberId,
      amountCents: roundedByMember.get(share.memberId) ?? 0,
      method: "shares",
      units: share.units,
    })),
  };
}
