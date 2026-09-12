import { requireSaasRole } from "@/server/authz/gates";
import { handleError, ok } from "@/server/http/respond";
import { getEstoque } from "@/server/inventory/service";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSaasRole("supervisor", "vendedor", "estoquista");
    const { id } = await ctx.params;
    return ok(await getEstoque(session, id));
  } catch (err) {
    return handleError(err);
  }
}
