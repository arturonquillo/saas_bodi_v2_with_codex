# Product spec — saas_frota

Living spec. The **product** agent updates this when behavior changes. MVP brief: `docs/product/mvp.md`. Acceptance: `docs/product/mvp-acceptance.md`. Stack choices belong in `docs/architecture/` once the architect locks them.

## Problem

Companies need one system to sell wholesale and retail, let customers request orders on a store, and let internal workers run those orders with clear roles, stock, and notifications.

## Surfaces

| Surface | Audience | Purpose |
|---|---|---|
| **Store** | End customers | Browse, request/create orders, see available stock |
| **SaaS** | Company workers | Operate orders, inventory, people, configuration, theme |
| **Account** | Billing admins (`account_owner`) | Subscription status and plan flag — never day-to-day operations |

Each paying company is a **tenant**. Store, SaaS, and Account share tenant data; they do not share the same chrome or permission model. Operational SaaS must never link billing into its nav.

## Selling modes

A tenant sells **wholesale and retail** from **one catalog and one storage module**.

- Shared SKUs. Dual price lists: `preco_varejo`, `preco_atacado`.
- Optional per-SKU `qtd_min_atacado` (default 1).
- Logged-out Store shows varejo prices.
- **CPF customer → varejo.** **CNPJ customer → atacado** (MOQ enforced).
- SaaS-created orders use the customer's document type to pick the list; unit price is **frozen on the line** at create time.
- Inventory is never split by channel.

## Store

- Customers **register then** place orders. No guest checkout.
- Catalog availability is a **projection** of storage: SKU is listed only if `visivel_loja`; quantity shown is `max(0, on_hand - reserved)`. Visible + zero available = show “sem estoque”, cannot add.
- Supervisors set `visivel_loja` per SKU. That flag does not create a second ledger.
- Registration uses **CPF and/or CNPJ** per tenant `aceita_cpf` / `aceita_cnpj` (at least one true).
- CNPJ is checksum-validated **and** looked up against public Brazilian registry data. Company identity is not free-text only.
- Theme (brand, colors, logo) from the tenant theme module.

## SaaS (operations)

Workers sign in to create and edit orders and run the operation.

### Roles and permissions

One SaaS role per user per tenant. `account_owner` is a **separate** flag for the Account surface; it does not grant supervisor powers and supervisor does not grant Account.

| Role | Intent |
|---|---|
| **Supervisor** | Config, store visibility, theme, AI inventory apply, oversight, all legal status transitions |
| **Vendedor** | Create orders, confirm/cancel before warehouse dispatch, see tenant pipeline + notices |
| **Estoquista** | Storage quantities, movements, pick/pack (`confirmado` → `separando` → `despachado`) |
| **Entregador** | `despachado` → `entregue` on tenant dispatched orders (no assignment in MVP) |

Permissions are enforced in the API. UI only hides what the role cannot do.

### Permission × status matrix

Statuses: `novo` → `confirmado` → `separando` → `despachado` → `entregue`. Terminal alternate: `cancelado`.

| Transition | Supervisor | Vendedor | Estoquista | Entregador | Stock effect |
|---|---|---|---|---|---|
| create → `novo` (Store customer or SaaS seller/supervisor) | yes (SaaS) | yes (SaaS) | no | no | none |
| `novo` → `confirmado` | yes | yes | no | no | **reserve** qty |
| `novo` → `cancelado` | yes | yes | no | no | none |
| `confirmado` → `separando` | yes | no | yes | no | none (still reserved) |
| `confirmado` → `cancelado` | yes | yes | no | no | **release** reserve |
| `separando` → `despachado` | yes | no | yes | no | **consume**: on-hand −=, reserve −= |
| `separando` → `cancelado` | yes | no | no | no | **release** reserve |
| `despachado` → `entregue` | yes | no | no | yes | none |
| cancel after `despachado` or from `entregue` | no | no | no | no | n/a (returns = later) |

Sellers see **all** tenant orders (small-company MVP). Warehouse list: `confirmado`, `separando`, `despachado`. Courier list: `despachado`, `entregue`. Customers see **own** Store orders only.

| Other action | Supervisor | Vendedor | Estoquista | Entregador |
|---|---|---|---|---|
| View on-hand, reserved, available, movements | yes | read | yes | no |
| Manual qty adjust + reason | yes | no | yes | no |
| Toggle `visivel_loja` | yes | no | no | no |
| Theme, CPF/CNPJ flags, notification channels | yes | no | no | no |
| AI inventory chat (preview + apply) | yes | no | no | no |
| Read notification outbox | yes | yes | no | no |

### Orders

- Created from the Store **or** by seller/supervisor in SaaS.
- Lines snapshot SKU name, qty, and unit price from the channel list.
- Each status change appends history and notifies **customer and seller** (see Notifications).
- Store orders are attributed to a tenant default seller (seed: `vendedor@demo.local`) so the seller recipient exists.
- Pedido is a **purchase request**. MVP does not capture payment.

### Storage

- Canonical inventory lives here: `on_hand`, `reserved`, `available = on_hand - reserved`.
- Store site stock is a **projection** (visibility + available), not a second quantity column that can drift.
- Movements are written on reserve, release, consume, manual adjust, and confirmed AI apply.
- Warehouse workers operate quantities; supervisors decide store visibility.

### Inventory AI chat

Not an agent platform. One chat thread that accepts a file.

1. Supervisor uploads CSV or XLSX (and may type a short instruction).
2. Parser maps headers (including synonyms: `código`/`sku`, `produto`/`nome`, `qtd`/`quantidade`, `preço`/`preco_varejo`, etc.) to canonical columns.
3. Preview table: create / update / error per row. Nothing applied yet.
4. Supervisor clicks **Confirmar aplicação**. That is the only apply path.
5. Apply is transactional for valid rows; invalid rows are reported and skipped. No silent overwrite.

