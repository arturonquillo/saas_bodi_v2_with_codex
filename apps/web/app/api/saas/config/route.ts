import { CANAIS_AVISO } from "@saas-frota/shared";
import { z } from "zod";
import { requireEntitlementAtiva, requireSaasRole } from "@/server/authz/gates";
import { getConfig, updateConfig } from "@/server/config/service";
import { readJson } from "@/server/http/request";
import { fail, handleError, ok } from "@/server/http/respond";

const schema = z.object({
  aceita_cpf: z.boolean(),
  aceita_cnpj: z.boolean(),
  canais_aviso: z.enum(CANAIS_AVISO),
  default_seller_user_id: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const session = await requireSaasRole("supervisor");
    return ok(await getConfig(session));
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSaasRole("supervisor");
    requireEntitlementAtiva(session);
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return fail("validacao", "Configuração inválida.");
    return ok(await updateConfig(session, parsed.data));
  } catch (err) {
    return handleError(err);
  }
}
