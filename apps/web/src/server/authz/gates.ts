import type { SaasRole } from "@saas-frota/shared";
import { writesAllowed } from "@saas-frota/shared";
import { ApiError } from "../http/respond";
import { requireSession, type SessionContext } from "./session";

export async function requireCustomer() {
  const session = await requireSession("loja");
  if (!session.isCustomer) throw new ApiError("forbidden", "Acesso só para clientes.");
  return session;
}

export async function requireSaasRole(...roles: SaasRole[]) {
  const session = await requireSession("saas");
  if (!session.saasRole || (roles.length && !roles.includes(session.saasRole))) {
    throw new ApiError("forbidden", "Papel sem permissão para esta ação.");
  }
  return session;
}

export async function requireAccountOwner() {
  const session = await requireSession("conta");
  if (!session.accountOwner) throw new ApiError("forbidden", "Apenas o dono da conta.");
  return session;
}

export function requireEntitlementAtiva(session: SessionContext) {
  if (!writesAllowed(session.subscriptionStatus)) {
    throw new ApiError("entitlement_bloqueada", "Assinatura não está ativa. Escritas bloqueadas.");
  }
}

export function assertTenantScope(rowTenantId: string, sessionTenantId: string) {
  if (rowTenantId !== sessionTenantId) {
    throw new ApiError("nao_encontrado", "Não encontrado.");
  }
}
