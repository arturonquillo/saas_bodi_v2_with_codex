import type { CanalAviso, OrderStatus, OutboxChannel } from "@saas-frota/shared";
import type { Prisma } from "@prisma/client";
import { newId } from "../ids";
import { stubOutboxTransport } from "../ports/outbox";

function channelsFor(canais: CanalAviso): OutboxChannel[] {
  if (canais === "ambos") return ["email", "whatsapp"];
  return [canais];
}

export async function enqueueStatusOutbox(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    orderId: string;
    status: OrderStatus;
    canaisAviso: CanalAviso;
    customer: { email: string; whatsapp: string | null };
    seller: { email: string; whatsapp: string | null };
  },
) {
  const channels = channelsFor(input.canaisAviso);
  const payload = JSON.stringify({ order_id: input.orderId, status: input.status });
  const rows: { id: string; channel: OutboxChannel; recipient: string; templateKey: string; payload: unknown }[] =
    [];

  for (const channel of channels) {
    const recipients = [
      {
        role: "customer" as const,
        recipient: channel === "email" ? input.customer.email : input.customer.whatsapp || "",
      },
      {
        role: "seller" as const,
        recipient: channel === "email" ? input.seller.email : input.seller.whatsapp || "",
      },
    ];
    for (const rec of recipients) {
      const id = newId("out");
      await tx.notificationOutbox.create({
        data: {
          id,
          tenantId: input.tenantId,
          orderId: input.orderId,
          channel,
          recipientRole: rec.role,
          recipient: rec.recipient,
          templateKey: "pedido.status_alterado",
          payloadJson: payload,
          status: "pendente",
        },
      });
      rows.push({
        id,
        channel,
        recipient: rec.recipient,
        templateKey: "pedido.status_alterado",
        payload: { order_id: input.orderId, status: input.status },
      });
    }
  }
  return rows;
}

export async function markOutboxEnviado(
  rows: { id: string; channel: OutboxChannel; recipient: string; templateKey: string; payload: unknown }[],
) {
  for (const row of rows) {
    await stubOutboxTransport.send(row);
  }
}
