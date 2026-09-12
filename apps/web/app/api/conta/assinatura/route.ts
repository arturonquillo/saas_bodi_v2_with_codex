import { z } from "zod";
import { requireAccountOwner } from "@/server/authz/gates";
import { db } from "@/server/db";
import { fail, handleError, ok } from "@/server/http/respond";

const bodySchema = z.object({
  subscription_status: z.enum(["ativa", "inadimplente", "cancelada"]),
});

export async function GET() {
  try {
    const session = await requireAccountOwner();
    const tenant = await db.tenant.findUniqueOrThrow({ where: { id: session.tenantId } });
    return ok({
      plan_display_name: tenant.planDisplayName,
      subscription_status: tenant.subscriptionStatus,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAccountOwner();
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return fail("validacao", "Status inválido.");
    const tenant = await db.tenant.update({
      where: { id: session.tenantId },
      data: { subscriptionStatus: parsed.data.subscription_status },
    });
    return ok({
      plan_display_name: tenant.planDisplayName,
      subscription_status: tenant.subscriptionStatus,
    });
  } catch (err) {
    return handleError(err);
  }
}
