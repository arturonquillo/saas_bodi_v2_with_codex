export const SUBSCRIPTION_STATUSES = ["ativa", "inadimplente", "cancelada"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const CANAIS_AVISO = ["email", "whatsapp", "ambos"] as const;
export type CanalAviso = (typeof CANAIS_AVISO)[number];

export function writesAllowed(status: SubscriptionStatus): boolean {
  return status === "ativa";
}
