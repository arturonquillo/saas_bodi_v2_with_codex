import type { Prisma } from "@prisma/client";
import { stockEffectForTransition, type OrderStatus } from "@saas-frota/shared";
import { availableQty } from "@saas-frota/shared";
import { db } from "../db";
import { ApiError } from "../http/respond";
import { requireEntitlementAtiva } from "../authz/gates";
import type { SessionContext } from "../authz/session";
import { newId } from "../ids";
import { assertLegalTransition, visibleStatusesForRole } from "./machine";
import { enqueueStatusOutbox, markOutboxEnviado } from "./outbox";
import { getOrderDetail } from "./create";

async function applyStockEffect(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    orderId: string;
    actorUserId: string;
    effect: "reserve" | "release" | "consume";
    lines: { skuId: string; qty: number }[];
  },
) {
  const grouped = new Map<string, number>();
  for (const line of input.lines) {
    grouped.set(line.skuId, (grouped.get(line.skuId) ?? 0) + line.qty);
  }

  for (const [skuId, qty] of grouped) {
    const balance = await tx.inventoryBalance.findFirst({
      where: { skuId, tenantId: input.tenantId },
    });
    if (!balance) throw new ApiError("nao_encontrado", "Não encontrado.");

    let nextOnHand = balance.onHand;
    let nextReserved = balance.reserved;
    let deltaOnHand = 0;
    let deltaReserved = 0;

    if (input.effect === "reserve") {
      const available = availableQty(balance.onHand, balance.reserved);
      if (qty > available) {
        throw new ApiError("estoque_insuficiente", "Estoque insuficiente para reservar.");
      }
      nextReserved = balance.reserved + qty;
      deltaReserved = qty;
    } else if (input.effect === "release") {
      nextReserved = balance.reserved - qty;
      deltaReserved = -qty;
    } else {
      nextOnHand = balance.onHand - qty;
      nextReserved = balance.reserved - qty;
      deltaOnHand = -qty;
      deltaReserved = -qty;
    }

    if (nextOnHand < 0 || nextReserved < 0 || nextReserved > nextOnHand) {
      throw new ApiError("estoque_insuficiente", "Estoque insuficiente para esta transição.");
    }

    await tx.inventoryBalance.update({
      where: { skuId },
      data: { onHand: nextOnHand, reserved: nextReserved },
    });
    await tx.inventoryMovement.create({
      data: {
        id: newId("mov"),
        tenantId: input.tenantId,
        skuId,
        orderId: input.orderId,
        type: input.effect,
        deltaOnHand,
        deltaReserved,
        actorUserId: input.actorUserId,
      },
    });
  }
}

export async function transitionOrder(session: SessionContext, orderId: string, para: OrderStatus) {
  requireEntitlementAtiva(session);
  if (!session.saasRole) throw new ApiError("forbidden", "Papel sem permissão para esta ação.");

  const order = await db.order.findFirst({
    where: { id: orderId, tenantId: session.tenantId },
    include: {
      lines: true,
      tenant: true,
      customer: true,
      seller: true,
    },
  });
  if (!order) throw new ApiError("nao_encontrado", "Não encontrado.");

  const visible = visibleStatusesForRole(session.saasRole);
  if (visible && !visible.includes(order.status)) {
    throw new ApiError("nao_encontrado", "Não encontrado.");
  }

  assertLegalTransition(order.status, para, session.saasRole);
  const effect = stockEffectForTransition(order.status, para);
  if (!effect) throw new ApiError("transicao_ilegal", "Transição de status não permitida.");

  const outboxRows = await db.$transaction(async (tx) => {
    if (effect !== "none") {
      await applyStockEffect(tx, {
        tenantId: session.tenantId,
        orderId: order.id,
        actorUserId: session.userId,
        effect,
        lines: order.lines.map((l) => ({ skuId: l.skuId, qty: l.qty })),
      });
    }
    await tx.order.update({
      where: { id: order.id },
      data: { status: para },
    });
    await tx.orderStatusHistory.create({
      data: {
        id: newId("oh"),
        tenantId: session.tenantId,
        orderId: order.id,
        fromStatus: order.status,
        toStatus: para,
        actorUserId: session.userId,
      },
    });
    return enqueueStatusOutbox(tx, {
      tenantId: session.tenantId,
      orderId: order.id,
      status: para,
      canaisAviso: order.tenant.canaisAviso,
      customer: { email: order.customer.email, whatsapp: order.customer.whatsapp },
      seller: { email: order.seller.email, whatsapp: order.seller.whatsapp },
    });
  });

  await markOutboxEnviado(outboxRows);
  return getOrderDetail(session.tenantId, order.id);
}
