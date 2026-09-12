# MVP

Vertical slice a real Brazilian company can demo in one sitting. Living behavior lives in `docs/product/spec.md`. Testable checks live in `docs/product/mvp-acceptance.md`. Stack is **not** chosen here — architect locks it.

## Problem

Wholesale/retail companies cannot demo one system that takes a customer from CPF/CNPJ signup to a delivered order, with workers (seller, warehouse, courier, supervisor) and a separate subscription switch. The MVP is that path, thin in every module, not a brochure of future screens.

## Who (role / customer)

| Actor | Job in the demo |
|---|---|
| **Cliente varejo (CPF)** | Registers, sees retail price + store stock, places an order, receives status notices |
| **Cliente atacado (CNPJ)** | Same path with wholesale price and MOQ |
| **Vendedor** | Confirms/cancels new orders, sees pipeline and outbox notices |
| **Estoquista** | Sees reserved stock move, separates, marks dispatched |
| **Entregador** | Marks dispatched orders as delivered |
| **Supervisor** | Store stock visibility, theme, CPF/CNPJ + notification flags, AI inventory chat |
| **Dono da conta (Account)** | Sees plan state; flips manual entitlement; SaaS/Store obey it |

Success metric: one seeded tenant, no onboarding wizard, every role completes its step without a second stock ledger or billing chrome inside operations.

## Scope (in / out)

### In (thin, all required modules)

- Three surfaces: Store, SaaS, Account (separate chrome).
- Tenant isolation + RBAC (`supervisor`, `vendedor`, `estoquista`, `entregador`). `account_owner` is orthogonal and only opens Account.
- Shared SKUs, dual price lists (`preco_varejo` / `preco_atacado`), CPF → varejo, CNPJ → atacado.
- Store catalog = projection of storage (`visivel_loja` + available = on-hand − reserved).
- Orders from Store (customer) or SaaS (seller/supervisor). Status machine locked in the spec.
- Notifications on every status change to **customer and seller** via tenant channels; **email and WhatsApp are outbox stubs**.
- Supervisor AI inventory chat: one CSV/XLSX → parse → preview → **Confirmar** → apply.
- Theme: brand name, primary, accent, background, logo. Store + SaaS consume tokens; Account stays product chrome.
- Account: manual plan flag (`ativa` / `inadimplente` / `cancelada`). No payment gateway.
- Seed tenant `demo` with users, SKUs, orders in each status, theme, `ativa` plan.
- pt-BR, LGPD (mask tax IDs, never log full CPF/CNPJ), checksum always; CNPJ registry lookup with explicit degrade.

### Out

- Native apps, marketplace, multi-country tax, analytics dashboards.
- Stripe/PIX/payment capture (pedido is a **request**, not a paid checkout).
- Multi-warehouse, courier assignment/GPS, returns, NF-e, customer self-cancel.
- Self-serve tenant onboarding wizard, Account team invites, seller territories.
- Meta WhatsApp API, SMTP-as-required (optional later), full agent platform / multi-turn tools.
- Coupons, shipping calculator, credit limits, safety stock, rich PDP galleries, i18n besides pt-BR.

### Locked decisions (do not reopen in implementation)

1. **Status machine** — `novo` → `confirmado` → `separando` → `despachado` → `entregue`, plus `cancelado`. Who moves what: see Permissions and spec.
2. **Wholesale/retail** — one SKU, two prices, document type picks list. Not two catalogs.
3. **WhatsApp** — stub outbox only. Email same outbox (no Meta, no required SMTP).
4. **Account vs Supervisor** — Supervisor never sees billing. Account is `account_owner` only. Same human may hold both (seed `dono`), but chrome stays split.
5. **Seed** — tenant `demo` is the only way in. No wizard.
6. **AI inventory** — file parse in a chat thread, canonical columns below, button confirm, not an agent OS.

## UX surfaces (store / saas / account)

Copy is **pt-BR**. Theme tokens apply to Store and SaaS only.

### Store

- Catalog (guest sees varejo prices; logged-in CNPJ sees atacado + MOQ).
- Product detail, cart, place order (auth required — no guest checkout).
- Register / login (CPF and/or CNPJ per tenant flags).
- Meus pedidos + detail (status + history).
- Entitlement `inadimplente`/`cancelada`: browse ok, checkout blocked with explicit reason.

### SaaS

- Login; role-aware nav (no Account/billing items).
- Pedidos: list + detail + allowed transitions only.
- Estoque: on-hand, reserved, available, movements.
- Supervisor: `visivel_loja` toggles; theme editor; config (CPF/CNPJ, canais de aviso); **Chat de estoque**; outbox read.
- Seller: orders + outbox for notices on those orders.
- Warehouse: queue `confirmado` / `separando` / `despachado`; optional simple qty adjust + reason.
- Courier: queue `despachado` → `entregue` (any courier on the tenant; no assignment).
- Entitlement not `ativa`: read-only banner; writes blocked except Account owner on Account.

### Account

- Login for `account_owner` only.
- Plan name + status + manual actions: reativar / marcar inadimplente / cancelar.
- Zero operational nav (no pedidos, estoque, tema).

## Permissions

Enforced in the API. UI only hides what the API already denies. One SaaS role per user per tenant. `account_owner` does not imply supervisor.

