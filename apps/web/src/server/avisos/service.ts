import { db } from "../db";
import type { SessionContext } from "../authz/session";
import { decodeCursor, encodeCursor } from "../http/pagination";

export async function listAvisos(session: SessionContext, paging: { limit: number; cursor: string | null }) {
  const decoded = decodeCursor(paging.cursor);
  const cursorDate = decoded?.[0] ? new Date(decoded[0]) : null;
  const cursorId = decoded?.[1];
  const items = await db.notificationOutbox.findMany({
    where: {
      tenantId: session.tenantId,
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
    items: items.map((row) => ({
      id: row.id,
      order_id: row.orderId,
      channel: row.channel,
      recipient_role: row.recipientRole,
      recipient: row.recipient,
      template_key: row.templateKey,
      payload: safeJson(row.payloadJson),
      status: row.status,
      created_at: row.createdAt.toISOString(),
    })),
    next_cursor: next ? encodeCursor([next.createdAt.toISOString(), next.id]) : null,
  };
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}
