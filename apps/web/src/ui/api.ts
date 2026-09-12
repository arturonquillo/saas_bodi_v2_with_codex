import type {
  ApiErr,
  CanalAviso,
  CatalogItemDto,
  DocumentType,
  MovementType,
  OrderStatus,
  SessionDto,
  SubscriptionStatus,
  ThemeTokens,
} from "@saas-frota/shared";

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function isApiError(err: unknown): err is ApiClientError {
  return err instanceof ApiClientError;
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: init?.body instanceof FormData ? init.headers : { accept: "application/json", ...init?.headers },
  });
  const body = await parseBody(res);
  if (!res.ok) {
    const err = (body as ApiErr | null)?.error;
    throw new ApiClientError(
      res.status,
      err?.code ?? (res.status === 501 ? "nao_implementado" : "validacao"),
      err?.message ?? "Não foi possível concluir.",
      err?.details,
    );
  }
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export function apiGet<T>(path: string) {
  return api<T>(path);
}

export function apiSend<T>(path: string, method: string, json?: unknown) {
  return api<T>(path, {
    method,
    headers: { "content-type": "application/json" },
    body: json === undefined ? undefined : JSON.stringify(json),
  });
}

export type PageDto<T> = { items: T[]; next_cursor: string | null };

export function asPage<T>(data: unknown): PageDto<T> {
  if (Array.isArray(data)) return { items: data as T[], next_cursor: null };
  if (data && typeof data === "object" && "items" in data && Array.isArray((data as PageDto<T>).items)) {
    const page = data as PageDto<T>;
    return { items: page.items, next_cursor: page.next_cursor ?? null };
  }
  return { items: [], next_cursor: null };
}

export type StoreConfigDto = {
  aceita_cpf: boolean;
  aceita_cnpj: boolean;
};

export type OrderLineDto = {
  id?: string;
  sku_id: string;
  sku?: string;
  codigo?: string;
  nome?: string;
  nome_snapshot?: string;
  codigo_snapshot?: string;
  qty: number;
  unit_price_centavos: number;
  price_list?: "varejo" | "atacado";
};

export type OrderHistoryDto = {
  from_status?: string | null;
  to_status: string;
  created_at?: string;
};

export type OrderDto = {
  id: string;
  status: OrderStatus;
  created_at?: string;
  updated_at?: string;
  price_list?: "varejo" | "atacado";
  channel?: "loja" | "saas";
  total_centavos?: number;
  customer_user_id?: string;
  customer_nome?: string;
  customer_name?: string;
  customer_document_masked?: string;
  customer_document_type?: DocumentType;
  customer?: {
    nome?: string;
    name?: string;
    document_type?: DocumentType;
    document_masked?: string;
    document_last4?: string;
  };
  linhas?: OrderLineDto[];
  lines?: OrderLineDto[];
  history?: OrderHistoryDto[];
  historico?: OrderHistoryDto[];
};

export type NormalizedOrder = {
  id: string;
  status: OrderStatus;
  created_at?: string;
  updated_at?: string;
  price_list?: "varejo" | "atacado";
  channel?: "loja" | "saas";
  total_centavos: number;
  customer_nome: string;
  customer_document_masked?: string;
  customer_document_type?: DocumentType;
  linhas: Array<{
    id?: string;
    sku_id: string;
    sku: string;
    nome: string;
    qty: number;
    unit_price_centavos: number;
    price_list?: "varejo" | "atacado";
  }>;
  history: OrderHistoryDto[];
};

export function normalizeOrder(raw: OrderDto): NormalizedOrder {
  const linhas = (raw.linhas ?? raw.lines ?? []).map((line) => ({
    id: line.id,
    sku_id: line.sku_id,
    sku: line.sku ?? line.codigo ?? line.codigo_snapshot ?? "",
    nome: line.nome ?? line.nome_snapshot ?? line.sku ?? "Item",
    qty: line.qty,
    unit_price_centavos: line.unit_price_centavos,
    price_list: line.price_list,
  }));
  const last4 = raw.customer?.document_last4;
  const docType = raw.customer_document_type ?? raw.customer?.document_type;
  const maskedFromLast4 =
    last4 && docType
      ? docType === "cnpj"
        ? `**.***.***/****-${last4.slice(-2)}`
        : `***.***.***-${last4.slice(-2)}`
      : undefined;
  return {
    id: raw.id,
    status: raw.status,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    price_list: raw.price_list,
    channel: raw.channel,
    total_centavos:
      raw.total_centavos ?? linhas.reduce((sum, line) => sum + line.qty * line.unit_price_centavos, 0),
    customer_nome: raw.customer_nome ?? raw.customer_name ?? raw.customer?.nome ?? raw.customer?.name ?? "Cliente",
    customer_document_masked: raw.customer_document_masked ?? raw.customer?.document_masked ?? maskedFromLast4,
    customer_document_type: docType,
    linhas,
    history: raw.history ?? raw.historico ?? [],
  };
}

export type CustomerPickDto = {
  user_id?: string;
  id?: string;
  nome?: string;
  name?: string;
  document_type?: DocumentType;
  document_masked?: string;
  document_last4?: string;
};

export function customerId(c: CustomerPickDto) {
  return c.user_id ?? c.id ?? "";
}

export function customerLabel(c: CustomerPickDto) {
  return c.nome ?? c.name ?? "Cliente";
}

export type EstoqueItemDto = {
  id: string;
  sku?: string;
  codigo?: string;
  nome: string;
  on_hand: number;
  reserved: number;
  available?: number;
  visivel_loja: boolean;
  preco_varejo_centavos?: number;
  preco_atacado_centavos?: number;
  qtd_min_atacado?: number;
};

export function skuCode(item: Pick<EstoqueItemDto, "sku" | "codigo">) {
  return item.sku ?? item.codigo ?? "";
}

export type MovementDto = {
  id: string;
  type: MovementType | string;
  delta_on_hand?: number;
  delta_reserved?: number;
  reason?: string | null;
  created_at?: string;
};

export type SaasConfigDto = {
  aceita_cpf: boolean;
  aceita_cnpj: boolean;
  canais_aviso: CanalAviso;
  default_seller_user_id?: string | null;
  default_seller_email?: string | null;
  default_seller_nome?: string | null;
};

export type OutboxDto = {
  id: string;
  created_at?: string;
  channel: "email" | "whatsapp" | string;
  recipient?: string;
  recipient_role?: "customer" | "seller" | string;
  template_key?: string;
  order_id?: string;
  status: "pendente" | "enviado" | "falha" | string;
};

export type ImportRowDto = {
  row_index?: number;
  action: "create" | "update" | "error" | "criar" | "atualizar" | "erro" | string;
  sku?: string;
  nome?: string;
  quantidade?: number;
  error_message?: string | null;
  error?: string | null;
  message?: string | null;
};

export type ImportPreviewDto = {
  preview_id?: string;
  id?: string;
  rows: ImportRowDto[];
};

export function previewId(data: ImportPreviewDto) {
  return data.preview_id ?? data.id ?? "";
}

export function normalizeImportAction(action: string): "create" | "update" | "error" {
  if (action === "criar" || action === "create") return "create";
  if (action === "atualizar" || action === "update") return "update";
  return "error";
}

export type AssinaturaDto = {
  plan_display_name: string;
  subscription_status: SubscriptionStatus;
};

export type { CatalogItemDto, SessionDto, ThemeTokens, CanalAviso, OrderStatus, SubscriptionStatus, DocumentType };
