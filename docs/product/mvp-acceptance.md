# MVP acceptance

Sign-off list for QA. Behavior source: `docs/product/spec.md` and `docs/product/mvp.md`. Seed tenant `demo` is required. PASS only if every item holds.

## Demo tenant

- Users in spec seed table login with the documented password.
- SKUs include at least one hidden from store, one zero-available, dual prices, and a wholesale MOQ > 1.
- Orders exist in `novo`, `confirmado`, `separando`, `despachado`, `entregue`, `cancelado`.
- Subscription starts `ativa`. Theme tokens are non-default enough to see a change.

## Store

- Guest catalog shows **varejo** prices and only `visivel_loja` SKUs; available qty = on-hand − reserved.
- Hidden SKU does not appear. Visible SKU with 0 available shows indisponível and cannot be ordered.
- Register CPF (valid checksum) when `aceita_cpf`. Register CNPJ (checksum + registry or explicit degrade) when `aceita_cnpj`. Invalid checksum rejected.
- Tenant with only CPF hides CNPJ path (and the reverse).
- After login, CPF sees varejo; CNPJ sees atacado and cannot submit below `qtd_min_atacado`.
- No guest checkout. Place order → `novo`, line prices frozen from the list in force.
- Meus pedidos shows own orders only and status history.
- Full CPF/CNPJ not printed in page source logs of the happy path (masked).

## SaaS — seller

- Sees all tenant orders. Creates an order for a customer.
- `novo` → `confirmado` and `novo`/`confirmado` → `cancelado`. Cannot move to `separando`, `despachado`, or `entregue`.
- Confirm creates reservation; cancel before dispatch releases it. Store available updates.
- Cannot open Account or theme/tax config.

## SaaS — warehouse

- Queue is `confirmado`, `separando`, `despachado`. Cannot confirm a `novo` order.
- `confirmado` → `separando` → `despachado`. Dispatch decrements on-hand and consumes reserve. Movement log has both reserve and consume (or equivalent one-ledger entries).
- Optional qty adjust with reason changes on-hand only on this ledger.
- Cannot edit theme or apply AI import.

## SaaS — courier

- Sees `despachado` and `entregue`. `despachado` → `entregue` only. No stock edits.

## SaaS — supervisor

- All legal transitions, including `separando` → `cancelado`.
- Toggle `visivel_loja` changes Store catalog without changing on-hand.
- Theme save updates Store and SaaS tokens; Account chrome unchanged.
- Config: CPF/CNPJ flags (at least one remains true); notification channels.
- Chat: upload CSV/XLSX → preview (creates/updates/errors) → **Confirmar aplicação** writes absolute `quantidade`. Closing the preview without confirm writes nothing. Bad rows listed; good rows apply.
- Outbox readable.

## Notifications

- Every status change inserts outbox rows for **customer and seller** for each enabled channel (`email`, `whatsapp`, or both).
- No Meta/WhatsApp provider call is required. Stub marks `enviado`. QA asserts rows, recipients, template/status payload.

## Account and entitlements

- Only `account_owner` opens Account. Supervisor-only user is denied.
- Account has no pedidos/estoque/tema nav.
- Flag → `inadimplente` or `cancelada`: Store checkout 4xx with reason; SaaS mutations 4xx; reads may remain. Flag → `ativa` restores writes.
- Seed `dono` may be both owner and supervisor but must use **separate chrome**.

## Isolation and security

- Authenticated user from tenant A cannot read/write tenant B orders, SKUs, or outbox (403/404).
- Client cannot set role, unit price, or available qty on create/confirm.
- Illegal transition = 409/403, no side effects on stock or outbox.

## Cross-cutting

- UI copy pt-BR on all three surfaces.
- CNPJ registry timeout/5xx: register still allowed after checksum; user sees warning; `cnpj_registro_pendente` set.
- No second inventory table driving the store.
