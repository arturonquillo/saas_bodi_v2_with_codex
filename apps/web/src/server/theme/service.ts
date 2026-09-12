import { db } from "../db";
import { ApiError } from "../http/respond";
import { requireEntitlementAtiva } from "../authz/gates";
import type { SessionContext } from "../authz/session";
import { getTenantTheme } from "../modules/catalog/projection";

const HEX = /^#([0-9A-Fa-f]{6})$/;

export type ThemeInput = {
  marca: string;
  primary: string;
  accent: string;
  background: string;
  logo_url: string | null;
};

export async function updateTheme(session: SessionContext, input: ThemeInput) {
  requireEntitlementAtiva(session);
  if (!input.marca?.trim()) throw new ApiError("validacao", "Informe a marca.");
  for (const [key, value] of [
    ["primary", input.primary],
    ["accent", input.accent],
    ["background", input.background],
  ] as const) {
    if (!HEX.test(value)) throw new ApiError("validacao", `Cor ${key} inválida.`);
  }
  await db.theme.update({
    where: { tenantId: session.tenantId },
    data: {
      marca: input.marca.trim(),
      primary: input.primary,
      accent: input.accent,
      background: input.background,
      logoUrl: input.logo_url,
    },
  });
  return getTenantTheme(session.tenantSlug);
}
