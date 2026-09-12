export const SAAS_ROLES = ["supervisor", "vendedor", "estoquista", "entregador"] as const;
export type SaasRole = (typeof SAAS_ROLES)[number];

export const SURFACES = ["loja", "saas", "conta"] as const;
export type Surface = (typeof SURFACES)[number];

export function isSaasRole(value: string): value is SaasRole {
  return (SAAS_ROLES as readonly string[]).includes(value);
}
