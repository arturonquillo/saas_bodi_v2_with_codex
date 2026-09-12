# Data model

SQLite today (`prisma/schema.prisma`). Every operational table has `tenant_id`. There is **one** inventory ledger. Store availability is computed, never stored as a second quantity.

Money is **integer centavos**. Tax IDs are digits-only; persist last-4 for masking; **never log the full value**.

`available` is always `max(0, on_hand - reserved)`. Do not add `available` as a persisted column.

## Entities

```
Tenant 1──1 Theme
       1──* Membership ──1 User
       1──* CustomerProfile ──1 User
       1──* Sku 1──1 InventoryBalance
                1──* InventoryMovement
       1──* Order ──* OrderLine
                  ──* OrderStatusHistory
                  ──* NotificationOutbox
       1──* InventoryImportBatch ──* InventoryImportRow
       1──* Session
```

### Tenant

| Column | Type | Notes |
|---|---|---|
| `id` | cuid | |
| `slug` | string unique | seed: `demo` |
| `nome` | string | |
| `aceita_cpf` | bool | at least one of cpf/cnpj true |
| `aceita_cnpj` | bool | |
| `canais_aviso` | `email` \| `whatsapp` \| `ambos` | |
| `default_seller_user_id` | fk User | Store orders attributed here |
| `subscription_status` | `ativa` \| `inadimplente` \| `cancelada` | Account writes |
| `plan_display_name` | string | seed: `Plano Demo` |
| `created_at` | datetime | |

Check: `aceita_cpf OR aceita_cnpj`.

### Theme (1:1 tenant)

Editable slots match `docs/design/tokens.md`. System colors are not stored.

| Column | Type | Seed `demo` |
|---|---|---|
| `tenant_id` | pk/fk | |
| `marca` | string | `Norte Atacado` |
| `primary` | hex | `#0F4F3E` |
| `accent` | hex | `#C2410C` |
| `background` | hex | `#F6EFE3` |
| `logo_url` | string? | null (wordmark) |

Account ignores this row.

### User

| Column | Type | Notes |
|---|---|---|
| `id` | cuid | |
| `email` | string unique | MVP: globally unique |
| `password_hash` | string | |
| `nome` | string | |
| `whatsapp` | string? | PII; outbox recipient |
| `created_at` | datetime | |

### Membership

One row per user per tenant. `account_owner` is orthogonal to `saas_role`.

| Column | Type | Notes |
|---|---|---|
| `id` | cuid | |
| `tenant_id` | fk | |
| `user_id` | fk | |
| `saas_role` | `supervisor` \| `vendedor` \| `estoquista` \| `entregador` \| null | null for store-only customers |
| `account_owner` | bool | Account surface only |
| `is_customer` | bool | Store customer |
| unique | `(tenant_id, user_id)` | |

A user may be `account_owner` + `supervisor` (seed `dono`). That does **not** merge chromes.

### CustomerProfile

| Column | Type | Notes |
|---|---|---|
| `tenant_id` | fk | |
| `user_id` | fk | |
| `document_type` | `cpf` \| `cnpj` | picks price list |
| `document_digits` | string | persist; never log |
| `document_last4` | string | UI mask |
| `cnpj_registro_pendente` | bool | registry degraded or not found |
| `razao_social` | string? | from registry when ok |
| unique | `(tenant_id, document_digits)` | |

### Sku

Shared catalog. Dual prices. Not a stock ledger.

| Column | Type | Notes |
|---|---|---|
| `tenant_id` | fk | |
| `codigo` | string | unique per tenant (`sku` in files/API) |
| `nome` | string | |
| `preco_varejo_centavos` | int | |
| `preco_atacado_centavos` | int | |
| `qtd_min_atacado` | int | default 1 |
| `visivel_loja` | bool | projection filter only |

### InventoryBalance — **the only ledger**

1:1 with Sku. Store does not have another quantity table.

| Column | Type | Notes |
|---|---|---|
| `sku_id` | pk/fk | |
| `tenant_id` | fk | denormalized for tenant-scoped queries |
| `on_hand` | int ≥ 0 | |
| `reserved` | int ≥ 0 | |
| invariant | `reserved ≤ on_hand` | after every movement |

`available` is computed in the projection and in SaaS reads.

### InventoryMovement

Append-only. Written on reserve, release, consume, manual adjust, confirmed AI apply.

| Column | Type | Notes |
|---|---|---|
| `tenant_id` | fk | |
| `sku_id` | fk | |
| `order_id` | fk? | |
| `import_batch_id` | fk? | |
| `type` | `reserve` \| `release` \| `consume` \| `adjust` \| `import_apply` | |
| `delta_on_hand` | int | consume/adjust/import |
| `delta_reserved` | int | reserve/release/consume |
| `reason` | string? | required on `adjust` |
| `actor_user_id` | fk? | |
| `created_at` | datetime | |

### Order

One pipeline for Store and SaaS.

| Column | Type | Notes |
|---|---|---|
| `tenant_id` | fk | |
| `customer_user_id` | fk | |
| `seller_user_id` | fk | Store → tenant default seller |
| `channel` | `loja` \| `saas` | |
| `price_list` | `varejo` \| `atacado` | from document type at create |
| `status` | see machine | |
| `created_at` / `updated_at` | datetime | |

