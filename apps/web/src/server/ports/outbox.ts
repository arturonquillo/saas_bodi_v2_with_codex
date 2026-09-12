import type { OutboxTransportPort } from "@saas-frota/shared";
import { db } from "../db";

/** MVP stub — marks enviado. No Meta, no SMTP. */
export const stubOutboxTransport: OutboxTransportPort = {
  async send(row) {
    await db.notificationOutbox.update({
      where: { id: row.id },
      data: { status: "enviado" },
    });
  },
};
