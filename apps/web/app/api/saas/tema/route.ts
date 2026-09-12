import { z } from "zod";
import { requireEntitlementAtiva, requireSaasRole } from "@/server/authz/gates";
import { readJson } from "@/server/http/request";
import { fail, handleError, ok } from "@/server/http/respond";
import { getTenantTheme } from "@/server/modules/catalog/projection";
import { updateTheme } from "@/server/theme/service";

const schema = z.object({
  marca: z.string().min(1),
  primary: z.string().min(1),
  accent: z.string().min(1),
  background: z.string().min(1),
  logo_url: z.string().nullable(),
});

export async function GET() {
  try {
    const session = await requireSaasRole("supervisor");
    return ok(await getTenantTheme(session.tenantSlug));
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSaasRole("supervisor");
    requireEntitlementAtiva(session);
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return fail("validacao", "Tema inválido.");
    return ok(await updateTheme(session, parsed.data));
  } catch (err) {
    return handleError(err);
  }
}
