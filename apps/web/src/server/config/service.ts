import type { CanalAviso } from "@saas-frota/shared";
import { db } from "../db";
import { ApiError } from "../http/respond";
import { requireEntitlementAtiva } from "../authz/gates";
import type { SessionContext } from "../authz/session";

export async function getConfig(session: SessionContext) {
  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: session.tenantId } });
  return {
    aceita_cpf: tenant.aceitaCpf,
    aceita_cnpj: tenant.aceitaCnpj,
    canais_aviso: tenant.canaisAviso,
    default_seller_user_id: tenant.defaultSellerUserId,
  };
}

export async function updateConfig(
  session: SessionContext,
  input: {
    aceita_cpf: boolean;
    aceita_cnpj: boolean;
    canais_aviso: CanalAviso;
    default_seller_user_id?: string | null;
  },
) {
  requireEntitlementAtiva(session);
  if (!input.aceita_cpf && !input.aceita_cnpj) {
    throw new ApiError("conflito", "Mantenha ao menos um documento aceito (CPF ou CNPJ).");
  }
  if (input.default_seller_user_id) {
    const membership = await db.membership.findUnique({
      where: {
        tenantId_userId: { tenantId: session.tenantId, userId: input.default_seller_user_id },
      },
    });
    if (!membership || membership.saasRole !== "vendedor") {
      throw new ApiError("validacao", "Vendedor padrão inválido.");
    }
  }
  await db.tenant.update({
    where: { id: session.tenantId },
    data: {
      aceitaCpf: input.aceita_cpf,
      aceitaCnpj: input.aceita_cnpj,
      canaisAviso: input.canais_aviso,
      ...(input.default_seller_user_id !== undefined
        ? { defaultSellerUserId: input.default_seller_user_id }
        : {}),
    },
  });
  return getConfig(session);
}
