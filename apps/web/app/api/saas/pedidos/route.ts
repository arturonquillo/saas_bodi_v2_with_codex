import { z } from "zod";
import { requireEntitlementAtiva, requireSaasRole } from "@/server/authz/gates";
import { parsePaging } from "@/server/http/pagination";
import { readJson } from "@/server/http/request";
import { fail, handleError, ok } from "@/server/http/respond";
import { createOrder } from "@/server/orders/create";
import { listSaasOrders } from "@/server/orders/queries";

const createSchema = z.object({
  customer_user_id: z.string().min(1),
  linhas: z.array(z.object({ sku_id: z.string().min(1), qty: z.number().int().min(1) })).min(1),
});

export async function GET(req: Request) {
  try {
    const session = await requireSaasRole();
    return ok(await listSaasOrders(session, parsePaging(new URL(req.url))));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSaasRole("supervisor", "vendedor");
    requireEntitlementAtiva(session);
    const parsed = createSchema.safeParse(await readJson(req));
    if (!parsed.success) return fail("validacao", "Pedido inválido.");
    const order = await createOrder({
      session,
      channel: "saas",
      customerUserId: parsed.data.customer_user_id,
      linhas: parsed.data.linhas,
    });
    return ok(order, 201);
  } catch (err) {
    return handleError(err);
  }
}
