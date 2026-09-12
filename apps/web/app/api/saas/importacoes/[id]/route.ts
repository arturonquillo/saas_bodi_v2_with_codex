import { requireSaasRole } from "@/server/authz/gates";
import { handleError, ok } from "@/server/http/respond";
import { getPreview } from "@/server/import/service";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSaasRole("supervisor");
    const { id } = await ctx.params;
    return ok(await getPreview(session, id));
  } catch (err) {
    return handleError(err);
  }
}
