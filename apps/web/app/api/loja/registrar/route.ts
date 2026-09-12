import { z } from "zod";
import { toSessionDto } from "@/server/authz/to-session-dto";
import { requireSession } from "@/server/authz/session";
import { assertRateLimit } from "@/server/identity/rate-limit";
import { registerCustomer } from "@/server/identity/register";
import { clientIp, publicTenantSlug, readJson } from "@/server/http/request";
import { fail, handleError, ok } from "@/server/http/respond";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nome: z.string().min(1),
  document_type: z.enum(["cpf", "cnpj"]),
  document_digits: z.string().min(11),
  whatsapp: z.string().optional(),
  tenant: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    assertRateLimit(`register:${clientIp(req)}`);
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return fail("validacao", "Dados de cadastro inválidos.");
    const result = await registerCustomer({
      ...parsed.data,
      tenantSlug: publicTenantSlug(req, parsed.data.tenant),
      startSession: true,
    });
    const session = await requireSession("loja");
    return ok(
      {
        ...toSessionDto(session),
        cnpj_registro_pendente: result.cnpj_registro_pendente,
        aviso: result.aviso,
      },
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
