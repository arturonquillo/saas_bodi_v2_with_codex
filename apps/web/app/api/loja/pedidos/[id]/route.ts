import { requireCustomer } from "@/server/authz/gates";
import { handleError, ok } from "@/server/http/respond";
import { getStoreOrder } from "@/server/orders/queries";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireCustomer();
    const { id } = await ctx.params;
    return ok(await getStoreOrder(session, id));
  } catch (err) {
    return handleError(err);
  }
}
