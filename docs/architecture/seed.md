# Seed contract — tenant `demo`

`npm run db:seed` must realize this table exactly. Password (dev only): `Demo@1234`.

There is **no** onboarding wizard. QA signs in with these emails.

## Tenant

| Field | Value |
|---|---|
| `slug` | `demo` |
| `nome` | `Norte Atacado` |
| `aceita_cpf` | `true` |
| `aceita_cnpj` | `true` |
| `canais_aviso` | `ambos` |
| `subscription_status` | `ativa` |
| `plan_display_name` | `Plano Demo` |
| `default_seller_user_id` | user `vendedor@demo.local` |

## Theme (must be visibly non-default)

Matches `docs/design/tokens.md` seed.

| Field | Value |
|---|---|
| `marca` | `Norte Atacado` |
| `primary` | `#0F4F3E` |
| `accent` | `#C2410C` |
| `background` | `#F6EFE3` |
| `logo_url` | `null` |

## Users

| Email | Surfaces / role | Notes |
|---|---|---|
| `dono@demo.local` | Account owner **and** supervisor | two chromes |
| `supervisora@demo.local` | Supervisor only | Account denied |
| `vendedor@demo.local` | Vendedor | default Store-order assignee |
| `estoque@demo.local` | Estoquista | |
| `entregador@demo.local` | Entregador | |
| `cliente.cpf@demo.local` | Store customer, CPF, varejo | digits `52998224725` (valid checksum) |
| `cliente.cnpj@demo.local` | Store customer, CNPJ, atacado | digits `11222333000181` (valid checksum); `cnpj_registro_pendente = false` |

`whatsapp` on customers and `vendedor` may be fixture strings (`+5511999990001` etc.) so outbox has a recipient. Do not log them.

## SKUs (minimum)

| `codigo` | Dual prices | MOQ | `visivel_loja` | Ledger | Purpose |
|---|---|---|---|---|---|
| `CAMISETA-BASICA` | yes | 1 | true | available &gt; 0 | happy path |
| `KIT-ATACADO-10` | yes | **10** | true | available ≥ 10 | MOQ |
| `OCULTO-INTERNO` | yes | 1 | **false** | any | hidden from Store |
| `ESGOTADO-VITRINE` | yes | 1 | true | **available = 0** | “sem estoque” |

Suggested balances (seed may use these exact numbers):

| codigo | on_hand | reserved | available |
|---|---|---|---|
| `CAMISETA-BASICA` | 50 | 5 | 45 |
| `KIT-ATACADO-10` | 80 | 0 | 80 |
| `OCULTO-INTERNO` | 20 | 0 | 20 |
| `ESGOTADO-VITRINE` | 2 | 2 | 0 |

`reserved` on CAMISETA and ESGOTADO must match open orders in `confirmado` / `separando` (see below).

Example prices (centavos): camiseta 5990 / 3990; kit 19900 / 14900; oculto 1000 / 800; esgotado 8900 / 7000.

## Orders (one per status)

All attributed to seed customers; Store-channel orders use seller `vendedor@demo.local`.

| id (stable slug ok) | status | customer | stock already applied |
|---|---|---|---|
| `ped-novo` | `novo` | CPF | none |
| `ped-confirmado` | `confirmado` | CPF | reserve CAMISETA ×3 |
| `ped-separando` | `separando` | CNPJ | reserve CAMISETA ×2 |
| `ped-despachado` | `despachado` | CPF | consume already reflected in on_hand |
| `ped-entregue` | `entregue` | CNPJ | consume already reflected |
| `ped-cancelado` | `cancelado` | CPF | canceled from `novo` — no stock |

Each order has ≥1 line with frozen `unit_price_centavos` and a status history ending at the current status.

`ESGOTADO-VITRINE` reserved 2 belongs to `ped-confirmado` **or** a dedicated confirmado line — do not leave reserved qty without a live reserve.

## Outbox

At least one `enviado` example row per channel (`email`, `whatsapp`) for a status change, so Avisos is not empty. Template `pedido.status_alterado`. Payload without full tax IDs.

## Reset

`npm run db:reset` must return to this contract. Do not add a second demo tenant in the default seed (isolation tests create their own).
