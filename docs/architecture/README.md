# Architecture

Contracts for frontend and backend. Product behavior stays in `docs/product/`. Visual tokens stay in `docs/design/`. Do not reopen locked product decisions here.

| Doc | Owns |
|---|---|
| [stack.md](./stack.md) | Runtime, folders, how to run |
| [data-model.md](./data-model.md) | Entities, indexes, status machine, stock movements |
| [api.md](./api.md) | Endpoints, authz, error envelope |
| [openapi.yaml](./openapi.yaml) | Machine-readable HTTP contract (subset; types in `packages/shared` are canonical) |
| [authz.md](./authz.md) | RBAC + entitlement middleware |
| [threats.md](./threats.md) | IDOR, tax-ID leak, client-trusted fields, uploads |
| [seed.md](./seed.md) | Tenant `demo` exact contract |
| [ports.md](./ports.md) | CNPJ registry, outbox, file parse |
| [ownership.md](./ownership.md) | Who may edit which folders |

One inventory ledger. One order pipeline. Theme is data. Billing never appears in SaaS nav.
