import type { OrderStatus, SaasRole } from "@saas-frota/shared";
import { LEGAL_TRANSITIONS } from "@saas-frota/shared";
import { ApiError } from "../http/respond";

const ROLE_ALLOWED: Record<SaasRole, ReadonlyArray<readonly [OrderStatus, OrderStatus]>> = {
  supervisor: [
    ["novo", "confirmado"],
    ["novo", "cancelado"],
    ["confirmado", "separando"],
    ["confirmado", "cancelado"],
    ["separando", "despachado"],
    ["separando", "cancelado"],
    ["despachado", "entregue"],
  ],
  vendedor: [
    ["novo", "confirmado"],
    ["novo", "cancelado"],
    ["confirmado", "cancelado"],
  ],
  estoquista: [
    ["confirmado", "separando"],
    ["separando", "despachado"],
  ],
  entregador: [["despachado", "entregue"]],
};

export const QUEUE_STATUSES: Record<SaasRole, OrderStatus[] | null> = {
  supervisor: null,
  vendedor: null,
  estoquista: ["confirmado", "separando", "despachado"],
  entregador: ["despachado", "entregue"],
};

export function assertLegalTransition(from: OrderStatus, to: OrderStatus, role: SaasRole) {
  if (!LEGAL_TRANSITIONS[from].includes(to)) {
    throw new ApiError("transicao_ilegal", "Transição de status não permitida a partir do estado atual.");
  }
  const allowed = ROLE_ALLOWED[role].some(([f, t]) => f === from && t === to);
  if (!allowed) {
    throw new ApiError("forbidden", "Papel sem permissão para esta transição.");
  }
}

export function visibleStatusesForRole(role: SaasRole): OrderStatus[] | null {
  return QUEUE_STATUSES[role];
}
