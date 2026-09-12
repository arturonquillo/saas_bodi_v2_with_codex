import { requireSaasRole } from "@/server/authz/gates";
import { listAvisos } from "@/server/avisos/service";
import { parsePaging } from "@/server/http/pagination";
import { handleError, ok } from "@/server/http/respond";

export async function GET(req: Request) {
  try {
    const session = await requireSaasRole("supervisor", "vendedor");
    return ok(await listAvisos(session, parsePaging(new URL(req.url))));
  } catch (err) {
    return handleError(err);
  }
}
