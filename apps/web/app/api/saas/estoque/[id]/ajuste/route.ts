import { z } from "zod";
import { requireEntitlementAtiva, requireSaasRole } from "@/server/authz/gates";
import { readJson } from "@/server/http/request";
import { fail, handleError, ok } from "@/server/http/respond";
import { adjustOnHand } from "@/server/inventory/service";

const schema = z.object({
  on_hand: z.number().int().min(0),
  reason: z.string().min(1),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSaasRole("supervisor", "estoquista");
    requireEntitlementAtiva(session);
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return fail("validacao", "Informe on_hand e o motivo.");
    return ok(await adjustOnHand(session, id, parsed.data.on_hand, parsed.data.reason));
  } catch (err) {
    return handleError(err);
  }
}