| Action | Supervisor | Vendedor | Estoquista | Entregador | Cliente | Account owner |
|---|---|---|---|---|---|---|
| Store: register / own orders | | | | | yes | |
| Store: create order | | | | | yes if `ativa` | |
| SaaS: create order | yes | yes | | | | |
| List all tenant orders | yes | yes | queue* | queue* | own | |
| `novo` → `confirmado` | yes | yes | | | | |
| `novo` → `cancelado` | yes | yes | | | | |
| `confirmado` → `separando` | yes | | yes | | | |
| `confirmado` → `cancelado` | yes | yes | | | | |
| `separando` → `despachado` | yes | | yes | | | |
| `separando` → `cancelado` | yes | | | | | |
| `despachado` → `entregue` | yes | | | yes | | |
| View on-hand / movements | yes | read | yes | | projection | |
| Manual qty adjust | yes | | yes | | | |
| `visivel_loja` / theme / tax+notify config | yes | | | | | |
| AI inventory chat apply | yes | | | | | |
| Notification outbox | yes | read | | | | |
| Account plan flag | | | | | | yes |

\*Estoquista queue: `confirmado`, `separando`, `despachado`. Entregador queue: `despachado`, `entregue`.

Stock: `novo` does not touch qty. `confirmado` **reserves**. `despachado` **consumes** (on-hand −=, reserve −=). Cancel before `despachado` releases reserve. No cancel after `despachado` in MVP.

## Data and integrations (CNPJ, WhatsApp, email, files, billing)

| Concern | MVP rule |
|---|---|
| **CPF/CNPJ** | Tenant `aceita_cpf` / `aceita_cnpj` (at least one). Checksum always. CNPJ: public registry (e.g. BrasilAPI). Registry down → checksum ok, warn, save `cnpj_registro_pendente`. Mask in UI/logs. |
| **WhatsApp + email** | `notification_outbox` rows (`pendente`/`enviado`/`falha`). Adapters are stubs that mark `enviado`. Tenant `canais_aviso`: `email`, `whatsapp`, `ambos`. |
| **Files** | Chat upload CSV/XLSX. Columns: `sku` (req), `nome` (req on create), `quantidade` (req, **absolute on-hand**), `preco_varejo`, `preco_atacado`, `qtd_min_atacado`, `visivel_loja`. Header synonyms ok. Preview + **Confirmar aplicação**. Invalid rows listed, never silent overwrite. |
| **Billing** | Manual `subscription_status` on tenant. No Stripe. Writes require `ativa`. |
| **CNPJ lookup stub** | If registry client is mocked in tests, still run checksum; document the port. |

Canonical AI columns and status/stock rules are duplicated in the spec so specialists do not invent a second contract.

## Acceptance criteria

Must be demonstrable on seed tenant `demo` without a wizard. Full checklist: `docs/product/mvp-acceptance.md`.

1. CPF customer and CNPJ customer register (checksum + CNPJ lookup path), see the correct price list and store projection, and place an order (`novo`).
2. Seller moves `novo` → `confirmado`; qty reserves; customer + seller outbox rows exist for configured channels.
3. Warehouse moves `confirmado` → `separando` → `despachado`; on-hand drops on dispatch; courier moves `despachado` → `entregue`.
4. Supervisor toggles `visivel_loja`, changes theme (Store/SaaS update), toggles CPF/CNPJ flags, and applies an inventory file via chat preview + confirm.
5. Account owner sets `inadimplente`; store checkout and SaaS writes fail server-side; Account chrome has no operational nav.
6. Cross-tenant reads fail. Roles cannot fire transitions they do not own. No second stock ledger.

## Specialist tasks

- **architect:** Lock stack in `docs/architecture/`. Model tenant, users, roles, `account_owner`, SKU (dual prices, MOQ, `visivel_loja`), inventory ledger (on-hand, reserved, movements — **one** ledger), orders + lines (frozen unit price) + status history, notification outbox, theme tokens, subscription flag, AI import batch (preview vs applied). APIs for all surfaces; RBAC + entitlement middleware; CNPJ port; outbox ports; file-parse port. Threats: IDOR, tax-ID leakage, client-trusted prices/roles/stock. Seed `demo`. Contracts frontend/backend must share. Do not invent a second stock or put billing in SaaS nav.

- **design:** pt-BR flows and tokens for Store (catalog, PDP, cart, register CPF/CNPJ, orders), SaaS (role shells, order detail + legal transitions, stock, visibility, theme editor, config, chat preview/confirm, outbox), Account (plan + three manual states). Empty, error, registry-down, entitlement-blocked, parse-error states. Theme tokens: marca, primary, accent, background, logo. Account chrome visually distinct. Accessibility for forms and status actions. Spec + this brief are the IA; do not add modules.

- **frontend:** Implement the screens in the brief against architect contracts and design tokens only. Role-aware SaaS nav. Store applies tenant theme. Hide illegal transitions. Chat: upload → preview table → confirm button → result (no fake apply). Account: plan flag only. Seed logins documented in spec. No invented endpoints, prices, or stock math.

- **backend:** Implement domain + APIs per architect. Status machine and permission matrix are closed — reject illegal transitions. Reserve on `confirmado`, consume on `despachado`, release on cancel-before-dispatch. Projection endpoint for store. CPF/CNPJ checksum + registry port. Outbox on each status change (customer + seller). AI parse → preview id → confirm apply (absolute qty). Entitlement gate. Seed `demo`. LGPD: no full tax IDs in logs. Tests for isolation, RBAC, stock, import confirm.

- **qa:** `docs/product/mvp-acceptance.md` is the sign-off list. Run every role on `demo`. Prove projection ≠ second ledger, outbox instead of Meta, entitlement blocks writes, chat cannot apply without confirm, CNPJ degrade path, cross-tenant 404/403. PASS only if the one-sitting demo works; otherwise FAIL with repro.
