import { requireSaasRole } from "@/server/authz/gates";
import { handleError, ok } from "@/server/http/respond";
import { getSaasOrder } from "@/server/orders/queries";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSaasRole();
    const { id } = await ctx.params;
    return ok(await getSaasOrder(session, id));
  } catch (err) {
    return handleError(err);
  }
}