Pedido is an unpaid request. No payment columns.

### OrderLine

| Column | Type | Notes |
|---|---|---|
| `tenant_id` | fk | |
| `order_id` | fk | |
| `sku_id` | fk | |
| `codigo_snapshot` | string | |
| `nome_snapshot` | string | |
| `qty` | int > 0 | |
| `unit_price_centavos` | int | **frozen** at create |
| `price_list` | `varejo` \| `atacado` | |

Client-submitted unit prices are discarded.

### OrderStatusHistory

Every transition appends one row. That write is also the trigger to enqueue outbox rows (customer + seller × enabled channels).

### NotificationOutbox

MVP transport stub. No Meta, no required SMTP.

| Column | Type | Notes |
|---|---|---|
| `tenant_id` | fk | |
| `order_id` | fk | |
| `channel` | `email` \| `whatsapp` | |
| `recipient_role` | `customer` \| `seller` | |
| `recipient` | string | email or WhatsApp — PII |
| `template_key` | string | e.g. `pedido.status_alterado` |
| `payload_json` | string | status, order id — **no full tax ID** |
| `status` | `pendente` \| `enviado` \| `falha` | |
| `created_at` | datetime | |

### InventoryImportBatch / Row

Parse → preview id → confirm. Closing preview without confirm writes nothing to the ledger.

| Batch | `preview` \| `applied` \| `discarded` |
|---|---|
| Row `action` | `create` \| `update` \| `error` |
| `quantidade` | **absolute** new `on_hand` (not a delta) |

File bytes may be stored on the batch for audit; **never execute** file content.

### Session

| Column | Notes |
|---|---|
| `token_hash` | lookup |
| `user_id`, `tenant_id` | |
| `surface` | `loja` \| `saas` \| `conta` |
| `expires_at` | |

## Status machine

Happy path: `novo` → `confirmado` → `separando` → `despachado` → `entregue`. Terminal alternate: `cancelado`.

| From → to | Supervisor | Vendedor | Estoquista | Entregador | Stock |
|---|---|---|---|---|---|
| create → `novo` | SaaS yes | SaaS yes | no | no | none |
| `novo` → `confirmado` | yes | yes | no | no | **reserve** |
| `novo` → `cancelado` | yes | yes | no | no | none |
| `confirmado` → `separando` | yes | no | yes | no | none |
| `confirmado` → `cancelado` | yes | yes | no | no | **release** |
| `separando` → `despachado` | yes | no | yes | no | **consume** (`on_hand -=`, `reserved -=`) |
| `separando` → `cancelado` | yes | no | no | no | **release** |
| `despachado` → `entregue` | yes | no | no | yes | none |
| cancel after `despachado` / from `entregue` | no | no | no | no | n/a |

Illegal transition = **403** (role) or **409** (state), **no** stock or outbox side effects.

Customers create Store orders to `novo` when entitlement is `ativa`. They never transition.

## Stock movement math

- **reserve** (on `confirmado`): for each line, `reserved += qty`. Fail the whole transition if any line `qty > available`.
- **release** (cancel before dispatch): `reserved -= qty`.
- **consume** (on `despachado`): `on_hand -= qty`, `reserved -= qty`.
- **adjust**: supervisor/estoquista; `on_hand` change + reason; reject if new `on_hand < reserved`.
- **import_apply**: set `on_hand` to absolute `quantidade`; reject row if new `on_hand < reserved` (report as error, skip row).

Store projection: SKU listed iff `visivel_loja`; shown qty = `available`. Visible + zero available → “sem estoque”, cannot add. Toggling `visivel_loja` does not touch `on_hand`.

## Indexes

| Table | Index |
|---|---|
| `tenants` | unique `slug` |
| `memberships` | unique `(tenant_id, user_id)`; `(tenant_id, saas_role)` |
| `customer_profiles` | unique `(tenant_id, document_digits)`; `(tenant_id, user_id)` |
| `skus` | unique `(tenant_id, codigo)`; `(tenant_id, visivel_loja)` |
| `inventory_balances` | `(tenant_id)` |
| `inventory_movements` | `(tenant_id, sku_id, created_at)` |
| `orders` | `(tenant_id, status)`; `(tenant_id, customer_user_id)`; `(tenant_id, created_at)` |
| `order_lines` | `(tenant_id, order_id)` |
| `order_status_histories` | `(tenant_id, order_id, created_at)` |
| `notification_outbox` | `(tenant_id, status)`; `(tenant_id, order_id)` |
| `inventory_import_batches` | `(tenant_id, created_at)` |
| `sessions` | unique `token_hash`; `(tenant_id, user_id)` |

List endpoints are paginated (`cursor` or `page` + `limit`, default 20, max 100). Catalog query: one SQL join Sku↔Balance, no N+1.

## What must not exist

- A `store_stocks` / `channel_qty` table.
- Payment, PIX, NF-e, courier-assignment, or multi-warehouse tables.
- Billing tables beyond `subscription_status` + `plan_display_name`.
