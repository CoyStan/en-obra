import { describe, expect, it } from "vitest";
import { demoData } from "../data/demoData";
import {
  buildGroupSummaryShareText,
  buildMemberBalanceShareText,
  buildSettlementReminderText,
} from "../domain/shareMessages";
import { calculateGroupSummary } from "../domain/balances";

describe("share reminder messages", () => {
  it("builds a local group summary message in Spanish with MXN amounts", () => {
    const text = buildGroupSummaryShareText(demoData, "group-oaxaca");

    expect(text).toContain("Resumen de Viaje a Oaxaca");
    expect(text).toContain("Gastado:");
    expect(text).toContain("Pendiente por arreglar:");
    expect(text).toContain("MXN");
    expect(text).toContain("Sin pagos reales");
    expect(text).not.toMatch(/whatsapp|enviar|transferir|cobrar/i);
  });

  it("builds an individual balance reminder without payment processing language", () => {
    const text = buildMemberBalanceShareText(demoData, "group-oaxaca", "member-oaxaca-diego");

    expect(text).toContain("Diego debe pagar");
    expect(text).toContain("Viaje a Oaxaca");
    expect(text).toContain("MXN");
    expect(text).toContain("fuera de la app");
    expect(text).not.toMatch(/procesa|liga de pago|transferencia/i);
  });

  it("builds a settlement reminder from the current simplified route", () => {
    const suggestion = calculateGroupSummary(demoData, "group-oaxaca").settlements[0];
    const text = buildSettlementReminderText(demoData, "group-oaxaca", suggestion);

    expect(text).toContain("Recordatorio de Viaje a Oaxaca");
    expect(text).toContain("le paga a");
    expect(text).toContain("Sin pagos reales");
    expect(text).not.toMatch(/api|secreto|whatsapp/i);
  });
});
