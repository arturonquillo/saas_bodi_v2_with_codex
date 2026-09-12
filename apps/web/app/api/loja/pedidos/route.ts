import { z } from "zod";
import { requireCustomer, requireEntitlementAtiva } from "@/server/authz/gates";
import { parsePaging } from "@/server/http/pagination";
import { readJson } from "@/server/http/request";
import { fail, handleError, ok } from "@/server/http/respond";
import { createOrder } from "@/server/orders/create";
import { listStoreOrders } from "@/server/orders/queries";

const createSchema = z.object({
  linhas: z.array(z.object({ sku_id: z.string().min(1), qty: z.number().int().min(1) })).min(1),
});

export async function GET(req: Request) {
  try {
    const session = await requireCustomer();
    return ok(await listStoreOrders(session, parsePaging(new URL(req.url))));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireCustomer();
    requireEntitlementAtiva(session);
    const parsed = createSchema.safeParse(await readJson(req));
    if (!parsed.success) return fail("validacao", "Linhas inválidas.");
    const order = await createOrder({
      session,
      channel: "loja",
      customerUserId: session.userId,
      linhas: parsed.data.linhas,
    });
    return ok(order, 201);
  } catch (err) {
    return handleError(err);
  }
}
