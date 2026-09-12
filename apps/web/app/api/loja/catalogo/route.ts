import { env } from "@/server/env";
import { parsePaging } from "@/server/http/pagination";
import { handleError, ok } from "@/server/http/respond";
import { getStoreCatalog } from "@/server/modules/catalog/projection";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tenant = url.searchParams.get("tenant") ?? env.defaultTenantSlug;
    return ok(await getStoreCatalog(tenant, parsePaging(url)));
  } catch (err) {
    return handleError(err);
  }
}
