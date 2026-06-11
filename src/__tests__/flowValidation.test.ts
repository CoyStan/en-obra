import { describe, expect, it } from "vitest";
import {
  validateExpenseInput,
  validateGroupInput,
  validateMemberInput,
} from "../state/flowValidation";

describe("core flow validation", () => {
  it("normalizes group and member names", () => {
    expect(validateGroupInput(" Viaje a Puebla ", "  Casetas y comida ")).toEqual({
      ok: true,
      value: {
        description: "Casetas y comida",
        name: "Viaje a Puebla",
      },
    });
    expect(validateMemberInput("  Lupita  ")).toEqual({
      ok: true,
      value: { name: "Lupita" },
    });
  });

  it("keeps required group/member errors in Spanish", () => {
    expect(validateGroupInput(" ").ok).toBe(false);
    expect(validateMemberInput(" ").ok).toBe(false);
  });

  it("validates an MXN expense before closing the sheet", () => {
    expect(
      validateExpenseInput({
        amount: "$1,250.75",
        memberIds: ["ana", "diego"],
        note: "  cena y taxi  ",
        payerId: "ana",
        title: "  Noche de tacos  ",
      }),
    ).toEqual({
      ok: true,
      value: {
        amountCents: 125075,
        note: "cena y taxi",
        payerId: "ana",
        title: "Noche de tacos",
      },
    });
  });

  it("rejects incomplete expense inputs before mutating local data", () => {
    expect(validateExpenseInput({ amount: "50", memberIds: ["ana"], payerId: "ana", title: " " })).toEqual({
      ok: false,
      error: "Agrega un concepto para el gasto.",
    });
    expect(validateExpenseInput({ amount: "0", memberIds: ["ana"], payerId: "ana", title: "Cena" })).toEqual({
      ok: false,
      error: "Ingresa un monto valido mayor a cero.",
    });
    expect(validateExpenseInput({ amount: "50", memberIds: [], payerId: "", title: "Cena" })).toEqual({
      ok: false,
      error: "Agrega integrantes antes de registrar gastos.",
    });
    expect(validateExpenseInput({ amount: "50", memberIds: ["ana"], payerId: "luis", title: "Cena" })).toEqual({
      ok: false,
      error: "Elige quien pago el gasto.",
    });
  });
});
