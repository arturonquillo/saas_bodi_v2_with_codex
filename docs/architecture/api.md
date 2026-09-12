# API

Base: `/api`. JSON envelope. pt-BR `message`. Types: `@saas-frota/shared`.

```ts
type ApiOk<T> = { data: T };
type ApiErr = { error: { code: string; message: string; details?: unknown } };
```

Pagination on lists: `?cursor=&limit=` (default 20, max 100) → `{ data: { items, next_cursor } }`.

Tenant on public Store GETs: `?tenant=demo` or default env slug. Authenticated routes use session `tenantId` only.

## Error codes

| HTTP | `code` | When |
|---|---|---|
| 401 | `unauthenticated` | missing/expired session |
| 403 | `forbidden` | wrong surface or role |
| 403 | `entitlement_bloqueada` | write while not `ativa` |
| 404 | `nao_encontrado` | unknown or **other tenant** (same body) |
| 409 | `transicao_ilegal` | status not allowed from current state |
| 409 | `estoque_insuficiente` | reserve would exceed available |
| 409 | `conflito` | e.g. last remaining document flag |
| 422 | `validacao` | Zod / business field |
| 422 | `checksum_invalido` | CPF/CNPJ módulo 11 |
| 422 | `moq_atacado` | qty &lt; `qtd_min_atacado` |
| 413 | `arquivo_grande` | import upload |
| 415 | `tipo_arquivo` | not CSV/XLSX |
| 429 | `rate_limit` | public register / CNPJ lookup |
| 501 | `nao_implementado` | scaffold stub (remove as backend fills) |

Illegal transition by **role** while the state would be legal for someone else → **403** `forbidden`. Illegal **state** (e.g. `entregue` → `cancelado`) → **409** `transicao_ilegal`. Neither writes stock nor outbox.

## Store — public

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/loja/tema` | public | tenant tokens only |
| GET | `/api/loja/config` | public | `aceita_cpf`, `aceita_cnpj` |
| GET | `/api/loja/catalogo` | public | projection: `visivel_loja` + `available`; guest prices = varejo |
| GET | `/api/loja/produtos/:id` | public | 404 if hidden; `sem_estoque` if available 0 |
| POST | `/api/loja/registrar` | public | checksum; CNPJ port; tenant flags |
| POST | `/api/loja/login` | public | customer membership |
| POST | `/api/identidade/cnpj` | public, rate-limit | `{ cnpj }` → registry or degrade; do not echo full CNPJ in logs |

Catalog item:

```ts
{
  id: string
  sku: string
  nome: string
  preco_varejo_centavos: number
  preco_atacado_centavos: number
  qtd_min_atacado: number
  available: number          // max(0, on_hand - reserved)
  sem_estoque: boolean
}
```

Logged-in CNPJ customers still receive both prices; UI shows atacado. Server re-picks the list on checkout.

## Store — customer session

| Method | Path | Authz |
|---|---|---|
| POST | `/api/loja/logout` | customer |
| GET | `/api/loja/sessao` | customer |
| GET | `/api/loja/pedidos` | own orders |
| GET | `/api/loja/pedidos/:id` | own; 404 otherwise |
| POST | `/api/loja/pedidos` | customer + `ativa` |

`POST /api/loja/pedidos` body: `{ linhas: { sku_id, qty }[] }`. Server sets `novo`, price list from `document_type`, freezes line prices, assigns `default_seller_user_id`. Reject guest, MOQ, hidden SKU, `available < qty`, client `unit_price`.

## SaaS

| Method | Path | Authz |
|---|---|---|
| POST | `/api/saas/login` | worker |
| POST | `/api/saas/logout` | session |
| GET | `/api/saas/sessao` | worker |
| GET | `/api/saas/pedidos` | role-filtered list |
| POST | `/api/saas/pedidos` | supervisor, vendedor + `ativa` |
| GET | `/api/saas/pedidos/:id` | if visible to role |
| POST | `/api/saas/pedidos/:id/transicao` | matrix + `ativa` |
| GET | `/api/saas/clientes` | supervisor, vendedor (create-order picker) |
| GET | `/api/saas/estoque` | supervisor, vendedor (read), estoquista |
| GET | `/api/saas/estoque/:id` | same |
| GET | `/api/saas/estoque/:id/movimentos` | same |
| POST | `/api/saas/estoque/:id/ajuste` | supervisor, estoquista + `ativa` |
| PATCH | `/api/saas/estoque/:id/visibilidade` | supervisor + `ativa` |
| GET | `/api/saas/tema` | supervisor |
| PUT | `/api/saas/tema` | supervisor + `ativa` |
| GET | `/api/saas/config` | supervisor |
| PUT | `/api/saas/config` | supervisor + `ativa`; keep ≥1 document flag |
| GET | `/api/saas/avisos` | supervisor, vendedor |
| POST | `/api/saas/importacoes` | supervisor + `ativa` (multipart file) |
| GET | `/api/saas/importacoes/:id` | supervisor |
| POST | `/api/saas/importacoes/:id/confirmar` | supervisor + `ativa` |

`POST .../transicao` body: `{ para: OrderStatus }`. Side effects only after the matrix + stock checks succeed in one transaction: history + outbox + movements.

SaaS create order: `{ customer_user_id, linhas: { sku_id, qty }[] }`. Price list from that customer's document type.

Estoque list returns `on_hand`, `reserved`, `available` (computed), `visivel_loja`. No second qty field.

Import upload returns `{ preview_id, rows }`. Confirm returns `{ applied, skipped }`.

## Account

| Method | Path | Authz |
|---|---|---|
| POST | `/api/conta/login` | `account_owner` |
| POST | `/api/conta/logout` | session |
| GET | `/api/conta/sessao` | owner |
| GET | `/api/conta/assinatura` | owner |
| POST | `/api/conta/assinatura` | owner (not entitlement-gated) |

`POST /api/conta/assinatura` body: `{ subscription_status: "ativa" \| "inadimplente" \| "cancelada" }`.

No pedidos/estoque/tema routes under `/api/conta`.

## Session DTO

```ts
{
  user_id: string
  tenant_id: string
  tenant_slug: string
  surface: "loja" | "saas" | "conta"
  saas_role: SaasRole | null
  account_owner: boolean
  is_customer: boolean
  subscription_status: SubscriptionStatus
  document_type?: "cpf" | "cnpj"  // store only
}
```

## Health

`GET /api/health` → `{ data: { ok: true } }`.
