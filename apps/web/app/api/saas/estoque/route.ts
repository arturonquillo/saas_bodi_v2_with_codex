import { requireSaasRole } from "@/server/authz/gates";
import { parsePaging } from "@/server/http/pagination";
import { handleError, ok } from "@/server/http/respond";
import { listEstoque } from "@/server/inventory/service";

export async function GET(req: Request) {
  try {
    const session = await requireSaasRole("supervisor", "vendedor", "estoquista");
    return ok(await listEstoque(session, parsePaging(new URL(req.url))));
  } catch (err) {
    return handleError(err);
  }
}
