export const ORDER_STATUSES = [
  "novo",
  "confirmado",
  "separando",
  "despachado",
  "entregue",
  "cancelado",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_CHANNELS = ["loja", "saas"] as const;
export type OrderChannel = (typeof ORDER_CHANNELS)[number];

export const PRICE_LISTS = ["varejo", "atacado"] as const;
export type PriceList = (typeof PRICE_LISTS)[number];

/** Legal edges only. Role checks live in authz — this is the state graph. */
export const LEGAL_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  novo: ["confirmado", "cancelado"],
  confirmado: ["separando", "cancelado"],
  separando: ["despachado", "cancelado"],
  despachado: ["entregue"],
  entregue: [],
  cancelado: [],
};

export type StockEffect = "none" | "reserve" | "release" | "consume";

export function stockEffectForTransition(from: OrderStatus, to: OrderStatus): StockEffect | null {
  if (!LEGAL_TRANSITIONS[from].includes(to)) return null;
  if (from === "novo" && to === "confirmado") return "reserve";
  if (from === "confirmado" && to === "cancelado") return "release";
  if (from === "separando" && to === "cancelado") return "release";
  if (from === "separando" && to === "despachado") return "consume";
  return "none";
}
