import { availableQty, priceListForDocument, type OrderChannel } from "@saas-frota/shared";
import { db } from "../db";
import { ApiError } from "../http/respond";
import { requireEntitlementAtiva } from "../authz/gates";
import type { SessionContext } from "../authz/session";
import { newId } from "../ids";
import { enqueueStatusOutbox, markOutboxEnviado } from "./outbox";
import { toOrderDetail } from "./dto";

export type CreateOrderLineInput = { sku_id: string; qty: number };

export async function createOrder(input: {
  session: SessionContext;
  channel: OrderChannel;
  customerUserId: string;
  linhas: CreateOrderLineInput[];
  /** Discarded if present. */
  unit_price?: unknown;
  saas_role?: unknown;
}) {
  requireEntitlementAtiva(input.session);
  if (input.channel === "loja" && input.customerUserId !== input.session.userId) {
    throw new ApiError("nao_encontrado", "Não encontrado.");
  }
  if (!input.linhas?.length) throw new ApiError("validacao", "Informe ao menos uma linha.");
  for (const line of input.linhas) {
    if (!line.sku_id || !Number.isInteger(line.qty) || line.qty < 1) {
      throw new ApiError("validacao", "Cada linha precisa de sku_id e qty ≥ 1.");
    }
  }

  const tenant = await db.tenant.findUnique({ where: { id: input.session.tenantId } });
  if (!tenant) throw new ApiError("nao_encontrado", "Tenant não encontrado.");
  if (!tenant.defaultSellerUserId) {
    throw new ApiError("validacao", "Tenant sem vendedor padrão.");
  }

  const membership = await db.membership.findUnique({
    where: { tenantId_userId: { tenantId: tenant.id, userId: input.customerUserId } },
  });
  if (!membership?.isCustomer) throw new ApiError("nao_encontrado", "Não encontrado.");

  const profile = await db.customerProfile.findUnique({
    where: { tenantId_userId: { tenantId: tenant.id, userId: input.customerUserId } },
  });
  if (!profile) throw new ApiError("nao_encontrado", "Não encontrado.");

  const priceList = priceListForDocument(profile.documentType);
  const skuIds = [...new Set(input.linhas.map((l) => l.sku_id))];
  const skus = await db.sku.findMany({
    where: { tenantId: tenant.id, id: { in: skuIds } },
    include: { balance: true },
  });
  const byId = new Map(skus.map((s) => [s.id, s]));

  const needed = new Map<string, number>();
  for (const line of input.linhas) {
    const sku = byId.get(line.sku_id);
    if (!sku) throw new ApiError("nao_encontrado", "Não encontrado.");
    if (input.channel === "loja" && !sku.visivelLoja) {
      throw new ApiError("nao_encontrado", "Não encontrado.");
    }
    if (priceList === "atacado" && line.qty < sku.qtdMinAtacado) {
      throw new ApiError("moq_atacado", `Quantidade mínima de atacado: ${sku.qtdMinAtacado}.`, {
        sku_id: sku.id,
        qtd_min_atacado: sku.qtdMinAtacado,
      });
    }
    needed.set(sku.id, (needed.get(sku.id) ?? 0) + line.qty);
  }

  for (const [skuId, qty] of needed) {
    const sku = byId.get(skuId)!;
    const available = availableQty(sku.balance?.onHand ?? 0, sku.balance?.reserved ?? 0);
    if (qty > available) {
      throw new ApiError("estoque_insuficiente", "Estoque insuficiente para um ou mais itens.");
    }
  }

  const orderId = newId("ped");
  const customer = await db.user.findUniqueOrThrow({ where: { id: input.customerUserId } });
  const seller = await db.user.findUniqueOrThrow({ where: { id: tenant.defaultSellerUserId } });

  const outboxRows = await db.$transaction(async (tx) => {
    await tx.order.create({
      data: {
        id: orderId,
        tenantId: tenant.id,
        customerUserId: input.customerUserId,
        sellerUserId: tenant.defaultSellerUserId!,
        channel: input.channel,
        priceList,
        status: "novo",
        lines: {
          create: input.linhas.map((line) => {
            const sku = byId.get(line.sku_id)!;
            const unit =
              priceList === "atacado" ? sku.precoAtacadoCentavos : sku.precoVarejoCentavos;
            return {
              id: newId("ol"),
              tenantId: tenant.id,
              skuId: sku.id,
              codigoSnapshot: sku.codigo,
              nomeSnapshot: sku.nome,
              qty: line.qty,
              unitPriceCentavos: unit,
              priceList,
            };
          }),
        },
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        id: newId("oh"),
        tenantId: tenant.id,
        orderId,
        fromStatus: null,
        toStatus: "novo",
        actorUserId: input.session.userId,
      },
    });
    return enqueueStatusOutbox(tx, {
      tenantId: tenant.id,
      orderId,
      status: "novo",
      canaisAviso: tenant.canaisAviso,
      customer: { email: customer.email, whatsapp: customer.whatsapp },
      seller: { email: seller.email, whatsapp: seller.whatsapp },
    });
  });

  await markOutboxEnviado(outboxRows);
  return getOrderDetail(tenant.id, orderId);
}

export async function getOrderDetail(tenantId: string, orderId: string) {
  const order = await db.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      customer: true,
      lines: true,
      history: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) throw new ApiError("nao_encontrado", "Não encontrado.");
  return toOrderDetail(order);
}
