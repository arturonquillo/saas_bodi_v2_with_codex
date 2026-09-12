import { env } from "@/server/env";
import { handleError, ok } from "@/server/http/respond";
import { getStoreProduct } from "@/server/modules/catalog/projection";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const tenant = new URL(req.url).searchParams.get("tenant") ?? env.defaultTenantSlug;
    return ok(await getStoreProduct(id, tenant));
  } catch (err) {
    return handleError(err);
  }
}