Canonical columns:

| Column | Rule |
|---|---|
| `sku` | Required. Unique per tenant. |
| `nome` | Required to **create**; optional on update. |
| `quantidade` | Required. **Absolute** new `on_hand`. |
| `preco_varejo` | Optional. |
| `preco_atacado` | Optional. |
| `qtd_min_atacado` | Optional, default 1. |
| `visivel_loja` | Optional boolean. |

Parser may be deterministic (synonyms) plus an optional single LLM remap when a key is configured. Product does not require a live model. Confirm is a **button**, not a chat guess.

### Configuration

- Accepted documents: CPF, CNPJ, or both (`aceita_cpf`, `aceita_cnpj`; at least one).
- Store stock visibility: per-SKU `visivel_loja`.
- Notification channels: `email`, `whatsapp`, `ambos`.
- Default seller for Store orders.

### Theme

- Editable: brand name, primary color, accent, background, logo (URL or upload).
- Store and SaaS consume the same tokens (CSS variables or equivalent).
- Account uses **product** chrome, not the tenant theme, so billing stays visually separate.

## Account

- Separate site/area. Only users with `account_owner`.
- Supervisor, seller, warehouse, and courier do **not** access Account by role.
- The same person may hold `account_owner` + a SaaS role (seed `dono`); they still use two surfaces.
- MVP billing is a **manual plan flag**, not a payment provider: `subscription_status` = `ativa` | `inadimplente` | `cancelada`.
- Plan display name is free text on the tenant (seed: “Plano Demo”).
- Entitlements are enforced **server-side**:
  - `ativa`: Store checkout and SaaS writes allowed.
  - `inadimplente` / `cancelada`: Store may browse; checkout blocked. SaaS reads allowed; mutations blocked. Account owner can still change the flag.

## Notifications

- On **every** status change: notify the **customer** and the **seller** on the order.
- Channels follow tenant config. Both email and WhatsApp are first-class in the data model.
- **MVP transport is an outbox stub.** Each send = a `notification_outbox` row (`channel`, recipients, template key, payload, `pendente`/`enviado`/`falha`). Adapters mark `enviado` without Meta Cloud API or required SMTP.
- Warehouse and courier are not notified in MVP (they watch queues).
- Outbox is visible in SaaS (supervisor: all; seller: yes).

## Identity and compliance

- Market: Brazil. Default language: **pt-BR**.
- CPF/CNPJ are LGPD-sensitive: minimize, mask in UI (e.g. `***.***.***-00`), **do not log in full**.
- Checksum (módulo 11) always runs for both documents.
- CNPJ lookup uses public registry data (recommended port: BrasilAPI CNPJ). If the registry is down: checksum still applies, UX shows an explicit warning, registration may proceed with `cnpj_registro_pendente`.
- Auth is tenant-scoped. Never trust the client for role, price, or stock.

## Seed / demo tenant

MVP has **no self-serve onboarding wizard**. QA and demos use tenant slug `demo`.

| Email | Surfaces / role |
|---|---|
| `dono@demo.local` | Account owner **and** supervisor |
| `supervisora@demo.local` | Supervisor only (proves Account is denied) |
| `vendedor@demo.local` | Seller (also default Store-order assignee) |
| `estoque@demo.local` | Warehouse |
| `entregador@demo.local` | Courier |
| `cliente.cpf@demo.local` | Store customer, CPF, varejo |
| `cliente.cnpj@demo.local` | Store customer, CNPJ, atacado |

Shared password (dev/seed only): `Demo@1234`.

Seed also includes: dual-priced SKUs, at least one `visivel_loja=false`, one zero-available visible SKU, MOQ > 1, orders in every status, theme tokens, notification channels `ambos`, `aceita_cpf` + `aceita_cnpj`, `subscription_status=ativa`.

## MVP vs later

### MVP (ships)

Thin vertical slice of **every** required module: Store, SaaS roles, storage + projection, dual prices, CPF/CNPJ, status machine + outbox notices, theme, AI file chat with confirm, Account manual entitlement, seed tenant.

### Stubbed in MVP (documented, not fake-hidden)

| Capability | Stub |
|---|---|
| WhatsApp | Outbox row only; no Meta API |
| Email | Outbox row only; SMTP optional later |
| Billing | Manual `subscription_status`; no Stripe/PIX |
| CNPJ registry | Real public API when reachable; tests may mock the port |
| AI | File parse + preview + confirm; optional LLM header map; no tool platform |
| Courier assignment | Any tenant courier may deliver |
| Payments | Pedido is unpaid request |

### Later (explicitly out)

- Native apps; marketplace of unrelated sellers; multi-country tax; analytics dashboards.
- Payment gateway / PIX checkout; NF-e; returns; customer self-cancel.
- Multi-warehouse; courier assignment, routing, GPS.
- Self-serve tenant wizard; Account team; seller territories / credit limits.
- Coupons, shipping calculator, safety stock, rich media PDP.
- Languages other than pt-BR.

## Open questions

**Resolved for MVP** (do not reopen unless product updates this spec):

| Question | Decision |
|---|---|
| Order status machine | Five-step happy path + `cancelado`; matrix above. |
| Wholesale vs retail | Shared SKUs, dual price lists; CPF varejo / CNPJ atacado. |
| WhatsApp | Stub outbox; not a real provider. |
| Account vs Supervisor | `account_owner` only; supervisor has no billing chrome. |
| Seed / onboarding | Tenant `demo`; no wizard. |
| AI inventory | CSV/XLSX canonical columns; preview; button confirm; absolute on-hand. |

New questions go here only if they **block** a later phase.
