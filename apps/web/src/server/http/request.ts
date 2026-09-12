import { ApiError } from "./respond";

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError("validacao", "JSON inválido.");
  }
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "local";
}

export function publicTenantSlug(req: Request, bodyTenant?: string) {
  const url = new URL(req.url);
  return url.searchParams.get("tenant") || bodyTenant || undefined;
}
