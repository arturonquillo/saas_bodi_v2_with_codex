import { requireSaasRole } from "@/server/authz/gates";
import { parsePaging } from "@/server/http/pagination";
import { handleError, ok } from "@/server/http/respond";
import { listCustomers } from "@/server/orders/queries";

export async function GET(req: Request) {
  try {
    const session = await requireSaasRole("supervisor", "vendedor");
    return ok(await listCustomers(session, parsePaging(new URL(req.url))));
  } catch (err) {
    return handleError(err);
  }
}
