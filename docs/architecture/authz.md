# Authz and entitlement

Enforced in `apps/web/src/server/authz/`. UI only hides what the API already denies. Never trust client `role`, `account_owner`, `unit_price`, or `available`.

## Surfaces

| Surface | Cookie | Who may obtain a session |
|---|---|---|
| Store | `sf_sessao_loja` | `membership.is_customer` |
| SaaS | `sf_sessao_saas` | `membership.saas_role` is non-null |
| Account | `sf_sessao_conta` | `membership.account_owner === true` |

`dono` has both `account_owner` and `supervisor` — two logins, two cookies, two chromes. Supervisor-only (`supervisora`) **cannot** open Account (403).

Middleware order on every `/api/{loja,saas,conta}/*` except public GETs and login/register:

1. Resolve tenant (session, or slug on public Store reads).
2. Load membership for `(user_id, tenant_id)` — 401 if missing.
3. **Surface gate**: session.surface must match the API prefix.
4. **Entitlement gate** on writes (below).
5. **Role gate** for the action.
6. Handler runs queries **always** `WHERE tenant_id = session.tenantId`.

Cross-tenant IDs → **404** (do not leak existence). Wrong role → **403**. Illegal state transition → **409**. Entitlement block → **403** `entitlement_bloqueada`.

## Entitlement

Source of truth: `tenants.subscription_status` (Account writes).

| Status | Store browse | Store checkout | SaaS reads | SaaS writes | Account flag change |
|---|---|---|---|---|---|
| `ativa` | yes | yes | yes | yes | yes |
| `inadimplente` | yes | **no** | yes | **no** | yes |
| `cancelada` | yes | **no** | yes | **no** | yes |

Writes that require `ativa`:

- `POST /api/loja/pedidos`
- `POST /api/saas/pedidos`
- `POST /api/saas/pedidos/:id/transicao`
- inventory adjust, visibility, theme PUT, config PUT, import upload/confirm

Account `POST /api/conta/assinatura` is **not** gated on `ativa` (owner must be able to reactivate).

Public catalog and theme GET are not gated.

## Role matrix (SaaS)

One `saas_role` per membership. `account_owner` grants nothing here.

| Action | supervisor | vendedor | estoquista | entregador |
|---|---|---|---|---|
| List/detail orders | all tenant | all tenant | queue `confirmado`, `separando`, `despachado` | queue `despachado`, `entregue` |
| Create order | yes | yes | no | no |
| `novo` → `confirmado` / `cancelado` | yes | yes | no | no |
| `confirmado` → `separando` | yes | no | yes | no |
| `confirmado` → `cancelado` | yes | yes | no | no |
| `separando` → `despachado` | yes | no | yes | no |
| `separando` → `cancelado` | yes | no | no | no |
| `despachado` → `entregue` | yes | no | no | yes |
| View balances + movements | yes | read | yes | no |
| Manual adjust | yes | no | yes | no |
| `visivel_loja` / theme / tax+notify config | yes | no | no | no |
| AI import preview + apply | yes | no | no | no |
| Read outbox | yes | yes | no | no |

Store customer: own orders only; create when `ativa`; never transition.

## Helpers (contract)

```ts
requireSession(surface)
requireCustomer()
requireSaasRole(...roles)
requireAccountOwner()
requireEntitlementAtiva() // throws entitlement_bloqueada
assertTenantScope(row.tenant_id, session.tenantId)
```

Implementation lives in `src/server/authz/`. Domain services call these; they do not re-implement role checks in the UI.

## Logging

Log `tenant_id`, `user_id`, `surface`, `action`. Do **not** log `document_digits`, raw WhatsApp, or full session tokens. Mask as `***` + last4 if a debugger field is required.
