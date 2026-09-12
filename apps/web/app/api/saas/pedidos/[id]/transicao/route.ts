import { ORDER_STATUSES } from "@saas-frota/shared";
import { z } from "zod";
import { requireEntitlementAtiva, requireSaasRole } from "@/server/authz/gates";
import { readJson } from "@/server/http/request";
import { fail, handleError, ok } from "@/server/http/respond";
import { transitionOrder } from "@/server/orders/transition";

const schema = z.object({ para: z.enum(ORDER_STATUSES) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSaasRole();
    requireEntitlementAtiva(session);
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return fail("validacao", "Informe o status de destino.");
    return ok(await transitionOrder(session, id, parsed.data.para));
  } catch (err) {
    return handleError(err);
  }
}
