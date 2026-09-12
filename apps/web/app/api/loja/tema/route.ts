import { env } from "@/server/env";
import { handleError, ok } from "@/server/http/respond";
import { getTenantTheme } from "@/server/modules/catalog/projection";

export async function GET(req: Request) {
  try {
    const tenant = new URL(req.url).searchParams.get("tenant") ?? env.defaultTenantSlug;
    return ok(await getTenantTheme(tenant));
  } catch (err) {
    return handleError(err);
  }
}
