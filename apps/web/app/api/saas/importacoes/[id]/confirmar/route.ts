import { requireEntitlementAtiva, requireSaasRole } from "@/server/authz/gates";
import { handleError, ok } from "@/server/http/respond";
import { confirmImport } from "@/server/import/service";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSaasRole("supervisor");
    requireEntitlementAtiva(session);
    const { id } = await ctx.params;
    return ok(await confirmImport(session, id));
  } catch (err) {
    return handleError(err);
  }
}
