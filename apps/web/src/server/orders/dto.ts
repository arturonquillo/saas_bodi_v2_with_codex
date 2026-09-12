import type { OrderStatus } from "@saas-frota/shared";
import { availableQty } from "@saas-frota/shared";

export type OrderLineDto = {
  sku_id: string;
  sku: string;
  nome: string;
  qty: number;
  unit_price_centavos: number;
  price_list: "varejo" | "atacado";
};

export type OrderHistoryDto = {
  from_status: string | null;
  to_status: OrderStatus;
  created_at: string;
};

export type OrderDetailDto = {
  id: string;
  status: OrderStatus;
  channel: "loja" | "saas";
  price_list: "varejo" | "atacado";
  customer_user_id: string;
  customer_nome: string;
  seller_user_id: string;
  created_at: string;
  updated_at: string;
  linhas: OrderLineDto[];
  historico: OrderHistoryDto[];
  total_centavos: number;
};

type OrderRow = {
  id: string;
  status: OrderStatus;
  channel: "loja" | "saas";
  priceList: "varejo" | "atacado";
  customerUserId: string;
  sellerUserId: string;
  createdAt: Date;
  updatedAt: Date;
  customer: { nome: string };
  lines: {
    skuId: string;
    codigoSnapshot: string;
    nomeSnapshot: string;
    qty: number;
    unitPriceCentavos: number;
    priceList: "varejo" | "atacado";
  }[];
  history: { fromStatus: string | null; toStatus: OrderStatus; createdAt: Date }[];
};

export function toOrderDetail(order: OrderRow): OrderDetailDto {
  const linhas = order.lines.map((line) => ({
    sku_id: line.skuId,
    sku: line.codigoSnapshot,
    nome: line.nomeSnapshot,
    qty: line.qty,
    unit_price_centavos: line.unitPriceCentavos,
    price_list: line.priceList,
  }));
  return {
    id: order.id,
    status: order.status,
    channel: order.channel,
    price_list: order.priceList,
    customer_user_id: order.customerUserId,
    customer_nome: order.customer.nome,
    seller_user_id: order.sellerUserId,
    created_at: order.createdAt.toISOString(),
    updated_at: order.updatedAt.toISOString(),
    linhas,
    historico: order.history.map((h) => ({
      from_status: h.fromStatus,
      to_status: h.toStatus,
      created_at: h.createdAt.toISOString(),
    })),
    total_centavos: linhas.reduce((sum, l) => sum + l.unit_price_centavos * l.qty, 0),
  };
}

export function toOrderListItem(order: OrderRow) {
  const detail = toOrderDetail(order);
  return {
    id: detail.id,
    status: detail.status,
    channel: detail.channel,
    price_list: detail.price_list,
    customer_user_id: detail.customer_user_id,
    customer_nome: detail.customer_nome,
    seller_user_id: detail.seller_user_id,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
    linhas_count: detail.linhas.length,
    total_centavos: detail.total_centavos,
  };
}

export function availableFromBalance(onHand: number, reserved: number) {
  return availableQty(onHand, reserved);
}
