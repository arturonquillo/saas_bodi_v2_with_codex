import { z } from "zod";
import { requireEntitlementAtiva, requireSaasRole } from "@/server/authz/gates";
import { readJson } from "@/server/http/request";
import { fail, handleError, ok } from "@/server/http/respond";
import { toggleVisibilidade } from "@/server/inventory/service";

const schema = z.object({ visivel_loja: z.boolean() });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSaasRole("supervisor");
    requireEntitlementAtiva(session);
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return fail("validacao", "Informe visivel_loja.");
    return ok(await toggleVisibilidade(session, id, parsed.data.visivel_loja));
  } catch (err) {
    return handleError(err);
  }
}
