import {
  calculateGroupBalances,
  calculateGroupSummary,
  explainSettlementPlan,
  getGroupMembers,
} from "./balances";
import { formatMoney } from "./money";
import type { AppData, SettlementSuggestion } from "./types";

function groupName(data: AppData, groupId: string) {
  return data.groups.find((group) => group.id === groupId)?.name ?? "el grupo";
}

function memberName(data: AppData, groupId: string, memberId: string) {
  return getGroupMembers(data, groupId).find((member) => member.id === memberId)?.name ?? "Integrante";
}

export function buildGroupSummaryShareText(data: AppData, groupId: string) {
  const summary = calculateGroupSummary(data, groupId);
  const plan = explainSettlementPlan(data, groupId);
  const routeLines = plan.routes.map(
    (route) => `- ${route.fromName} le paga a ${route.toName}: ${route.amountText}`,
  );

  return [
    `Resumen de ${groupName(data, groupId)} en Cuentas Claras`,
    `Gastado: ${formatMoney(summary.totalSpentCents)}`,
    `Pendiente por arreglar: ${formatMoney(summary.openBalanceCents)}`,
    plan.summary,
    ...routeLines,
    "Sin pagos reales: este texto solo resume el registro local.",
  ].join("\n");
}

export function buildMemberBalanceShareText(data: AppData, groupId: string, memberId: string) {
  const balance = calculateGroupBalances(data, groupId).find((item) => item.member.id === memberId);
  const name = memberName(data, groupId, memberId);
  const group = groupName(data, groupId);

  if (!balance || balance.netCents === 0) {
    return `${name} está en paz en ${group}. Sin pagos reales: solo registro local.`;
  }

  const direction = balance.netCents > 0 ? "debe recibir" : "debe pagar";
  return `${name} ${direction} ${formatMoney(Math.abs(balance.netCents))} en ${group}. Sin pagos reales: coordinen el arreglo fuera de la app.`;
}

export function buildSettlementReminderText(
  data: AppData,
  groupId: string,
  suggestion: SettlementSuggestion,
) {
  const fromName = memberName(data, groupId, suggestion.fromMemberId);
  const toName = memberName(data, groupId, suggestion.toMemberId);

  return [
    `Recordatorio de ${groupName(data, groupId)}`,
    `${fromName} le paga a ${toName}: ${formatMoney(suggestion.amountCents)}`,
    "Cuando lo arreglen fuera de la app, márquenlo como pagado en Cuentas Claras.",
    "Sin pagos reales: la app no mueve dinero.",
  ].join("\n");
}
