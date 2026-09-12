import { requireSaasRole } from "@/server/authz/gates";
import { parsePaging } from "@/server/http/pagination";
import { handleError, ok } from "@/server/http/respond";
import { listMovimentos } from "@/server/inventory/service";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSaasRole("supervisor", "vendedor", "estoquista");
    const { id } = await ctx.params;
    return ok(await listMovimentos(session, id, parsePaging(new URL(req.url))));
  } catch (err) {
    return handleError(err);
  }
}
