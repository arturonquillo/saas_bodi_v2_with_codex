import type { OrderStatus } from "@saas-frota/shared";
import { db } from "../db";
import { ApiError } from "../http/respond";
import type { SessionContext } from "../authz/session";
import { decodeCursor, encodeCursor } from "../http/pagination";
import { toOrderDetail, toOrderListItem } from "./dto";
import { visibleStatusesForRole } from "./machine";

const includeOrder = {
  customer: true,
  lines: true,
  history: { orderBy: { createdAt: "asc" as const } },
};

export async function listStoreOrders(session: SessionContext, paging: { limit: number; cursor: string | null }) {
  const decoded = decodeCursor(paging.cursor);
  const cursorDate = decoded?.[0] ? new Date(decoded[0]) : null;
  const cursorId = decoded?.[1];

  const items = await db.order.findMany({
    where: {
      tenantId: session.tenantId,
      customerUserId: session.userId,
      ...(cursorDate && cursorId
        ? {
            OR: [
              { createdAt: { lt: cursorDate } },
              { createdAt: cursorDate, id: { lt: cursorId } },
            ],
          }
        : {}),
    },
    include: includeOrder,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: paging.limit + 1,
  });
  const next = items.length > paging.limit ? items.pop()! : null;
  return {
    items: items.map(toOrderListItem),
    next_cursor: next ? encodeCursor([next.createdAt.toISOString(), next.id]) : null,
  };
}

export async function getStoreOrder(session: SessionContext, orderId: string) {
  const order = await db.order.findFirst({
    where: { id: orderId, tenantId: session.tenantId, customerUserId: session.userId },
    include: includeOrder,
  });
  if (!order) throw new ApiError("nao_encontrado", "Não encontrado.");
  return toOrderDetail(order);
}

export async function listSaasOrders(session: SessionContext, paging: { limit: number; cursor: string | null }) {
  if (!session.saasRole) throw new ApiError("forbidden", "Papel sem permissão para esta ação.");
  const statuses = visibleStatusesForRole(session.saasRole);
  const decoded = decodeCursor(paging.cursor);
  const cursorDate = decoded?.[0] ? new Date(decoded[0]) : null;
  const cursorId = decoded?.[1];

  const items = await db.order.findMany({
    where: {
      tenantId: session.tenantId,
      ...(statuses ? { status: { in: statuses } } : {}),
      ...(cursorDate && cursorId
        ? {
            OR: [
              { createdAt: { lt: cursorDate } },
              { createdAt: cursorDate, id: { lt: cursorId } },
            ],
          }
        : {}),
    },
    include: includeOrder,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: paging.limit + 1,
  });
  const next = items.length > paging.limit ? items.pop()! : null;
  return {
    items: items.map(toOrderListItem),
    next_cursor: next ? encodeCursor([next.createdAt.toISOString(), next.id]) : null,
  };
}

export async function getSaasOrder(session: SessionContext, orderId: string) {
  if (!session.saasRole) throw new ApiError("forbidden", "Papel sem permissão para esta ação.");
  const order = await db.order.findFirst({
    where: { id: orderId, tenantId: session.tenantId },
    include: includeOrder,
  });
  if (!order) throw new ApiError("nao_encontrado", "Não encontrado.");
  const statuses = visibleStatusesForRole(session.saasRole);
  if (statuses && !statuses.includes(order.status as OrderStatus)) {
    throw new ApiError("nao_encontrado", "Não encontrado.");
  }
  return toOrderDetail(order);
}

export async function listCustomers(session: SessionContext, paging: { limit: number; cursor: string | null }) {
  const decoded = decodeCursor(paging.cursor);
  const cursorId = decoded?.[0];
  const items = await db.customerProfile.findMany({
    where: {
      tenantId: session.tenantId,
      ...(cursorId ? { id: { gt: cursorId } } : {}),
    },
    include: { user: true },
    orderBy: { id: "asc" },
    take: paging.limit + 1,
  });
  const next = items.length > paging.limit ? items.pop()! : null;
  return {
    items: items.map((p) => ({
      user_id: p.userId,
      nome: p.user.nome,
      email: p.user.email,
      document_type: p.documentType,
      document_last4: p.documentLast4,
    })),
    next_cursor: next ? encodeCursor([next.id]) : null,
  };
}
