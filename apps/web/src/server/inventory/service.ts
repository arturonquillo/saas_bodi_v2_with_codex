import { availableQty } from "@saas-frota/shared";
import { db } from "../db";
import { ApiError } from "../http/respond";
import { requireEntitlementAtiva } from "../authz/gates";
import type { SessionContext } from "../authz/session";
import { decodeCursor, encodeCursor } from "../http/pagination";
import { newId } from "../ids";

function toSkuDto(sku: {
  id: string;
  codigo: string;
  nome: string;
  precoVarejoCentavos: number;
  precoAtacadoCentavos: number;
  qtdMinAtacado: number;
  visivelLoja: boolean;
  balance: { onHand: number; reserved: number } | null;
}) {
  const onHand = sku.balance?.onHand ?? 0;
  const reserved = sku.balance?.reserved ?? 0;
  return {
    id: sku.id,
    sku: sku.codigo,
    nome: sku.nome,
    on_hand: onHand,
    reserved,
    available: availableQty(onHand, reserved),
    visivel_loja: sku.visivelLoja,
    preco_varejo_centavos: sku.precoVarejoCentavos,
    preco_atacado_centavos: sku.precoAtacadoCentavos,
    qtd_min_atacado: sku.qtdMinAtacado,
  };
}

export async function listEstoque(session: SessionContext, paging: { limit: number; cursor: string | null }) {
  const decoded = decodeCursor(paging.cursor);
  const cursorNome = decoded?.[0];
  const cursorId = decoded?.[1];
  const items = await db.sku.findMany({
    where: {
      tenantId: session.tenantId,
      ...(cursorNome && cursorId
        ? {
            OR: [{ nome: { gt: cursorNome } }, { nome: cursorNome, id: { gt: cursorId } }],
          }
        : {}),
    },
    include: { balance: true },
    orderBy: [{ nome: "asc" }, { id: "asc" }],
    take: paging.limit + 1,
  });
  const next = items.length > paging.limit ? items.pop()! : null;
  return {
    items: items.map(toSkuDto),
    next_cursor: next ? encodeCursor([next.nome, next.id]) : null,
  };
}

export async function getEstoque(session: SessionContext, skuId: string) {
  const sku = await db.sku.findFirst({
    where: { id: skuId, tenantId: session.tenantId },
    include: { balance: true },
  });
  if (!sku) throw new ApiError("nao_encontrado", "Não encontrado.");
  return toSkuDto(sku);
}

export async function listMovimentos(
  session: SessionContext,
  skuId: string,
  paging: { limit: number; cursor: string | null },
) {
  const sku = await db.sku.findFirst({ where: { id: skuId, tenantId: session.tenantId } });
  if (!sku) throw new ApiError("nao_encontrado", "Não encontrado.");
  const decoded = decodeCursor(paging.cursor);
  const cursorDate = decoded?.[0] ? new Date(decoded[0]) : null;
  const cursorId = decoded?.[1];
  const items = await db.inventoryMovement.findMany({
    where: {
      tenantId: session.tenantId,
      skuId,
      ...(cursorDate && cursorId
        ? {
            OR: [
              { createdAt: { lt: cursorDate } },
              { createdAt: cursorDate, id: { lt: cursorId } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: paging.limit + 1,
  });
  const next = items.length > paging.limit ? items.pop()! : null;
  return {
    items: items.map((m) => ({
      id: m.id,
      type: m.type,
      delta_on_hand: m.deltaOnHand,
      delta_reserved: m.deltaReserved,
      reason: m.reason,
      order_id: m.orderId,
      import_batch_id: m.importBatchId,
      created_at: m.createdAt.toISOString(),
    })),
    next_cursor: next ? encodeCursor([next.createdAt.toISOString(), next.id]) : null,
  };
}

export async function adjustOnHand(session: SessionContext, skuId: string, onHand: number, reason: string) {
  requireEntitlementAtiva(session);
  if (!Number.isInteger(onHand) || onHand < 0) {
    throw new ApiError("validacao", "on_hand deve ser um inteiro ≥ 0.");
  }
  if (!reason?.trim()) throw new ApiError("validacao", "Informe o motivo do ajuste.");

  await db.$transaction(async (tx) => {
    const sku = await tx.sku.findFirst({
      where: { id: skuId, tenantId: session.tenantId },
      include: { balance: true },
    });
    if (!sku?.balance) throw new ApiError("nao_encontrado", "Não encontrado.");
    if (onHand < sku.balance.reserved) {
      throw new ApiError("validacao", "on_hand não pode ser menor que o reservado.");
    }
    const delta = onHand - sku.balance.onHand;
    await tx.inventoryBalance.update({
      where: { skuId },
      data: { onHand },
    });
    await tx.inventoryMovement.create({
      data: {
        id: newId("mov"),
        tenantId: session.tenantId,
        skuId,
        type: "adjust",
        deltaOnHand: delta,
        deltaReserved: 0,
        reason: reason.trim(),
        actorUserId: session.userId,
      },
    });
  });
  return getEstoque(session, skuId);
}

export async function toggleVisibilidade(session: SessionContext, skuId: string, visivelLoja: boolean) {
  requireEntitlementAtiva(session);
  const sku = await db.sku.findFirst({
    where: { id: skuId, tenantId: session.tenantId },
    include: { balance: true },
  });
  if (!sku) throw new ApiError("nao_encontrado", "Não encontrado.");
  const updated = await db.sku.update({
    where: { id: skuId },
    data: { visivelLoja },
    include: { balance: true },
  });
  return toSkuDto(updated);
}
