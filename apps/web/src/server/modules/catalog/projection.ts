import { availableQty, type CatalogItemDto, type Page } from "@saas-frota/shared";
import { db } from "../../db";
import { env } from "../../env";
import { decodeCursor, encodeCursor } from "../../http/pagination";
import { ApiError } from "../../http/respond";

/**
 * Store catalog is a projection of inventory_balances + visivel_loja.
 * available = max(0, on_hand - reserved). Never read a second qty table.
 */
export async function getStoreCatalog(
  tenantSlug = env.defaultTenantSlug,
  paging: { limit?: number; cursor?: string | null } = {},
): Promise<Page<CatalogItemDto>> {
  const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) throw new ApiError("nao_encontrado", "Tenant não encontrado.");

  const limit = paging.limit ?? 20;
  const decoded = decodeCursor(paging.cursor ?? null);
  const cursorNome = decoded?.[0];
  const cursorId = decoded?.[1];

  const skus = await db.sku.findMany({
    where: {
      tenantId: tenant.id,
      visivelLoja: true,
      ...(cursorNome && cursorId
        ? {
            OR: [{ nome: { gt: cursorNome } }, { nome: cursorNome, id: { gt: cursorId } }],
          }
        : {}),
    },
    include: { balance: true },
    orderBy: [{ nome: "asc" }, { id: "asc" }],
    take: limit + 1,
  });

  const next = skus.length > limit ? skus.pop()! : null;
  const items = skus.map((sku) => {
    const onHand = sku.balance?.onHand ?? 0;
    const reserved = sku.balance?.reserved ?? 0;
    const available = availableQty(onHand, reserved);
    return {
      id: sku.id,
      sku: sku.codigo,
      nome: sku.nome,
      preco_varejo_centavos: sku.precoVarejoCentavos,
      preco_atacado_centavos: sku.precoAtacadoCentavos,
      qtd_min_atacado: sku.qtdMinAtacado,
      available,
      sem_estoque: available === 0,
    };
  });

  return { items, next_cursor: next ? encodeCursor([next.nome, next.id]) : null };
}

export async function getStoreProduct(id: string, tenantSlug = env.defaultTenantSlug) {
  const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) throw new ApiError("nao_encontrado", "Tenant não encontrado.");
  const sku = await db.sku.findFirst({
    where: { id, tenantId: tenant.id, visivelLoja: true },
    include: { balance: true },
  });
  if (!sku) throw new ApiError("nao_encontrado", "Não encontrado.");
  const available = availableQty(sku.balance?.onHand ?? 0, sku.balance?.reserved ?? 0);
  return {
    id: sku.id,
    sku: sku.codigo,
    nome: sku.nome,
    preco_varejo_centavos: sku.precoVarejoCentavos,
    preco_atacado_centavos: sku.precoAtacadoCentavos,
    qtd_min_atacado: sku.qtdMinAtacado,
    available,
    sem_estoque: available === 0,
  };
}

export async function getTenantTheme(tenantSlug = env.defaultTenantSlug) {
  const tenant = await db.tenant.findUnique({
    where: { slug: tenantSlug },
    include: { theme: true },
  });
  if (!tenant?.theme) throw new ApiError("nao_encontrado", "Tema não encontrado.");
  return {
    marca: tenant.theme.marca,
    primary: tenant.theme.primary,
    accent: tenant.theme.accent,
    background: tenant.theme.background,
    logo_url: tenant.theme.logoUrl,
  };
}

export async function getStoreConfig(tenantSlug = env.defaultTenantSlug) {
  const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) throw new ApiError("nao_encontrado", "Tenant não encontrado.");
  return { aceita_cpf: tenant.aceitaCpf, aceita_cnpj: tenant.aceitaCnpj };
}
